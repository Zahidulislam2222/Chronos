import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

if (!process.argv[2]) throw new Error('Pass the unpacked production plugin artifact directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'wordpress/wp-content/plugins/chronos-bridge');
const artifact = path.resolve(process.argv[2]);
const mapping = JSON.parse(readFileSync(new URL('./backend-release-map.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const row of mapping.files) {
  if (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(row.path) || !['LF', 'CRLF'].includes(row.artifactLineEndings)) throw new Error('Invalid release map');
  const canonical = readFileSync(path.join(source, row.path), 'utf8').replaceAll('\r\n', '\n');
  if (hash(canonical) !== row.canonicalSourceSha256) throw new Error('Source differs: ' + row.path);
  const packaged = row.artifactLineEndings === 'CRLF' ? canonical.replaceAll('\n', '\r\n') : canonical;
  if (hash(packaged) !== row.artifactSha256 || hash(readFileSync(path.join(artifact, row.path))) !== row.artifactSha256) throw new Error('Artifact differs: ' + row.path);
}
console.log(JSON.stringify({status: 'PASS', firstPartyFiles: mapping.files.length, scope: mapping.scope}));
