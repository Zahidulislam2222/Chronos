import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {build} from 'vite';
import {chromium} from 'playwright';
import {waitForRenderReady, withinRenderDeadline, requirePublishedPageContent, captureRenderedPage} from '../scripts/render-ready.mjs';

mkdirSync('memory', {recursive: true});
const fixture = mkdtempSync(resolve('memory/render-readiness-'));
const entry = join(fixture, 'entry.mjs');
writeFileSync(entry, `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider,useQuery} from '@tanstack/react-query';
import {useRenderReadiness} from '@/hooks/use-render-readiness';
import {renderStateAttribute} from '@/lib/render-readiness.mjs';
globalThis.privateCalls=0;
function Page(){
 const state=useRenderReadiness();
 useQuery({queryKey:['required'],queryFn:()=>new Promise((resolve,reject)=>{globalThis.required={resolve,reject};}),retry:false});
 useQuery({queryKey:['private'],enabled:false,queryFn:async()=>{globalThis.privateCalls++;return [];}});
 return React.createElement('main',{[renderStateAttribute]:state},React.createElement('h1',null,'Synthetic catalogue'),React.createElement('img',{src:'/pending-image',alt:''}));
}
const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client},React.createElement(Page)));
`);
const bundle = await build({configFile: false, logLevel: 'error',
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  resolve: {alias: {'@': resolve('src')}},
  build: {write: false, minify: false, lib: {entry, name: 'ReadinessFixture', formats: ['iife']}}});
const outputs = Array.isArray(bundle) ? bundle.flatMap(result => result.output) : bundle.output;
const code = outputs.find(item => item.type === 'chunk').code;
let pendingImages = 0;
const server = createServer((request, response) => {
  if (request.url === '/pending-image') { pendingImages++; return; }
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<!doctype html><html><head><title>Readiness fixture</title></head><body><div id="root"></div><script>' + code.replaceAll('</script', '<\\/script') + '</script></body></html>');
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const checks = [];
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => Boolean(globalThis.required));
  assert.equal(await page.locator('main h1').textContent(), 'Synthetic catalogue');
  assert.equal(await page.locator('main').getAttribute('data-render-state'), 'pending');
  checks.push('visible heading cannot establish data readiness');
  await assert.rejects(page.waitForLoadState('networkidle', {timeout: 750}), /Timeout/);
  assert.ok(pendingImages > 0);
  const waiting = waitForRenderReady(page, performance.now() + 5000);
  await page.evaluate(() => globalThis.required.resolve({items: ['synthetic-item']}));
  await waiting;
  await assert.rejects(waitForRenderReady(page, performance.now() - 1), /deadline exceeded/);
  assert.equal(await page.evaluate(() => globalThis.privateCalls), 0);
  checks.push('actual React hook reaches ready with pending image and disabled private query');
  await page.close();

  const failed = await browser.newPage();
  await failed.goto(base, {waitUntil: 'domcontentloaded'});
  await failed.waitForFunction(() => Boolean(globalThis.required));
  await failed.evaluate(() => globalThis.required.reject(new Error('Synthetic CMS outage')));
  await assert.rejects(waitForRenderReady(failed, performance.now() + 5000), /Required page data failed/);
  checks.push('CMS failure blocks capture even with a visible heading');
  await failed.close();

  const stalled = await browser.newPage();
  await stalled.goto(base, {waitUntil: 'domcontentloaded'});
  await stalled.waitForFunction(() => Boolean(globalThis.required));
  const started = performance.now();
  await assert.rejects(waitForRenderReady(stalled, started + 200), /Timeout/);
  assert.ok(performance.now() - started < 1500);
  checks.push('stalled CMS obeys the supplied remaining route deadline');
  await stalled.close();
  let admitted = false;
  await assert.rejects(withinRenderDeadline(() => { admitted = true; return Promise.resolve(); }, performance.now() - 1), /deadline exceeded/);
  assert.equal(admitted, false);
  await assert.rejects(withinRenderDeadline(() => new Promise(() => {}), performance.now() + 50), /deadline exceeded/);
  checks.push('expired work is refused and a stalled capture is bounded by the overall deadline');
  const cms = await browser.newPage();
  for (const html of ['<main><h1>Page Not Found</h1></main>', '<main class="information-page"><h1>Privacy</h1><article class="wordpress-content"> </article></main>']) {
    await cms.setContent(html);
    await assert.rejects(requirePublishedPageContent(cms), /Published CMS page content missing/);
  }
  await cms.setContent('<main class="information-page"><h1>Privacy</h1><article class="wordpress-content"><p>Published synthetic policy.</p></article></main>');
  await requirePublishedPageContent(cms);
  await cms.close();
  checks.push('published CMS route rejects missing/empty content and accepts its rendered body');
  const refetch = await browser.newPage();
  await refetch.setContent('<main data-render-state="ready"><h1>Previously loaded content</h1></main>');
  const beginsRefetchAfterObservation = {waitForFunction:async (...args)=>{
    const observed = await refetch.waitForFunction(...args);
    await refetch.locator('main').evaluate(main=>main.setAttribute('data-render-state','pending'));
    return observed;
  }, locator:refetch.locator.bind(refetch)};
  await waitForRenderReady(beginsRefetchAfterObservation, performance.now()+5000);
  assert.equal(await refetch.locator('main').getAttribute('data-render-state'),'pending');
  assert.match((await captureRenderedPage(refetch)).html,/Previously loaded content/);
  await refetch.locator('main').evaluate(main=>main.setAttribute('data-render-state','error'));
  await assert.rejects(captureRenderedPage(refetch),/Required page data failed before capture/);
  await refetch.close();
  checks.push('background refetch preserves loaded capture, while an intervening data error blocks cloning');
  const report = {status: 'PASS', scope: 'actual React/TanStack hook and Chromium; synthetic CMS and stalled images', checks};
  writeFileSync('memory/render-readiness-browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(done => server.close(done));
  // This folder contains only this run's generated entry, not personal tests.
  rmSync(fixture, {recursive: true, force: true});
}
