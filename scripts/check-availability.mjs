import { readFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { outputPath } from './output-path.mjs';
import { loadEnv } from 'vite';
import { z } from 'zod';
const raw=JSON.parse(await readFile('config/operations.json','utf8'));
const c=z.object({targetPercent:z.number().min(0).max(100),windowDays:z.number().positive(),probeIntervalSeconds:z.number().positive(),timeoutMs:z.number().positive(),paths:z.array(z.object({path:z.string().startsWith('/'),expectedText:z.string().min(1)})).min(1),outputFile:z.string().startsWith('memory/')}).parse(raw.availability);
const site=z.string().url().parse(loadEnv('production',process.cwd(),'VITE_').VITE_SITE_URL);
const url=new URL(site);
if(url.protocol!=='https:' || url.username || url.password) throw new Error('Probe requires a credential-free HTTPS site origin.');
const checks=[];
for(const probe of c.paths){
 const route=probe.path;
 const start=performance.now();
 try{
  const response=await fetch(new URL(route,url),{redirect:'error',signal:AbortSignal.timeout(c.timeoutMs)});
  const text=await response.text();
  checks.push({path:route,ok:response.status===200 && text.includes(probe.expectedText),status:response.status,ms:Math.round(performance.now()-start)});
 }catch{checks.push({path:route,ok:false,status:null,ms:Math.round(performance.now()-start)});}
}
const record={time:new Date().toISOString(),ok:checks.every(c=>c.ok),checks};
const file=await outputPath('memory',c.outputFile.slice('memory/'.length));
await mkdir(path.dirname(file),{recursive:true});await appendFile(file,JSON.stringify(record)+'\n');
console.log(JSON.stringify(record));
// One observation is not an availability percentage. A scheduler must run this externally.
process.exitCode=record.ok?0:1;
