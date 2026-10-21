import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { z } from 'zod';

const root = fileURLToPath(new URL('../', import.meta.url));
const policy = z.object({
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.literal('linux/amd64'),
  baseImage: z.string().regex(/^nginx@sha256:[a-f0-9]{64}$/),
  candidateTag: z.string().regex(/^chronos-web:[a-z0-9.-]+$/),
  expectedNginxVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  apkPackages: z.record(z.string().regex(/^[a-z0-9][a-z0-9+-]*$/), z.string().regex(/^[a-zA-Z0-9._+-]+-r\d+$/)),
  healthUrl: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' && !url.username && !url.password && !url.search && !url.hash;
  }),
}).strict().parse(JSON.parse(readFileSync(resolve(root, 'config/frontend-runtime.json'), 'utf8')));
const docker = process.argv[2];
if (!docker || process.argv.length !== 3) throw new Error('Pass the Docker executable as the single argument');
const config = readFileSync(resolve(root, 'deploy/shared-vps/nginx.conf'), 'utf8');
const health = new URL(policy.healthUrl);
if (!config.includes(`listen ${health.port};`) || !config.includes(`location = ${health.pathname}`)) {
  throw new Error('Health policy differs from the maintained Nginx protocol');
}
execFileSync(docker, ['build', '--platform', policy.platform, '--provenance=mode=max',
  '--file', resolve(root, 'deploy/shared-vps/Dockerfile.runtime'), '--tag', policy.candidateTag,
  '--build-arg', `WEB_IMAGE=${policy.baseImage}`,
  '--build-arg', `APK_PINS=${Object.entries(policy.apkPackages).map(([name, version]) => `${name}=${version}`).join(' ')}`,
  '--build-arg', `HEALTH_URL=${policy.healthUrl}`, resolve(root, 'deploy/shared-vps')], { stdio: 'inherit', cwd: root });
const version = spawnSync(docker, ['run', '--rm', '--network=none', '--entrypoint=nginx', policy.candidateTag, '-v'], { encoding: 'utf8' });
if (version.status !== 0 || !version.stderr.includes(`nginx/${policy.expectedNginxVersion}`)) {
  throw new Error('Nginx runtime differs from the maintained version');
}
console.log(version.stderr.trim());
execFileSync(docker, ['image', 'inspect', '--format', '{{.Id}}', policy.candidateTag], { stdio: 'inherit' });
