import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { outputPath } from './output-path.mjs';
import { preview, loadEnv } from 'vite';
import { chromium } from 'playwright';
import { z } from 'zod';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const config = z.object({outputDirectory:z.literal('dist'),previewHost:z.literal('127.0.0.1'),previewPort:z.number().int().min(0).max(65535),navigationTimeoutMs:z.number().positive(),viewport:z.object({width:z.number().positive(),height:z.number().positive()}),notFoundPath:z.string().startsWith('/'),publicAssetDirectories:z.array(z.string())}).parse(await readJson('config/build.json'));
const search = await readJson('src/content/search.json');
const catalogue = await readJson('src/content/catalogue.json');
const env = loadEnv('production', process.cwd(), 'VITE_');
const connected = env.VITE_STOREFRONT_MODE === 'connected';
const site = new URL(env.VITE_SITE_URL);
if (!['https:', 'http:'].includes(site.protocol) || site.username || site.password || site.search || site.hash || site.pathname !== '/') throw new Error('Canonical site URL must be an HTTP(S) origin.');
let products=catalogue.products, posts=catalogue.posts, pages=[];
if(connected){
  const first=z.coerce.number().int().min(1).max(100).parse(env.VITE_CONTENT_PAGE_SIZE);
  async function records(field){
    const all=[]; let after=null; const seen=new Set();
    do {
      const response=await fetch(env.VITE_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:`query Routes($first:Int!,$after:String){${field}(first:$first,after:$after){nodes{slug}pageInfo{hasNextPage endCursor}}}`,variables:{first,after}}),signal:AbortSignal.timeout(config.navigationTimeoutMs)});
      if(!response.ok)throw new Error('WordPress route inventory failed.');
      const body=await response.json(); if(body.errors)throw new Error('WordPress route query failed.');
      const page=body.data[field]; all.push(...page.nodes);
      if(!page.pageInfo.hasNextPage)return all;
      after=page.pageInfo.endCursor;if(!after||seen.has(after))throw new Error('Invalid route cursor.');seen.add(after);
    }while(after);
    return all;
  }
  [products,posts]=await Promise.all([records('products'),records('posts')]);
  const response=await fetch(env.VITE_WP_API_URL+'/wp-json/chronos/v1/site',{signal:AbortSignal.timeout(config.navigationTimeoutMs)});
  if(!response.ok)throw new Error('WordPress page inventory failed.');
  pages=(await response.json()).data.pages;
}
const routes = [...new Set([...search.routes.map(r => r.path), ...products.map(p => `/product/${p.slug}`), ...posts.map(p => `/blog/${p.slug}`),...pages.map(p=>new URL(p.url).pathname.replace(/\/$/,'')||'/'), config.notFoundPath])];
if (new Set(routes).size !== routes.length || routes.some(r => !/^\/(?:[a-z0-9_-]+\/?)*$/.test(r))) throw new Error('Unsafe or duplicate route in maintained data.');
const server = await preview({preview:{host:config.previewHost,port:config.previewPort,open:false}});
let browser;
try {
  const address = server.httpServer.address();
  const base = `http://${config.previewHost}:${address.port}`;
  browser = await chromium.launch();
  const context = await browser.newContext({viewport:config.viewport,reducedMotion:'reduce'});
  const snapshots = [], errors = [];
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  const allowed = new Set([base,...(connected?[new URL(env.VITE_API_URL).origin,new URL(env.VITE_WP_API_URL).origin]:[])]);
  await context.route('**/*', route => allowed.has(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(base + route, {waitUntil:'networkidle',timeout:config.navigationTimeoutMs});
    await page.locator('main h1').waitFor();
    await page.waitForFunction(() => document.querySelector('meta[name="robots"]') && !document.querySelector('main')?.textContent?.includes('Preparing the collection'));
    if(connected && await page.locator('main').innerText().then(t=>t.includes('could not be loaded')))throw new Error('WordPress content failed during render: '+route);
    const result = await page.evaluate(() => {
      // Capture the same semantic UI supplied to people; never crawler-only content.
      const clone = document.documentElement.cloneNode(true);
      clone.removeAttribute('style');
      clone.classList.add('prerendered');
      clone.querySelectorAll('script[data-chronos-runtime], [data-radix-portal]').forEach(n => n.remove());
      clone.querySelectorAll('[style]').forEach(n => { n.style.removeProperty('opacity'); n.style.removeProperty('transform'); });
      clone.querySelectorAll('video').forEach(n => { n.removeAttribute('autoplay'); n.setAttribute('preload','none'); });
      return {html:'<!doctype html>\n'+clone.outerHTML, canonical:document.querySelector('link[rel="canonical"]')?.href,index:document.querySelector('meta[name="robots"]')?.content.startsWith('index'),title:document.title};
    });
    if (!result.title || !result.html.includes('id="main-content"')) throw new Error('Incomplete rendered page: '+route);
    snapshots.push({route,...result});
    await page.close();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const xml = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  for (const s of snapshots) {
    const target = await outputPath(config.outputDirectory,s.route === config.notFoundPath ? '404.html' : path.join(s.route.slice(1),'index.html'));
    await mkdir(path.dirname(target),{recursive:true}); await writeFile(target,s.html);
  }
  await writeFile(await outputPath(config.outputDirectory,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+snapshots.filter(s=>s.index).map(s=>`  <url><loc>${xml(s.canonical)}</loc></url>`).join('\n')+'\n</urlset>\n');
  await writeFile(await outputPath(config.outputDirectory,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);
  await writeFile(await outputPath(config.outputDirectory,'render-manifest.json'),JSON.stringify(snapshots.map(({route,title,canonical,index})=>({route,title,canonical,index})),null,2));
  console.log(`Rendered ${snapshots.length} HTML pages; ${snapshots.filter(s=>s.index).length} indexable canonical URLs.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
