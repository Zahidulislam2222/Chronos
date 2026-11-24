import { readFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { outputPath } from './output-path.mjs';
import { loadEnv } from 'vite';
import { z } from 'zod';

// One end-to-end observation of the storefront and the backend health endpoint.
// Targets come from CHRONOS_SITE_URL / CHRONOS_BACKEND_URL (scheduled workflow) or the
// local production env file (VITE_SITE_URL / VITE_WP_API_URL). Paths, expected text,
// timeouts and the single retry live in config/operations.json.
const raw = JSON.parse(await readFile('config/operations.json', 'utf8'));
const c = z.object({
  targetPercent: z.number().min(0).max(100),
  windowDays: z.number().positive(),
  probeIntervalSeconds: z.number().positive(),
  timeoutMs: z.number().positive(),
  retryDelayMs: z.number().int().min(0).max(60000),
  paths: z.array(z.object({
    origin: z.enum(['site', 'backend']).default('site'),
    path: z.string().startsWith('/'),
    expectedText: z.string().min(1),
    // false: the check alerts the owner but is not storefront downtime (for example backup freshness).
    slo: z.boolean().default(true),
  })).min(1),
  drillPath: z.string().startsWith('/'),
  outputFile: z.string().startsWith('memory/'),
}).parse(raw.availability);

const env = loadEnv('production', process.cwd(), 'VITE_');
const httpsOrigin = (value, name) => {
  const url = new URL(z.string().url().parse(value));
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${name} must be a credential-free HTTPS origin.`);
  return url.origin;
};
const origins = {
  site: httpsOrigin(process.env.CHRONOS_SITE_URL || env.VITE_SITE_URL, 'Site URL'),
  backend: httpsOrigin(process.env.CHRONOS_BACKEND_URL || env.VITE_WP_API_URL, 'Backend URL'),
};

const paths = [...c.paths];
// A drill adds a path that cannot succeed, to prove that a failure reaches the owner.
if (process.env.CHRONOS_PROBE_DRILL === 'true') paths.push({ origin: 'site', path: c.drillPath, expectedText: 'chronos-drill-never-matches' });

async function probe({ origin, path: route, expectedText, slo = true }) {
  const start = performance.now();
  try {
    const response = await fetch(new URL(route, origins[origin]), { redirect: 'error', signal: AbortSignal.timeout(c.timeoutMs) });
    const text = await response.text();
    return { origin, path: route, slo, ok: response.status === 200 && text.includes(expectedText), status: response.status, ms: Math.round(performance.now() - start) };
  } catch {
    return { origin, path: route, slo, ok: false, status: null, ms: Math.round(performance.now() - start) };
  }
}

const checks = [];
for (const target of paths) {
  let result = await probe(target);
  if (!result.ok) {
    // One delayed retry separates a brief network blip from an outage.
    await new Promise((resolve) => setTimeout(resolve, c.retryDelayMs));
    result = { ...(await probe(target)), retried: true };
  }
  checks.push(result);
}
// `ok` is the availability observation (SLO paths only); `allOk` also covers owner-alert paths.
const record = {
  time: new Date().toISOString(),
  ok: checks.filter((check) => check.slo).every((check) => check.ok),
  allOk: checks.every((check) => check.ok),
  checks,
};
const file = await outputPath('memory', c.outputFile.slice('memory/'.length));
await mkdir(path.dirname(file), { recursive: true });
await appendFile(file, JSON.stringify(record) + '\n');
console.log(JSON.stringify(record));
// In GitHub Actions, label the run so history separates downtime from owner-only alerts.
if (process.env.GITHUB_ACTIONS === 'true') {
  const failed = (slo) => checks.filter((check) => check.slo === slo && !check.ok).map((check) => `${check.origin}${check.path}`);
  if (!record.ok) console.log(`::error title=Storefront unavailable::${failed(true).join(', ')}`);
  if (failed(false).length) console.log(`::warning title=Owner alert (not downtime)::${failed(false).join(', ')}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `| Availability (SLO) | Owner alerts |\n|---|---|\n| ${record.ok ? 'up' : 'DOWN: ' + failed(true).join(', ')} | ${failed(false).join(', ') || 'none'} |\n`);
  }
}
// One observation is not an availability percentage; the scheduled workflow repeats it.
// Any failed check, SLO or not, fails the run so the workflow notifies the owner.
process.exitCode = record.allOk ? 0 : 1;
