import { z } from "zod";
import content from "@/content/assistant.json";
import limits from "../../config/assistant.json";
import protocol from "../../config/assistant-protocol.json";

const link = z.object({label: z.string().min(1), href: z.string().regex(/^\/[a-z]+$/)});
export const assistantContent = z.object({
  version: z.string(), owner: z.string(), title: z.string(), disclosure: z.string(), privacy: z.string(),
  inputLabel: z.string(), inputPlaceholder: z.string(), send: z.string(), stop: z.string(), reset: z.string(),
  close: z.string(), loading: z.string(), stopped: z.string(), unavailable: z.string(), unknown: z.string(),
  contact: link, feedback: z.string(), questionPrefix: z.string(), answerPrefix: z.string(), sourceLabel: z.string(),
  privacyPolicyTitle: z.string(), privacyPolicy: z.string(),
  suggestions: z.array(z.string()),
  topics: z.array(z.object({id: z.string(), label: z.string(), answer: z.string(), source: link})),
}).parse(content);

export const assistantLimits = z.object({
  questionCharacters: z.number().int().positive(), timeoutMs: z.number().int().positive(),
  maxTurns: z.number().int().positive(),
}).parse(limits);

// Runtime can disable the service; this maintained flag owns launcher visibility.
export const assistantEnabled = z.boolean().parse(limits.enabled);

// Named protocol invariant shared with the guide service's versioned route.
export const assistantEndpoint = protocol.message;
export const assistantReplySchema = z.object({
  topic: z.string(), answer: z.string().max(2000), source: link.nullable(),
  knowledgeVersion: z.literal(assistantContent.version), requestId: z.string().uuid(),
  provider: z.enum(['local', 'openrouter', 'guidance']),
}).refine(reply => reply.topic === "unknown" || assistantContent.topics.some(topic => topic.id === reply.topic));
