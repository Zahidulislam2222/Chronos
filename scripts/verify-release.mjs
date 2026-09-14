import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { outputPath } from './output-path.mjs';
const config=JSON.parse(await readFile('config/build.json','utf8'));
const manifest=JSON.parse(await readFile(await outputPath('dist','render-manifest.json'),'utf8'));
const titles=new Set();
for(const page of manifest){
 const file=page.route===config.notFoundPath?'404.html':path.join(page.route.slice(1),'index.html');
 const html=await readFile(await outputPath('dist',file),'utf8');
 assert.equal((html.match(/<title>/g)||[]).length,1,'Exactly one initial title');
 assert.ok(html.includes('id="main-content"')&&html.includes('<h1'),'Rendered semantic content');
 if(page.index){assert.ok(!titles.has(page.title),'Unique public title');titles.add(page.title);assert.ok(html.includes(page.canonical),'Canonical in initial HTML');assert.ok(html.includes('application/ld+json'),'Structured data in initial HTML');}
 assert.ok(!html.includes('"@type":"Offer"')&&!html.includes('aggregateRating'),'No invented merchant offers or reviews');
}
const sitemap=await readFile(await outputPath('dist','sitemap.xml'),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,titles.size);
console.log(`PASS: ${manifest.length} rendered pages and ${titles.size} indexable canonical URLs.`);
