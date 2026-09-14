import path from 'node:path';
import { realpath, lstat } from 'node:fs/promises';

// Generated public files and private evidence have separate, fixed roots.
export async function outputPath(rootName, relativeName) {
  if (!['dist','memory'].includes(rootName) || path.isAbsolute(relativeName)) throw new Error('Unapproved output root/path');
  const project=await realpath(process.cwd());
  const root=path.join(project,rootName);
  const target=path.resolve(root,relativeName);
  const relative=path.relative(root,target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output escapes approved root');
  let cursor=project;
  for (const segment of [rootName,...relative.split(path.sep)]) {
    cursor=path.join(cursor,segment);
    try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlink output is not permitted'); }
    catch(error) { if(error.code!=='ENOENT') throw error; }
  }
  return target;
}
