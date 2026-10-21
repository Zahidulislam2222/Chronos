import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { renderReadiness } from '../src/lib/render-readiness.mjs';

const tick = () => new Promise(done => setImmediate(done));
function fixture(t) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false, gcTime: Infinity}}});
  t.after(() => client.clear());
  return client;
}

test('data readiness follows real observed query completion, not the first heading', async t => {
  const client = fixture(t), cache = client.getQueryCache();
  assert.equal(renderReadiness(cache), 'pending');
  let finish;
  const observer = new QueryObserver(client, {queryKey: ['synthetic-catalogue'], queryFn: () => new Promise(resolve => { finish = resolve; })});
  const stop = observer.subscribe(() => {}); t.after(stop);
  assert.equal(renderReadiness(cache), 'pending');
  finish([{id: 1}]); await tick();
  assert.equal(renderReadiness(cache), 'ready');
  let refreshed;
  observer.setOptions({queryKey: ['synthetic-catalogue'], queryFn: () => new Promise(resolve => { refreshed = resolve; })});
  const request = observer.refetch();
  assert.equal(renderReadiness(cache), 'pending');
  refreshed([{id: 2}]); await request;
  assert.equal(renderReadiness(cache), 'ready');
});

test('an enabled failing query blocks capture even if other content succeeded', async t => {
  const client = fixture(t), cache = client.getQueryCache();
  const good = new QueryObserver(client, {queryKey: ['synthetic-products'], queryFn: async () => []});
  const bad = new QueryObserver(client, {queryKey: ['synthetic-posts'], queryFn: async () => { throw new Error('Controlled outage'); }});
  const stopGood = good.subscribe(() => {}), stopBad = bad.subscribe(() => {});
  t.after(stopGood); t.after(stopBad); await tick();
  assert.equal(renderReadiness(cache), 'error');
  stopBad();
  assert.equal(renderReadiness(cache), 'ready');
});

test('disabled private account queries cannot block a public page', async t => {
  const client = fixture(t), cache = client.getQueryCache();
  let privateCalls = 0;
  const site = new QueryObserver(client, {queryKey: ['synthetic-site'], queryFn: async () => ({navigation: []})});
  const account = new QueryObserver(client, {queryKey: ['synthetic-account'], enabled: false, queryFn: async () => { privateCalls++; return []; }});
  const stopSite = site.subscribe(() => {}), stopAccount = account.subscribe(() => {});
  t.after(stopSite); t.after(stopAccount); await tick();
  assert.equal(account.getCurrentResult().status, 'pending');
  assert.equal(renderReadiness(cache), 'ready');
  assert.equal(privateCalls, 0);
});
