import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { loadAssistantConfig, loadKnowledge, loadProviderSecrets, protocol } from './config.mjs';
import { openBudget } from './budget.mjs';

export { protocol };

export async function readBounded(stream, maximum) {
  let size = 0;
  const chunks = [];
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > maximum) throw new Error('Response exceeds byte limit');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function classify(question, previousTopic, {config, knowledge, signal, transport = fetch}) {
  const ids = [...knowledge.topics.map(topic => topic.id), 'unknown'];
  const resultSchema = z.object({topic: z.enum(ids)}).strict();
  const format = {type: 'object', properties: {topic: {type: 'string', enum: ids}}, required: ['topic'], additionalProperties: false};
  const response = await transport(new URL(protocol.generate, config.ollamaOrigin), {
    method: 'POST', redirect: 'error', signal, headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: config.model, stream: false, think: false, format, system: knowledge.classifierInstruction,
      prompt: JSON.stringify({topics: knowledge.topics.map(({id, description}) => ({id, description})),
        previousTopic, untrustedVisitorQuestion: question, responseSchema: format}),
      keep_alive: config.keepAlive,
      options: {temperature: config.temperature, num_predict: config.maxOutputTokens, num_ctx: config.contextTokens},
    }),
  });
  if (!response.ok || !response.body) throw new Error('Guide inference unavailable');
  const raw = JSON.parse(await readBounded(response.body, config.upstreamBytes));
  const envelope = z.object({done: z.literal(true), response: z.string().max(config.upstreamBytes)}).passthrough().parse(raw);
  const selected = resultSchema.parse(JSON.parse(envelope.response));
  const topic = knowledge.topics.find(item => item.id === selected.topic);
  return {topic: selected.topic, answer: topic?.answer ?? knowledge.unknown,
    source: topic?.source ?? null, knowledgeVersion: knowledge.version};
}

export async function classifyRemote(question, previousTopic, {config, knowledge, signal, transport = fetch, remote, observe = () => {}}) {
  signal.throwIfAborted();
  if (!config.openrouter.enabled) throw new Error('Paid route disabled');
  const ids = [...knowledge.topics.map(t => t.id), 'unknown'];
  const selectedSchema = z.object({topic: z.enum(ids)}).strict();
  const prompt = JSON.stringify({topics: knowledge.topics.map(({id, description}) => ({id, description})), previousTopic, untrustedVisitorQuestion: question});
  if (Buffer.byteLength(prompt + knowledge.classifierInstruction, 'utf8') > config.openrouter.maxInputBytes) throw new Error('Prompt exceeds budget');
  const reservation = remote.budget.reserve();
  const response = await transport(new URL(protocol.chatCompletions, config.openrouter.origin), {
    method: 'POST', redirect: 'error', signal,
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${remote.key}`},
    body: JSON.stringify({model: config.openrouter.model, stream: false,
      max_tokens: config.openrouter.maxOutputTokens, temperature: config.temperature,
      messages: [{role: 'system', content: knowledge.classifierInstruction}, {role: 'user', content: prompt}],
      response_format: {type: 'json_schema', json_schema: {name: 'chronos_topic', strict: true, schema: {
        type: 'object', properties: {topic: {type: 'string', enum: ids}}, required: ['topic'], additionalProperties: false,
      }}},
      provider: {only: config.openrouter.providers, allow_fallbacks: false, require_parameters: true, sort: 'price',
        data_collection: config.openrouter.dataCollection, zdr: config.openrouter.zeroDataRetention,
        max_price: Object.fromEntries(Object.entries(config.openrouter.maxPrice).map(([key, value]) => [key, String(value)]))},
    }),
  });
  observe({provider: 'openrouter', status: response.status});
  if (!response.ok || !response.body) throw new Error('Remote guide unavailable');
  const envelope = z.object({
    choices: z.array(z.object({finish_reason: z.literal('stop'), message: z.object({content: z.string()}).passthrough()}).passthrough()).length(1),
    usage: z.object({cost: z.number().finite().nonnegative(),
      cost_details: z.object({upstream_inference_cost: z.number().finite().nonnegative().nullable().optional()}).passthrough().optional(),
    }).passthrough(),
  }).passthrough().parse(JSON.parse(await readBounded(response.body, config.upstreamBytes)));
  // Count any separately reported upstream charge too; conservative if it overlaps credits.
  remote.budget.settle(reservation, envelope.usage.cost + (envelope.usage.cost_details?.upstream_inference_cost ?? 0));
  const selected = selectedSchema.parse(JSON.parse(envelope.choices[0].message.content));
  const topic = knowledge.topics.find(item => item.id === selected.topic);
  return {topic: selected.topic, answer: topic?.answer ?? knowledge.unknown,
    source: topic?.source ?? null, knowledgeVersion: knowledge.version};
}

export async function routeQuestion(question, previousTopic, options) {
  const {config, knowledge, signal, remote} = options;
  const unknown = {topic: 'unknown', answer: knowledge.unknown, source: null, knowledgeVersion: knowledge.version};
  // Deterministic boundaries supplement model instructions; these are not confidence scores.
  if ([...knowledge.refusalPatterns, ...knowledge.sensitivePatterns].some(pattern => new RegExp(pattern, 'iu').test(question))) {
    return {...unknown, provider: 'guidance'};
  }
  let local;
  if (config.localEnabled) {
    try {
      local = await classify(question, previousTopic, {...options,
        signal: AbortSignal.any([signal, AbortSignal.timeout(config.localTimeoutMs)])});
      signal.throwIfAborted();
      if (local.topic !== 'unknown') return {...local, provider: 'local'};
    } catch { signal.throwIfAborted(); }
  }
  if (config.openrouter.enabled && remote) {
    try { return {...await classifyRemote(question, previousTopic, options), provider: 'openrouter'}; }
    catch { signal.throwIfAborted(); }
  }
  if (local) return {...local, provider: 'guidance'};
  throw new Error('No guide provider available');
}

export function createAssistantServer({config = loadAssistantConfig(), knowledge = loadKnowledge(), transport = fetch, log = console.log, remote} = {}) {
  let active = 0;
  let admitted = 0;
  let windowStart = performance.now();
  let windowRequests = 0;
  const clients = new Map();
  const input = z.object({question: z.string().trim().min(1).max(config.questionCharacters),
    previousTopic: z.enum([...knowledge.topics.map(t => t.id), 'unknown']).nullable()}).strict();
  const server = createServer(async (request, response) => {
    const started = performance.now();
    const requestId = randomUUID();
    const controller = new AbortController();
    let abortReason = null;
    let sent = false;
    const deadline = setTimeout(() => {
      abortReason = 'timeout'; controller.abort();
      if (!request.complete) request.destroy();
    }, config.timeoutMs);
    const close = () => { if (!response.writableFinished) { abortReason ??= 'cancelled'; controller.abort(); } };
    response.on('close', close);
    const send = (status, body) => {
      if (response.destroyed) return;
      sent = true;
      response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Connection': 'close'});
      response.end(JSON.stringify({...body, requestId}));
    };
    let claimed = false;
    try {
      const expectedHost = `${config.bindHost}:${server.address()?.port}`;
      if (request.headers.host !== expectedHost) return send(403, {error: 'Forbidden'});
      if (request.url === protocol.health && request.method === 'GET') {
        return send(config.enabled ? 200 : 503, {status: config.enabled ? 'configured' : 'disabled'});
      }
      if (request.url !== protocol.message) return send(404, {error: 'Not found'});
      if (request.method !== 'POST') return send(405, {error: 'Method not allowed'});
      if (!config.allowedOrigins.includes(request.headers.origin)) return send(403, {error: 'Forbidden'});
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers['content-type'] ?? '')) return send(415, {error: 'JSON required'});
      if (!config.enabled) return send(503, {error: 'Guide disabled'});
      if (performance.now() - windowStart >= config.windowMs) { windowStart = performance.now(); windowRequests = 0; clients.clear(); }
      const client = config.trustProxyHeaders ? request.headers['x-chronos-client-ip'] : request.socket.remoteAddress;
      if (typeof client !== 'string' || !isIP(client)) return send(403, {error: 'Client boundary required'});
      const clientRequests = clients.get(client) ?? 0;
      if (clientRequests >= config.perClientRequestsPerWindow || (!clients.has(client) && clients.size >= config.maxClientBuckets)) {
        return send(429, {error: 'Guide limit reached'});
      }
      if (active >= config.maxConcurrent || windowRequests >= config.requestsPerWindow || admitted >= config.maxRequestsPerProcess) {
        return send(429, {error: 'Guide limit reached'});
      }
      active += 1; claimed = true; windowRequests += 1; admitted += 1;
      clients.set(client, clientRequests + 1);
      if (Number(request.headers['content-length'] ?? 0) > config.bodyBytes) return send(413, {error: 'Request too large'});
      request.setTimeout(config.bodyTimeoutMs, () => request.destroy());
      let body;
      try { body = input.parse(JSON.parse(await readBounded(request, config.bodyBytes))); }
      catch { return send(400, {error: 'Invalid guide request'}); }
      request.setTimeout(0);
      const answer = await routeQuestion(body.question, body.previousTopic, {config, knowledge, signal: controller.signal, transport, remote,
        observe: ({provider, status}) => log(JSON.stringify({requestId, event: 'provider-response', provider, status}))});
      if (!controller.signal.aborted) send(200, answer);
      else send(503, {error: 'Guide request stopped'});
    } catch {
      send(503, {error: 'Guide unavailable'});
    } finally {
      clearTimeout(deadline);
      response.removeListener('close', close);
      if (claimed) active -= 1;
      log(JSON.stringify({requestId, status: sent ? response.statusCode : null,
        outcome: abortReason ?? (sent ? 'responded' : 'disconnected'), durationMs: Math.round(performance.now() - started)}));
    }
  });
  server.maxConnections = config.maxConnections;
  server.headersTimeout = config.headersTimeoutMs;
  server.requestTimeout = config.bodyTimeoutMs;
  server.keepAliveTimeout = config.keepAliveTimeoutMs;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let remote;
  try {
    const config = loadAssistantConfig();
    if (config.openrouter.enabled) {
      const secrets = loadProviderSecrets();
      if (!secrets.key || !secrets.budgetPath) throw new Error('Remote configuration missing');
      // Reserve the complete model context at the enforced maximum price, even for tiny prompts.
      // Uncertain requests keep this reservation; successful billed responses settle to actual cost.
      const reservation = (config.openrouter.contextTokens * config.openrouter.maxPrice.prompt +
        config.openrouter.maxOutputTokens * config.openrouter.maxPrice.completion) / protocol.tokensPerMillion;
      remote = {key: secrets.key, budget: openBudget(secrets.budgetPath, config.openrouter.budgetUsd, reservation)};
    }
    const server = createAssistantServer({config, remote});
    server.on('close', () => remote?.budget.close());
    server.once('error', () => {
      // A bind failure owns no requests. A later listener failure must drain
      // admitted work before releasing its accounting owner on close.
      if (server.listening) server.close();
      else remote?.budget.close();
      console.error('Assistant listener unavailable.');
      process.exitCode = 1;
    });
    server.listen(config.port, config.bindHost, () => console.log(JSON.stringify({service: 'chronos-guide', state: 'listening'})));
    for (const event of ['SIGINT', 'SIGTERM']) process.on(event, () => server.close());
  } catch {
    remote?.budget.close();
    console.error('Assistant configuration invalid; no inference started.');
    process.exitCode = 1;
  }
}
