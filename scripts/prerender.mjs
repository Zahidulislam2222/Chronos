import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { outputPath } from './output-path.mjs';
import { preview, loadEnv } from 'vite';
import { chromium } from 'playwright';
import { z } from 'zod';
import { waitForRenderReady, withinRenderDeadline, requirePublishedPageContent, captureRenderedPage } from './render-ready.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const config = z.object({outputDirectory:z.literal('dist'),previewHost:z.literal('127.0.0.1'),previewPort:z.number().int().min(0).max(65535),navigationTimeoutMs:z.number().positive(),viewport:z.object({width:z.number().positive(),height:z.number().positive()}),notFoundPath:z.string().startsWith('/'),publicAssetDirectories:z.array(z.string())}).parse(await readJson('config/build.json'));
const search = await readJson('src/content/search.json');
const customPagePaths = z.array(z.string().startsWith('/')).parse(search.connected.customPagePaths);
const catalogue = await readJson('src/content/catalogue.json');
const cataloguePolicy = z.object({excludedProductIds:z.array(z.number().int().positive()),excludedPostIds:z.array(z.number().int().positive())}).parse(await readJson('config/catalogue.json'));
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
      const response=await fetch(env.VITE_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:`query Routes($first:Int!,$after:String){${field}(first:$first,after:$after){nodes{databaseId slug}pageInfo{hasNextPage endCursor}}}`,variables:{first,after}}),signal:AbortSignal.timeout(config.navigationTimeoutMs)});
      if(!response.ok)throw new Error('WordPress route inventory failed.');
      const body=await response.json(); if(body.errors)throw new Error('WordPress route query failed.');
      const page=body.data[field]; all.push(...page.nodes);
      if(!page.pageInfo.hasNextPage)return all;
      after=page.pageInfo.endCursor;if(!after||seen.has(after))throw new Error('Invalid route cursor.');seen.add(after);
    }while(after);
    return all;
  }
  [products,posts]=await Promise.all([records('products'),records('posts')]);
  products=products.filter(product=>!cataloguePolicy.excludedProductIds.includes(product.databaseId));
  posts=posts.filter(post=>!cataloguePolicy.excludedPostIds.includes(post.databaseId));
  const response=await fetch(env.VITE_WP_API_URL+'/wp-json/chronos/v1/site',{signal:AbortSignal.timeout(config.navigationTimeoutMs)});
  if(!response.ok)throw new Error('WordPress page inventory failed.');
  pages=(await response.json()).data.pages;
}
const routeAliases = z.record(z.string().startsWith('/'), z.string().startsWith('/')).parse(search.routeAliases);
if (Object.values(routeAliases).some(target=>!search.routes.some(route=>route.path===target))) throw new Error('Unknown maintained metadata alias target');
const routes = [...new Set([...search.routes.map(r => r.path), ...Object.keys(routeAliases), ...products.map(p => `/product/${p.slug}`), ...posts.map(p => `/blog/${p.slug}`),...pages.map(p=>new URL(p.url).pathname.replace(/\/$/,'')||'/'), config.notFoundPath])];
const cmsPagePaths = new Set(pages.map(page=>new URL(page.url).pathname.replace(/\/$/,'')||'/').filter(route=>!customPagePaths.includes(route)));
if (new Set(routes).size !== routes.length || routes.some(r => !/^\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\/?)?$/.test(r))) throw new Error('Unsafe or duplicate route in maintained data.');
const server = await preview({preview:{host:config.previewHost,port:config.previewPort,open:false}});
let browser;
try {
  const address = server.httpServer.address();
  const base = `http://${config.previewHost}:${address.port}`;
  browser = await chromium.launch();
  const context = await browser.newContext({viewport:config.viewport,reducedMotion:'reduce'});
  // Record whether the route loader ever mounts during the initial render.
  await context.addInitScript(() => { new MutationObserver(() => { if (document.querySelector('[data-page-loader]')) window.__chronosLoaderShown = true; }).observe(document, {childList:true, subtree:true}); });
  const snapshots = [], errors = [];
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  const allowed = new Set([base,...(connected?[new URL(env.VITE_API_URL).origin,new URL(env.VITE_WP_API_URL).origin]:[])]);
  await context.route('**/*', route => allowed.has(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  for (const route of routes) {
    const page = await context.newPage();
    const dataRequests = [];
    page.on('response', response => {
      if (['fetch','xhr'].includes(response.request().resourceType())) dataRequests.push({
        path:new URL(response.url()).pathname,status:response.status(),contentType:response.headers()['content-type'],
      });
    });
    page.on('requestfailed', request => {
      if (['fetch','xhr'].includes(request.resourceType())) dataRequests.push({
        path:new URL(request.url()).pathname,error:request.failure()?.errorText,
      });
    });
    const deadline = performance.now() + config.navigationTimeoutMs;
    const remaining = () => {
      const time = deadline - performance.now();
      if (time <= 0) throw new Error('Render deadline exceeded: '+route);
      return time;
    };
    const result = await withinRenderDeadline(async () => {
    await page.goto(base + route, {waitUntil:'domcontentloaded',timeout:remaining()});
    await waitForRenderReady(page, deadline).catch(error => { throw new Error('Page data readiness failed: '+JSON.stringify({route,dataRequests}), {cause:error}); });
    await page.locator('main h1').waitFor({timeout:remaining()});
    await page.waitForFunction(() => document.querySelector('meta[name="robots"]') && !document.querySelector('main')?.textContent?.includes('Preparing the collection'), null, {timeout:remaining()});
    if ((route === '/' || route === '/shop') && await page.locator('.product-card').count() !== products.length) throw new Error('Rendered product inventory mismatch: '+route);
    if ((route === '/' || route === '/blog') && await page.locator('.journal-card').count() !== posts.length) throw new Error('Rendered post inventory mismatch: '+route);
    if (products.some(product => route === '/product/'+product.slug) && !await page.locator('.detail-copy').count()) throw new Error('Published product detail missing: '+route);
    if (posts.some(post => route === '/blog/'+post.slug) && !await page.locator('.article-body').count()) throw new Error('Published article missing: '+route);
    if (connected && cmsPagePaths.has(route)) await requirePublishedPageContent(page);
    remaining();
    const live = await page.evaluate(() => ({loader:Boolean(window.__chronosLoaderShown),title:document.querySelectorAll('title').length,description:document.querySelectorAll('meta[name="description"]').length,canonical:document.querySelectorAll('link[rel="canonical"]').length}));
    if (live.loader || live.title !== 1 || live.description !== 1 || live.canonical > 1) throw new Error('Initial render showed the page loader or duplicated head tags: '+route+' '+JSON.stringify(live));
    if(connected && await page.locator('main').innerText().then(t=>t.includes('could not be loaded')))throw new Error('WordPress content failed during render: '+route);
    const result = await captureRenderedPage(page);
    remaining();
    if (!result.title || !result.html.includes('id="main-content"')) throw new Error('Incomplete rendered page: '+route);
    return result;
    }, deadline);
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
