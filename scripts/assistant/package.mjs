import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, relative } from 'node:path';

if (!process.argv[2]) throw new Error('Pass a new private staging directory');
const destination = resolve(process.argv[2]);
if (existsSync(destination)) throw new Error('Preserve the existing candidate; choose a new directory');
const vendor = resolve('node_modules/zod');
const dependency = JSON.parse(readFileSync(join(vendor, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')).packages['node_modules/zod'];
if (dependency.version !== lock.version || dependency.name !== 'zod') throw new Error('Installed runtime dependency differs from the lock');
const inputs = ['config/assistant.json', 'config/assistant-model-policy.json', 'config/assistant-protocol.json',
  'src/content/assistant.json', 'scripts/assistant/config.mjs', 'scripts/assistant/service.mjs',
  'scripts/assistant/budget.mjs', 'scripts/assistant/initialize-budget.mjs', 'scripts/assistant/healthcheck.mjs', 'LICENSE'];
mkdirSync(destination, {recursive: true});
for (const file of inputs) {
  const target = join(destination, file); mkdirSync(resolve(target, '..'), {recursive: true}); cpSync(file, target);
}
cpSync(vendor, join(destination, 'node_modules/zod'), {recursive: true});
writeFileSync(join(destination, 'package.json'), JSON.stringify({name: 'chronos-guide-service', private: true, type: 'module', dependencies: {zod: dependency.version}}, null, 2) + '\n');
const files = [];
function inventory(directory) {
  for (const item of readdirSync(directory, {withFileTypes: true})) {
    const file = join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error('Unexpected package symlink');
    if (item.isDirectory()) inventory(file);
    else files.push({path: relative(destination, file).replaceAll('\\', '/'), sha256: createHash('sha256').update(readFileSync(file)).digest('hex')});
  }
}
inventory(destination);
writeFileSync(join(destination, 'manifest.json'), JSON.stringify({
  scope: 'unpublished assistant source candidate; no keys, state or model weights',
  dependency: {name: dependency.name, version: dependency.version, registryIntegrity: lock.integrity,
    limit: 'Installed dependency copied and hashed; registry file provenance must be verified before release'},
  files,
}, null, 2) + '\n');
console.log(JSON.stringify({status: 'packaged, not deployed', files: files.length, paidRouteEnabled: JSON.parse(readFileSync('config/assistant.json', 'utf8')).openrouter.enabled}));
