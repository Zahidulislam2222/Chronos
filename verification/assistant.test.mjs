import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { loadAssistantConfig, loadKnowledge, protocol } from '../scripts/assistant/config.mjs';
import { classify, createAssistantServer, readBounded } from '../scripts/assistant/service.mjs';

const knowledge = loadKnowledge();
// Provider contract tests explicitly enable the synthetic local endpoint.
const config = {...loadAssistantConfig({}), localEnabled: true};
const origin = config.allowedOrigins[0];
const valid = {question: 'How does test checkout work?', previousTopic: null};
const generated = topic => new Response(JSON.stringify({done: true, response: JSON.stringify({topic})}));

test('an environment override can disable the approved guide', () => {
  assert.equal(loadAssistantConfig({CHRONOS_ASSISTANT_ENABLED: 'true'}).enabled, config.enabled);
  assert.equal(loadAssistantConfig({CHRONOS_ASSISTANT_ENABLED: 'false'}).enabled, false);
});
async function running(t, transport = async () => generated('checkout'), overrides = {}) {
  const service = createAssistantServer({config: {...config, enabled: true, perClientRequestsPerWindow: config.requestsPerWindow, ...overrides}, knowledge, transport, log: () => {}});
  await new Promise(resolve => service.listen(0, config.bindHost, resolve));
  t.after(() => new Promise(resolve => { service.closeAllConnections(); service.close(resolve); }));
  const base = `http://${config.bindHost}:${service.address().port}`;
  const post = (value = valid, options = {}) => fetch(base + protocol.message, {
    method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify(value), ...options});
  return {service, base, post};
}

test('only local model endpoints and exact boolean configuration are accepted', () => {
  for (const url of ['https://api.example', 'http://localhost:11434', 'http://127.0.0.1:11434/extra', 'http://127.0.0.1:11434/?token=fake']) {
    assert.throws(() => loadAssistantConfig({CHRONOS_ASSISTANT_OLLAMA_ORIGIN: url}));
  }
  assert.throws(() => loadAssistantConfig({CHRONOS_ASSISTANT_ENABLED: 'yes'}));
});

test('real HTTP returns curated answer and source, no arbitrary model prose', async t => {
  const {post} = await running(t);
  const response = await post(); const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(body.answer, knowledge.topics.find(topic => topic.id === 'checkout').answer);
  assert.equal(body.source.href, '/cart');
  assert.match(body.requestId, /^[0-9a-f-]+$/);
});

test('denied Origin, Host, method, media type and input never reach inference', async t => {
  let calls = 0;
  const {base, post} = await running(t, async () => { calls++; return generated('checkout'); });
  assert.equal((await post(valid, {headers: {Origin: 'https://evil.example', 'Content-Type': 'application/json'}})).status, 403);
  assert.equal((await post(valid, {headers: {'Content-Type': 'application/json'}})).status, 403);
  const deniedHost = await new Promise((resolve, reject) => {
    const request = httpRequest(base + protocol.message, {method: 'POST',
      headers: {Origin: origin, Host: 'evil.example', 'Content-Type': 'application/json'}}, response => {
      response.resume(); response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject); request.end(JSON.stringify(valid));
  });
  assert.equal(deniedHost, 403);
  assert.equal((await fetch(base + protocol.message)).status, 405);
  assert.equal((await post(valid, {headers: {Origin: origin, 'Content-Type': 'text/plain'}})).status, 415);
  assert.equal((await post({...valid, question: 'x'.repeat(config.bodyBytes)})).status, 413);
  assert.equal((await post({...valid, previousTopic: 'private-user'})).status, 400);
  assert.equal((await post({...valid, extra: 'untrusted'})).status, 400);
  assert.equal((await post({...valid, question: '   '})).status, 400);
  assert.equal((await post(valid, {body: '{'})).status, 400);
  assert.equal(calls, 0);
});

test('invalid, poisoned, incomplete and oversized provider output fails closed', async t => {
  for (const response of [generated('unknown-action'), new Response('not json'),
    new Response(JSON.stringify({done: false, response: '{"topic":"checkout"}'})),
    new Response(JSON.stringify({done: true, response: '{"topic":"checkout","answer":"injected"}'})),
    new Response('x'.repeat(config.upstreamBytes + 1)), new Response('', {status: 500})]) {
    const {post} = await running(t, async () => response);
    assert.equal((await post()).status, 503);
  }
});

test('unknown answers cite no invented source', async t => {
  const {post} = await running(t, async () => generated('unknown'));
  const body = await (await post()).json();
  assert.equal(body.answer, knowledge.unknown); assert.equal(body.source, null);
});

test('disabled guide fails without inference; health is configuration, not model readiness', async t => {
  let calls = 0;
  const {base, post} = await running(t, async () => { calls++; return generated('checkout'); }, {enabled: false});
  assert.equal((await post()).status, 503);
  assert.equal((await fetch(base + protocol.health)).status, 503);
  assert.equal(calls, 0);
});

test('global rate and process quota fail closed without retries', async t => {
  const {post} = await running(t, undefined, {requestsPerWindow: 1});
  assert.equal((await post()).status, 200); assert.equal((await post()).status, 429);
  const second = await running(t, undefined, {maxRequestsPerProcess: 1});
  assert.equal((await second.post()).status, 200); assert.equal((await second.post()).status, 429);
});

test('trusted proxy identity is required, bounded and isolated per client', async t => {
  let calls = 0;
  const {post} = await running(t, async () => { calls++; return generated('checkout'); },
    {trustProxyHeaders: true, perClientRequestsPerWindow: 1, maxClientBuckets: 2});
  const headers = address => ({Origin: origin, 'Content-Type': 'application/json', 'X-Chronos-Client-IP': address});
  assert.equal((await post()).status, 403);
  assert.equal((await post(valid, {headers: headers('not-an-address')})).status, 403);
  assert.equal((await post(valid, {headers: headers('192.0.2.1')})).status, 200);
  assert.equal((await post(valid, {headers: headers('192.0.2.1')})).status, 429);
  assert.equal((await post(valid, {headers: headers('192.0.2.2')})).status, 200);
  assert.equal((await post(valid, {headers: headers('192.0.2.3')})).status, 429);
  assert.equal(calls, 2);
});

test('concurrent overload is rejected and a timed-out inference releases its slot', async t => {
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const transport = async (_url, {signal}) => {
    started();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true}));
  };
  const {post} = await running(t, transport, {timeoutMs: 100});
  const first = post(); await ready;
  assert.equal((await post()).status, 429);
  assert.equal((await first).status, 503);
  assert.equal((await post()).status, 503);
});

test('client disconnect cancels upstream work before the next request is admitted', async t => {
  let started, cancelled;
  const ready = new Promise(resolve => { started = resolve; });
  const stopped = new Promise(resolve => { cancelled = resolve; });
  let calls = 0;
  const {base, post} = await running(t, async (_url, {signal}) => {
    if (++calls > 1) return generated('project');
    started();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => {cancelled(); reject(new Error('cancelled'));}, {once: true}));
  });
  const cancel = new AbortController();
  const result = fetch(base + protocol.message, {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify(valid), signal: cancel.signal}).catch(() => null);
  await ready; cancel.abort(); await result; await stopped;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await post()).status, 200);
});

test('bounded reader stops chunked responses before parsing', async () => {
  async function* bytes() { yield Buffer.alloc(4); yield Buffer.alloc(4); }
  await assert.rejects(readBounded(bytes(), 7));
});

test('actual HTTP upstream errors are contained without raw body or question logs', async t => {
  const fake = createServer((_request, response) => {response.writeHead(500); response.end('private upstream data');});
  await new Promise(resolve => fake.listen(0, config.bindHost, resolve));
  t.after(() => new Promise(resolve => fake.close(resolve)));
  const messages = [];
  const service = createAssistantServer({config: {...config, enabled: true, ollamaOrigin: `http://${config.bindHost}:${fake.address().port}`}, knowledge, log: value => messages.push(value)});
  await new Promise(resolve => service.listen(0, config.bindHost, resolve));
  t.after(() => new Promise(resolve => service.close(resolve)));
  const response = await fetch(`http://${config.bindHost}:${service.address().port}${protocol.message}`, {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify(valid)});
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private upstream/);
  assert.ok(messages.length); assert.doesNotMatch(messages.join(''), /checkout|private upstream|127\.0/);
});

test('classifier forwards only question and bounded approved context, disables redirects', async () => {
  await classify(valid.question, 'project', {config, knowledge, signal: new AbortController().signal,
    transport: async (url, options) => {
      assert.equal(new URL(url).origin, config.ollamaOrigin);
      const body = JSON.parse(options.body); const prompt = JSON.parse(body.prompt);
      assert.equal(prompt.previousTopic, 'project'); assert.equal(prompt.untrustedVisitorQuestion, valid.question);
      assert.equal(body.options.num_predict, config.maxOutputTokens); assert.equal(options.redirect, 'error');
      return generated('checkout');
    }});
});
