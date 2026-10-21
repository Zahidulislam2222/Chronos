import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { preview } from 'vite';
import { loadAssistantConfig, loadKnowledge, protocol } from '../scripts/assistant/config.mjs';
import { createAssistantServer } from '../scripts/assistant/service.mjs';

if (!process.argv[2] || !process.argv[3]) throw new Error('Pass project root containing dist and a private report path');
const engine = process.argv[4] ?? 'chromium';
const browserType = {chromium, firefox, webkit}[engine];
if (!browserType) throw new Error('Unsupported browser engine');
const config = loadAssistantConfig({});
const knowledge = loadKnowledge();
const ui = JSON.parse(readFileSync(new URL('../src/content/interface.json', import.meta.url), 'utf8'));
const checks = [];
let remoteCalls = 0;
let cancellations = 0;
let markPending;
const pendingStarted = new Promise(resolve => { markPending = resolve; });
const transport = async (url, options) => {
  if (new URL(url).origin === config.openrouter.origin) {
    remoteCalls++;
    if (JSON.parse(options.body).messages[1].content.includes('Synthetic provider outage')) return new Response('', {status: 503});
    return new Response(JSON.stringify({choices: [{finish_reason: 'stop', message: {content: '{"topic":"contact"}'}}], usage: {cost: 0}}));
  }
  const question = JSON.parse(JSON.parse(options.body).prompt).untrustedVisitorQuestion;
  if (question === 'Synthetic provider outage') throw new Error('offline');
  if (question === 'Synthetic pending request') { markPending(); return new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {cancellations++; reject(new Error('cancelled'));}, {once: true});
  }); }
  const topic = question === 'Synthetic fallback question' ? 'unknown' : 'checkout';
  return new Response(JSON.stringify({done: true, response: JSON.stringify({topic})}));
};
// Exercise both transport branches using synthetic providers even when the release pauses local inference.
const guideConfig = {...config, localEnabled: true, allowedOrigins: [], requestsPerWindow: 100, perClientRequestsPerWindow: 100,
  openrouter: {...config.openrouter, enabled: true}};
const guide = createAssistantServer({config: guideConfig, knowledge, transport, log: () => {},
  remote: {key: 'sk-or-test-credential', budget: {reserve: () => 'synthetic', settle: () => {}}}});
await new Promise(done => guide.listen(0, config.bindHost, done));
const prefix = protocol.message.slice(0, protocol.message.lastIndexOf('/'));
let server, browser;
try {
  server = await preview({root: resolve(process.argv[2]), configFile: false, logLevel: 'error',
    preview: {host: config.bindHost, port: 0, proxy: {[prefix]: {target: `http://${config.bindHost}:${guide.address().port}`, changeOrigin: true}}}});
  const base = `http://${config.bindHost}:${server.httpServer.address().port}`;
  guideConfig.allowedOrigins.push(base);
  browser = await browserType.launch();
  const context = await browser.newContext({reducedMotion: 'reduce'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, {waitUntil: 'networkidle'});
  const homepageAccessibility = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(homepageAccessibility.violations.map(({id, impact}) => ({id, impact})), []);
  checks.push('homepage automated accessibility includes collection captions and journal excerpts');
  const launcher = page.getByRole('button', {name: knowledge.title});
  await launcher.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const input = dialog.getByRole('textbox', {name: knowledge.inputLabel, exact: true});
  assert.equal(await input.evaluate(element => globalThis.document.activeElement === element), true);
  assert.match(await dialog.textContent(), /OpenRouter/);
  checks.push('keyboard launcher, initial focus, AI and remote-processing disclosure');
  await input.fill('How does test checkout work?'); await page.keyboard.press('Enter');
  await dialog.getByRole('log').locator('p').filter({hasText: knowledge.topics.find(t => t.id === 'checkout').answer}).waitFor();
  assert.equal(remoteCalls, 0);
  checks.push('real same-origin HTTP local branch, maintained answer and related source');
  await input.fill('Synthetic fallback question'); await page.keyboard.press('Enter');
  await dialog.getByRole('log').locator('p').filter({hasText: knowledge.topics.find(t => t.id === 'contact').answer}).waitFor();
  assert.equal(remoteCalls, 1);
  checks.push('real frontend and HTTP fallback branch with fake OpenRouter, no paid calls');
  await input.fill('Synthetic pending request'); await page.keyboard.press('Enter');
  await pendingStarted;
  await dialog.getByRole('button', {name: knowledge.stop, exact: true}).click();
  await dialog.getByRole('status').getByText(knowledge.stopped, {exact: true}).waitFor();
  await dialog.getByRole('button', {name: knowledge.reset, exact: true}).click();
  assert.equal(await dialog.getByRole('log').textContent(), '');
  assert.equal(await input.evaluate(element => globalThis.document.activeElement === element), true);
  await page.waitForFunction(() => !globalThis.document.querySelector('.assistant-actions')?.textContent?.includes('Stop'));
  checks.push('stop, reset, no late answer and input focus recovery');
  await input.fill('Synthetic provider outage'); await page.keyboard.press('Enter');
  await dialog.getByRole('status').getByText(knowledge.unavailable, {exact: true}).waitFor();
  assert.equal(await dialog.getByRole('link', {name: knowledge.contact.label, exact: true}).isVisible(), true);
  checks.push('provider outage retains guidance links and real owner contact path');
  const accessibility = await new AxeBuilder({page}).include('.assistant-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(accessibility.violations.map(v => ({id: v.id, impact: v.impact})), []);
  checks.push('dialog automated WCAG 2.2 AA rules: zero violations; manual screen reader unverified');
  for (const viewport of [{width: 390, height: 844}, {width: 320, height: 568}]) {
    await page.setViewportSize(viewport);
    const bounds = await dialog.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(globalThis.document.activeElement)), true); }
  }
  checks.push('320px and 390px layouts, keyboard focus containment');
  await page.keyboard.press('Escape'); await launcher.waitFor();
  assert.equal(await launcher.evaluate(el => globalThis.document.activeElement === el), true);
  checks.push('Escape closes and returns focus to launcher');
  const heroLink = page.locator('[data-scene="hero"] a').first();
  await heroLink.focus();
  const focusedHref = await heroLink.getAttribute('href');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.locator('[data-scene="hero"][data-film-status="loading"], [data-scene="hero"][data-film-status="ready"], [data-scene="hero"][data-film-status="fallback"]').waitFor();
  assert.equal(await page.evaluate(href => globalThis.document.activeElement?.getAttribute('href') === href, focusedHref), true);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('[data-scene="hero"][data-film-status="reduced"]').waitFor();
  assert.equal(await page.evaluate(href => globalThis.document.activeElement?.getAttribute('href') === href, focusedHref), true);
  checks.push('motion preference changes preserve the focused hero link');
  await page.goto(base + '/shop', {waitUntil: 'networkidle'});
  const productLink = page.locator('a[href^="/product/"]').first();
  await productLink.click();
  await page.getByRole('button', {name: /^add\s+to\s+bag$/i}).click();
  const selectionBefore = await page.evaluate(key => globalThis.localStorage.getItem(key), ui.storageKeys.previewCart);
  assert.ok(selectionBefore && JSON.parse(selectionBefore).length);
  await page.reload({waitUntil: 'networkidle'});
  assert.equal(await page.evaluate(key => globalThis.localStorage.getItem(key), ui.storageKeys.previewCart), selectionBefore);
  checks.push('cart initializer preserves and restores a real product selection across reload');
  const selected = JSON.parse(selectionBefore)[0];
  await page.evaluate(({key, selected}) => globalThis.localStorage.setItem(key, JSON.stringify([
    {...selected, product: {...selected.product, price: 0.01}},
    {...selected, product: {...selected.product, id: 'synthetic-unknown-product'}},
    {...selected, quantity: -1},
  ])), {key: ui.storageKeys.previewCart, selected});
  await page.reload({waitUntil: 'networkidle'});
  const restored = JSON.parse(await page.evaluate(key => globalThis.localStorage.getItem(key), ui.storageKeys.previewCart));
  assert.equal(restored.length, 1); assert.equal(restored[0].product.price, selected.product.price);
  checks.push('cart restoration rejects invalid products/quantities and restores canonical preview prices');

  const menu = page.getByRole('button', {name: 'Open navigation', exact: true});
  await menu.click();
  const navigation = page.getByRole('dialog');
  await navigation.waitFor();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    assert.equal(await navigation.evaluate(element => element.contains(globalThis.document.activeElement)), true);
  }
  await page.keyboard.press('Escape');
  await navigation.waitFor({state: 'hidden'});
  await page.waitForFunction(() => globalThis.document.activeElement?.getAttribute('aria-label') === 'Open navigation');
  checks.push('mobile navigation restores its actual trigger even when pointer activation does not focus it');

  assert.deepEqual(errors, []);
  assert.equal(cancellations, 1);
  writeFileSync(process.argv[3], JSON.stringify({status: 'PASS', engine, browserVersion: browser.version(), scope: 'isolated preview, fake providers; actual network/browser/UI', checks, remoteCalls, cancellations, runtimeErrors: errors}, null, 2));
  console.log(JSON.stringify({status: 'PASS', engine, checks: checks.length, remoteCalls, cancellations}));
} finally {
  await browser?.close();
  await server?.close();
  guide.closeAllConnections(); await new Promise(done => guide.close(done));
}
