import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { loadAssistantConfig, loadKnowledge } from './config.mjs';
import { classify } from './service.mjs';
import { outputPath } from '../output-path.mjs';

const [inputFile, outputName] = process.argv.slice(2);
if (!inputFile || !outputName) throw new Error('Pass evaluation JSON and a report path relative to private memory');
const config = loadAssistantConfig();
const knowledge = loadKnowledge();
const ids = [...knowledge.topics.map(topic => topic.id), 'unknown'];
const cases = z.array(z.object({question: z.string().min(1).max(config.questionCharacters),
  previousTopic: z.enum(ids).nullable(), expectedTopic: z.enum(ids)}).strict()).min(1).max(config.maxRequestsPerProcess)
  .parse(JSON.parse(await readFile(inputFile, 'utf8')));
const rows = [];
for (const [index, item] of cases.entries()) {
  const started = performance.now();
  let actual = 'inference-error';
  try {
    actual = (await classify(item.question, item.previousTopic, {config, knowledge, signal: AbortSignal.timeout(config.timeoutMs)})).topic;
  } catch { /* Failure is a failed case, never a fabricated model answer. */ }
  const row = {case: index + 1, expected: item.expectedTopic, actual,
    elapsedMs: Math.round(performance.now() - started), passed: actual === item.expectedTopic};
  rows.push(row); console.log(JSON.stringify(row));
  await writeFile(await outputPath('memory', outputName), JSON.stringify({model: config.model,
    knowledgeVersion: knowledge.version, scope: 'local Ollama classification; no private data or tool actions',
    cases: rows, complete: rows.length === cases.length}, null, 2));
}
if (rows.some(row => !row.passed)) process.exitCode = 1;
