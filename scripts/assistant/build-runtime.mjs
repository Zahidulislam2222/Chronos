import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';

const root = fileURLToPath(new URL('../../', import.meta.url));
const policy = z.object({
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.literal('linux/amd64'),
  dockerCommand: z.string().min(1),
  node: z.object({
    baseImage: z.string().regex(/^node@sha256:[a-f0-9]{64}$/),
    expectedVersion: z.string().regex(/^v\d+\.\d+\.\d+$/),
    expectedOpenSslVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    expectedUndiciVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    cryptoPackageVersion: z.string().regex(/^\d+\.\d+\.\d+-r\d+$/),
    sslPackageVersion: z.string().regex(/^\d+\.\d+\.\d+-r\d+$/),
    zlibPackageVersion: z.string().regex(/^\d+\.\d+\.\d+-r\d+$/),
    candidateTag: z.string().regex(/^chronos-guide-node:[a-z0-9.-]+$/),
  }).strict(),
  ollama: z.object({
    candidateImage: z.string().regex(/^ollama\/ollama@sha256:[a-f0-9]{64}$/),
    releaseVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    status: z.string().min(1),
  }).strict(),
}).strict().parse(JSON.parse(readFileSync(resolve(root, 'config/assistant-runtime.json'), 'utf8')));

// Direct executable arguments: no shell interpolation or build-time secrets.
const docker = process.argv[2] || policy.dockerCommand;
execFileSync(docker, ['build', '--platform', policy.platform, '--provenance=mode=max',
  '--file', resolve(root, 'deploy/assistant/Dockerfile'), '--tag', policy.node.candidateTag,
  '--build-arg', `NODE_IMAGE=${policy.node.baseImage}`,
  '--build-arg', `CRYPTO_VERSION=${policy.node.cryptoPackageVersion}`,
  '--build-arg', `SSL_VERSION=${policy.node.sslPackageVersion}`,
  '--build-arg', `ZLIB_VERSION=${policy.node.zlibPackageVersion}`,
  resolve(root, 'deploy/assistant')], { stdio: 'inherit', cwd: root });
const actual = execFileSync(docker, ['run', '--rm', '--network=none', '--read-only',
  '--cap-drop=ALL', '--security-opt=no-new-privileges', policy.node.candidateTag,
  'node', '--version'], { encoding: 'utf8' }).trim();
if (actual !== policy.node.expectedVersion) throw new Error('Runtime version differs from maintained policy');
const embedded = JSON.parse(execFileSync(docker, ['run', '--rm', '--network=none', '--read-only',
  '--cap-drop=ALL', '--security-opt=no-new-privileges', policy.node.candidateTag,
  'node', '-p', 'JSON.stringify({openssl:process.versions.openssl,undici:process.versions.undici})'], { encoding: 'utf8' }));
if (embedded.openssl !== policy.node.expectedOpenSslVersion || embedded.undici !== policy.node.expectedUndiciVersion) {
  throw new Error('Embedded crypto/HTTP dependencies differ from maintained policy');
}
console.log(JSON.stringify({ node: actual, ...embedded }));
execFileSync(docker, ['image', 'inspect', '--format', '{{.Id}}', policy.node.candidateTag], { stdio: 'inherit' });
