import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {initializeBudget} from '../scripts/assistant/budget.mjs';
import {loadAssistantConfig} from '../scripts/assistant/config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

for (const scenario of ['occupied listener', 'invalid knowledge']) {
test(`paid startup releases its unused accounting lock after ${scenario}`, {timeout: 15000}, async t => {
  const memory = join(root, 'memory');
  mkdirSync(memory, {recursive: true});
  const fixture = mkdtempSync(join(memory, 'assistant-startup-'));
  t.after(() => rmSync(fixture, {recursive: true, force: true}));
  for (const name of ['scripts/assistant', 'config', 'src/content/assistant.json', 'package.json']) {
    cpSync(join(root, name), join(fixture, name), {recursive: true});
  }
  symlinkSync(resolve(root, 'node_modules'), join(fixture, 'node_modules'), 'junction');
  const occupied = createServer();
  await new Promise(done => occupied.listen(0, '127.0.0.1', done));
  t.after(() => new Promise(done => occupied.close(done)));
  const configFile = join(fixture, 'config/assistant.json');
  const config = JSON.parse(readFileSync(configFile, 'utf8'));
  config.openrouter.enabled = true;
  config.port = occupied.address().port;
  writeFileSync(configFile, JSON.stringify(config));
  if (scenario === 'invalid knowledge') writeFileSync(join(fixture, 'src/content/assistant.json'), '{}');
  const budget = join(fixture, 'budget.jsonl');
  initializeBudget(budget, config.openrouter.budgetUsd);
  const child = spawn(process.execPath, [join(fixture, 'scripts/assistant/service.mjs')], {
    cwd: fixture,
    env: {SystemRoot: process.env.SystemRoot, PATH: process.env.PATH,
      CHRONOS_ASSISTANT_OPENROUTER_KEY: 'sk-or-synthetic-startup-only',
      CHRONOS_ASSISTANT_BUDGET_FILE: budget},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let stderr = '';
  let stdout = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdout.on('data', chunk => { stdout += chunk; });
  const exit = await new Promise((done, reject) => { child.on('error', reject); child.on('exit', done); });
  assert.equal(exit, 1);
  assert.equal(existsSync(budget + '.lock'), false, 'no request was admitted, so no recovery lock is needed');
  assert.equal(stdout, '');
  assert.equal(stderr.trim(), scenario === 'occupied listener'
    ? 'Assistant listener unavailable.'
    : 'Assistant configuration invalid; no inference started.');
  assert.equal(JSON.parse(readFileSync(budget, 'utf8')).entries.length, 0);
});
}

test('container shutdown grace exceeds the complete request deadline', () => {
  const config = loadAssistantConfig({});
  assert.ok(config.shutdownGraceSeconds * 1000 > config.timeoutMs);
  const compose = readFileSync(new URL('../deploy/assistant/compose.yaml', import.meta.url), 'utf8');
  assert.match(compose, /stop_grace_period:.*CHRONOS_GUIDE_STOP_GRACE_SECONDS/);
  const example = readFileSync(new URL('../deploy/assistant/runtime.env.example', import.meta.url), 'utf8');
  assert.match(example, new RegExp(`CHRONOS_GUIDE_STOP_GRACE_SECONDS="${config.shutdownGraceSeconds}"`));
});
