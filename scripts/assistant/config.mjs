import { readFileSync } from 'node:fs';
import { z } from 'zod';
export const modelPolicySchema = z.object({
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), source: z.string().url(),
  model: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/),
  contextTokens: z.number().int().positive(), maximumPromptPricePerMillion: z.number().finite().positive(),
  maximumCompletionPricePerMillion: z.number().finite().positive(), authorizedBudgetUsd: z.number().finite().positive(),
  maxJournalBytes: z.number().int().positive(), maxReservations: z.number().int().positive(),
}).strict();
export const modelPolicy = modelPolicySchema.parse(JSON.parse(readFileSync(new URL('../../config/assistant-model-policy.json', import.meta.url), 'utf8')));

const localOrigin = z.string().url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
    !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
}, 'Only an explicit local HTTP origin is supported');
const visitorOrigin = z.string().url().refine(value => {
  const url = new URL(value);
  return (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === '127.0.0.1')) &&
    !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash && value === url.origin;
}, 'An exact HTTPS or loopback HTTP origin is required');
const schema = z.object({
  bindHost: z.literal('127.0.0.1'), port: z.number().int().min(1).max(65535),
  ollamaOrigin: localOrigin, model: z.string().regex(/^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+$/),
  allowedOrigins: z.array(visitorOrigin).min(1), enabled: z.boolean(), localEnabled: z.boolean(),
  bodyBytes: z.number().int().positive().max(65536),
  questionCharacters: z.number().int().positive().max(2000),
  maxTurns: z.number().int().positive().max(20),
  upstreamBytes: z.number().int().positive().max(65536),
  timeoutMs: z.number().int().positive().max(120000),
  shutdownGraceSeconds: z.number().int().positive().max(180),
  localTimeoutMs: z.number().int().positive().max(60000),
  bodyTimeoutMs: z.number().int().positive(), headersTimeoutMs: z.number().int().positive(),
  keepAliveTimeoutMs: z.number().int().positive(), maxConnections: z.number().int().positive(),
  maxConcurrent: z.number().int().positive().max(4), requestsPerWindow: z.number().int().positive(),
  perClientRequestsPerWindow: z.number().int().positive(), maxClientBuckets: z.number().int().positive().max(10000),
  trustProxyHeaders: z.boolean(),
  windowMs: z.number().int().positive(), maxRequestsPerProcess: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive().max(128), contextTokens: z.number().int().positive().max(4096),
  temperature: z.literal(0), keepAlive: z.string().regex(/^\d+[sm]$/),
  openrouter: z.object({
    enabled: z.boolean(), origin: z.literal('https://openrouter.ai'),
    model: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/),
    providers: z.array(z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9._-]+)*$/)).length(1),
    maxOutputTokens: z.number().int().positive().max(256),
    contextTokens: z.number().int().positive().max(262144),
    maxInputBytes: z.number().int().positive().max(32768),
    maxPrice: z.object({prompt: z.number().positive().max(modelPolicy.maximumPromptPricePerMillion), completion: z.number().positive().max(modelPolicy.maximumCompletionPricePerMillion), request: z.literal(0)}).strict(),
    budgetUsd: z.number().positive().max(modelPolicy.authorizedBudgetUsd), dataCollection: z.literal('deny'), zeroDataRetention: z.literal(true),
  }).strict().refine(value => value.model === modelPolicy.model && value.contextTokens === modelPolicy.contextTokens,
    'Model and reservation context must match the verified pricing cohort'),
}).strict().refine(value => value.shutdownGraceSeconds * 1000 > value.timeoutMs,
  'Shutdown grace must exceed the complete request deadline');

export function loadAssistantConfig(env = process.env) {
  const base = JSON.parse(readFileSync(new URL('../../config/assistant.json', import.meta.url), 'utf8'));
  const fields = {
    CHRONOS_ASSISTANT_PORT: ['port', Number],
    CHRONOS_ASSISTANT_OLLAMA_ORIGIN: ['ollamaOrigin', String],
    CHRONOS_ASSISTANT_MODEL: ['model', String],
    CHRONOS_ASSISTANT_ALLOWED_ORIGINS: ['allowedOrigins', value => value.split(',').map(v => v.trim())],
    CHRONOS_ASSISTANT_ENABLED: ['enabled', value => z.enum(['true', 'false']).parse(value) === 'true'],
    CHRONOS_ASSISTANT_TRUST_PROXY_HEADERS: ['trustProxyHeaders', value => z.enum(['true', 'false']).parse(value) === 'true'],
  };
  for (const [key, [field, convert]] of Object.entries(fields)) {
    if (env[key] !== undefined) {
      const value = convert(env[key]);
      // Runtime overrides may disable an approved feature, never lift its maintained deferral.
      base[field] = field === 'enabled' ? base.enabled && value : value;
    }
  }
  if (env.CHRONOS_ASSISTANT_OPENROUTER_ENABLED !== undefined) {
    const requested = z.enum(['true', 'false']).parse(env.CHRONOS_ASSISTANT_OPENROUTER_ENABLED) === 'true';
    base.openrouter.enabled = base.openrouter.enabled && requested;
  }
  return schema.parse(base);
}

// Read only in the server process. Never import credentials into client configuration.
export function loadProviderSecrets(env = process.env) {
  const key = env.CHRONOS_ASSISTANT_OPENROUTER_KEY_FILE
    ? readFileSync(env.CHRONOS_ASSISTANT_OPENROUTER_KEY_FILE, 'utf8').trim()
    : env.CHRONOS_ASSISTANT_OPENROUTER_KEY?.trim();
  if (key !== undefined && !/^sk-or-[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid provider credential');
  return {key, budgetPath: env.CHRONOS_ASSISTANT_BUDGET_FILE};
}

const internalLink = z.object({label: z.string().min(1), href: z.string().regex(/^\/[a-z]+$/)}).strict();
const topic = z.object({
  id: z.string().regex(/^[a-z]+$/), label: z.string().min(1), description: z.string().min(1),
  answer: z.string().min(1).max(2000), source: internalLink,
}).strict();
export function loadKnowledge() {
  const data = JSON.parse(readFileSync(new URL('../../src/content/assistant.json', import.meta.url), 'utf8'));
  const knowledge = z.object({
    version: z.string().min(1), owner: z.string().min(1), classifierInstruction: z.string().min(1),
    unknown: z.string().min(1), topics: z.array(topic).min(1).max(20),
    refusalPatterns: z.array(z.string().min(1)), sensitivePatterns: z.array(z.string().min(1)),
  }).passthrough().parse(data);
  if (new Set(knowledge.topics.map(t => t.id)).size !== knowledge.topics.length) {
    throw new Error('Duplicate approved topic');
  }
  return knowledge;
}

// Versioned API paths are protocol invariants, owned here rather than duplicated.
const protocolPath = z.string().regex(/^\/[a-z0-9]+(?:[/-][a-z0-9]+)*$/);
export const protocolSchema = z.object({message: protocolPath, health: protocolPath, generate: protocolPath,
  chatCompletions: protocolPath, tokensPerMillion: z.literal(1_000_000)}).strict();
export const protocol = Object.freeze(protocolSchema.parse(
  JSON.parse(readFileSync(new URL('../../config/assistant-protocol.json', import.meta.url), 'utf8'))));
