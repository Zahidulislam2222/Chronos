import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';

// Sign-in tokens expire after a few minutes and WordPress hides the real GraphQL error
// ("Internal server error"). A stale token must never break public pages or keep a
// signed-out visitor looking signed in. Each test bundles the real module with Vite.
const ENV = {
  VITE_STOREFRONT_MODE: 'connected',
  VITE_API_URL: 'https://backend.test/graphql',
  VITE_WP_API_URL: 'https://backend.test',
};

async function bundle(entry) {
  const result = await build({configFile:false, envDir:false, logLevel:'error',
    resolve:{alias:{'@':resolve('src')}},
    define:Object.fromEntries(Object.entries(ENV).map(([name,value])=>['import.meta.env.'+name,JSON.stringify(value)])),
    build:{write:false,minify:false,lib:{entry:resolve(entry),formats:['es']}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item=>item.output);
  return outputs.find(item=>item.type==='chunk'&&item.isEntry).code;
}

const apiCode = bundle('src/utils/api.ts');
const restCode = bundle('src/utils/wordpressApi.ts');
const sessionCode = bundle('src/utils/session.ts');
let loads = 0;
// A fresh module instance per test, because api.ts reads storage when it loads.
const load = async (code) => import('data:text/javascript;base64,'+Buffer.from(await code+`\n//${loads++}`).toString('base64'));

const jwt = (expSeconds) => ['e30', Buffer.from(JSON.stringify({exp: expSeconds})).toString('base64url'), 'sig'].join('.');
const now = () => Math.floor(Date.now() / 1000);

function browser({token, respond}) {
  const store = new Map(token ? [['auth-token', token]] : []);
  globalThis.localStorage = {getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k)};
  const events = [];
  globalThis.window = {dispatchEvent:e=>{events.push(e.type);return true;}, addEventListener(){}, removeEventListener(){}};
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({url:String(url), authorization:init?.headers?.Authorization ?? null, body:init?.body ? JSON.parse(init.body) : null});
    return respond(requests.at(-1));
  };
  return {store, events, requests};
}
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json'}});
const emptyConnection = (field) => json({data:{[field]:{nodes:[], pageInfo:{hasNextPage:false, endCursor:null}}}});

test('public catalogue and journal requests never send the sign-in token', async () => {
  const b = browser({token: jwt(now() + 3600), respond: ({body}) =>
    /posts\(/.test(body.query) ? emptyConnection('posts') : /product\(/.test(body.query) ? json({data:{product:null}})
      : /post\(/.test(body.query) ? json({data:{post:null}}) : emptyConnection('products')});
  const api = await load(apiCode);
  await api.fetchProducts();
  await api.fetchPosts();
  await api.fetchProductBySlug('aviator-gmt');
  await api.fetchPostBySlug('welcome');
  assert.equal(b.requests.length, 4);
  for (const r of b.requests) assert.equal(r.authorization, null, `public request sent a token: ${r.body.query.slice(0, 40)}`);
  assert.equal(b.store.has('auth-token'), true, 'a valid token stays stored');
  assert.deepEqual(b.events, []);
});

test('a signed-in request with a valid token sends it', async () => {
  const token = jwt(now() + 3600);
  const b = browser({token, respond: () => json({data:{customer:{orders:{nodes:[], pageInfo:{hasNextPage:false}}}}})});
  const api = await load(apiCode);
  await api.fetchCustomerOrders();
  assert.equal(b.requests[0].authorization, `Bearer ${token}`);
});

test('an expired token is dropped before sending and the visitor is told to sign in', async () => {
  const b = browser({token: jwt(now() - 60), respond: () => json({errors:[{message:'Internal server error'}]})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCustomerOrders(), /sign in/i);
  assert.equal(b.requests.length, 0, 'nothing is sent with an expired token');
  assert.equal(b.store.has('auth-token'), false, 'expired token removed');
  assert.deepEqual(b.events, ['chronos-auth-expired']);
});

test('a token about to expire is treated as expired', async () => {
  const b = browser({token: jwt(now() + 5), respond: () => json({data:{}})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCustomerOrders(), /sign in/i);
  assert.equal(b.requests.length, 0);
});

test('the server rejecting a token on the current-user check signs the visitor out', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({errors:[{message:'Internal server error'}], data:{viewer:null}})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCurrentUser(), /sign in/i);
  assert.equal(b.store.has('auth-token'), false, 'rejected token removed');
  assert.ok(b.events.includes('chronos-auth-expired'));
});

test('a network failure keeps a valid token (no sign-out on transport errors)', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({}, 502)});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCurrentUser());
  assert.equal(b.store.has('auth-token'), true);
  assert.deepEqual(b.events, []);
});

test('a token without a readable expiry is still sent (server decides)', async () => {
  const b = browser({token: 'opaque-token', respond: () => json({data:{customer:{orders:{nodes:[], pageInfo:{hasNextPage:false}}}}})});
  const api = await load(apiCode);
  await api.fetchCustomerOrders();
  assert.equal(b.requests[0].authorization, 'Bearer opaque-token');
});

test('the payment check refuses to send an expired token', async () => {
  const b = browser({token: jwt(now() - 60), respond: () => json({data:{paid:true}})});
  const rest = await load(restCode);
  assert.throws(() => rest.authenticatedRequest('chronos/v1/stripe/verify-session', {sessionId:'cs_test_x'}), /sign in/i);
  assert.equal(b.requests.length, 0);
  assert.equal(b.store.has('auth-token'), false);
});

test('viewer: null alone (no error list) also signs the visitor out', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({data:{viewer:null}})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCurrentUser(), /sign in/i);
  assert.equal(b.store.has('auth-token'), false);
});

test('the orders page signs out when WordPress refuses an unexpired token', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({errors:[{message:'Internal server error'}]})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCustomerOrders());
  assert.equal(b.store.has('auth-token'), false);
  assert.deepEqual(b.events, ['chronos-auth-expired']);
});

test('a late refusal of an old token does not sign out a new sign-in', async () => {
  const oldToken = jwt(now() + 3600), newToken = jwt(now() + 7200);
  let release;
  const b = browser({token: oldToken, respond: () => new Promise(r => { release = () => r(json({errors:[{message:'Internal server error'}], data:{viewer:null}})); })});
  const api = await load(apiCode);
  const pending = api.fetchCurrentUser();
  await new Promise(r => setTimeout(r, 10));
  b.store.set('auth-token', newToken);           // the visitor signs in again meanwhile
  release();
  await assert.rejects(pending);
  assert.equal(b.store.get('auth-token'), newToken, 'new token kept');
  assert.deepEqual(b.events, [], 'no sign-out event for the old token');
});

test('restoring a session: expired token signs out quietly without asking the server', async () => {
  const b = browser({token: jwt(now() - 60), respond: () => json({data:{}})});
  const session = await load(sessionCode);
  assert.deepEqual(await session.restoreSession(), {user:null, current:true});
  assert.equal(b.requests.length, 0);
  assert.equal(b.store.has('auth-token'), false);
  assert.deepEqual(b.events, ['chronos-auth-expired'], 'the app clears the session (the listener never opens a prompt)');
});

test('restoring a session: valid token returns the user; refused token signs out', async () => {
  browser({token: jwt(now() + 3600), respond: () => json({data:{viewer:{databaseId:7, name:'Test', email:'t@example.test', avatar:null}}})});
  let session = await load(sessionCode);
  const ok = await session.restoreSession();
  assert.equal(ok.current, true);
  assert.equal(ok.user.id, '7');
  const b = browser({token: jwt(now() + 3600), respond: () => json({errors:[{message:'Internal server error'}], data:{viewer:null}})});
  session = await load(sessionCode);
  assert.deepEqual(await session.restoreSession(), {user:null, current:true});
  assert.equal(b.store.has('auth-token'), false);
});

test('restoring a session: a network failure keeps the token', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({}, 503)});
  const session = await load(sessionCode);
  const r = await session.restoreSession();
  assert.equal(r.user, null);
  assert.equal(b.store.has('auth-token'), true);
});

test('restoring a session: a sign-in during the check wins', async () => {
  const oldToken = jwt(now() + 3600);
  let release;
  const b = browser({token: oldToken, respond: () => new Promise(r => { release = () => r(json({data:{viewer:{databaseId:1, name:'Old', email:'o@example.test'}}})); })});
  const session = await load(sessionCode);
  const pending = session.restoreSession();
  await new Promise(r => setTimeout(r, 10));
  b.store.set('auth-token', jwt(now() + 7200));
  release();
  assert.equal((await pending).current, false, 'stale result is ignored');
});

test('the payment check sends a valid token', async () => {
  const token = jwt(now() + 3600);
  const b = browser({token, respond: () => json({data:{paid:true}})});
  const rest = await load(restCode);
  await rest.authenticatedRequest('chronos/v1/stripe/create-session', {items:[]});
  assert.equal(b.requests[0].authorization, `Bearer ${token}`);
  assert.deepEqual(b.events, []);
});

test('an orders query error with a working sign-in keeps the visitor signed in', async () => {
  const token = jwt(now() + 3600);
  const b = browser({token, respond: ({body}) => /viewer/.test(body.query)
    ? json({data:{viewer:{databaseId:7, name:'Test', email:'t@example.test'}}})
    : json({errors:[{message:'Internal server error'}]})});
  const api = await load(apiCode);
  await assert.rejects(api.fetchCustomerOrders());
  assert.equal(b.requests.length, 2, 'orders, then the viewer check');
  assert.equal(b.store.get('auth-token'), token, 'token kept');
  assert.deepEqual(b.events, []);
});

test('a late 401 for an old token does not remove a newer one', async () => {
  const oldToken = jwt(now() + 3600), newToken = jwt(now() + 7200);
  let release;
  const b = browser({token: oldToken, respond: () => new Promise(r => { release = () => r(json({code:'rest_forbidden', message:'no'}, 401)); })});
  const rest = await load(restCode);
  const pending = rest.authenticatedRequest('chronos/v1/stripe/verify-session', {sessionId:'cs_test_x'});
  await new Promise(r => setTimeout(r, 10));
  b.store.set('auth-token', newToken);
  release();
  await assert.rejects(pending);
  assert.equal(b.store.get('auth-token'), newToken);
  assert.deepEqual(b.events, []);
});

test('a 401 for the current token signs out', async () => {
  const b = browser({token: jwt(now() + 3600), respond: () => json({code:'rest_forbidden', message:'no'}, 401)});
  const rest = await load(restCode);
  await assert.rejects(rest.authenticatedRequest('chronos/v1/stripe/create-session', {items:[]}));
  assert.equal(b.store.has('auth-token'), false);
  assert.deepEqual(b.events, ['chronos-auth-expired']);
});

test('ending a session never pops up sign-in by itself; checkout asks after a failed Pay', async () => {
  const {readFile} = await import('node:fs/promises');
  const context = await readFile(resolve('src/context/AuthContext.tsx'), 'utf8');
  assert.match(context, /const expired=\(\)=>forget\(\);/, 'expiry listener only clears the session');
  const checkout = await readFile(resolve('src/pages/ConnectedCheckout.tsx'), 'utf8');
  assert.match(checkout, /e\.message === SIGN_IN_AGAIN\) \|\| \(e instanceof WordPressError && e\.status === 401\)\) \{ setBusy\(false\); openLoginModal\(\); return; \}/);
  assert.match(checkout, /error && errorOwner===user\?\.id/, 'old errors are hidden after signing in again');
});
