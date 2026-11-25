import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// After Stripe sends the shopper back, the page must never say "not confirmed" unless the
// store actually checked and Stripe said unpaid. Signed out, still loading or a failed
// check each get their own honest message.
async function stateModule() {
  const result = await build({configFile:false, envDir:false, logLevel:'error',
    resolve:{alias:{'@':resolve('src')}},
    build:{write:false,minify:false,lib:{entry:resolve('src/pages/checkoutSuccessState.ts'),formats:['es']}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item=>item.output);
  const code = outputs.find(item=>item.type==='chunk'&&item.isEntry).code;
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}

const base = {hasSession:true, authLoading:false, signedIn:true, checking:false, failed:false, paid:undefined};

test('each situation on the success page maps to one honest state', async () => {
  const {checkoutSuccessState: s} = await stateModule();
  assert.equal(s({...base, authLoading:true}), 'checking', 'sign-in still restoring');
  assert.equal(s({...base, checking:true}), 'checking', 'request in flight');
  assert.equal(s({...base, signedIn:false}), 'signIn', 'signed out or session expired');
  assert.equal(s({...base, failed:true}), 'unknown', 'check failed');
  assert.equal(s({...base, paid:true}), 'paid');
  assert.equal(s({...base, paid:false}), 'unpaid', 'only an explicit answer says unpaid');
  assert.equal(s({...base}), 'checking', 'enabled but no answer yet');
  assert.equal(s({...base, hasSession:false}), 'missing', 'no Stripe session in the link');
  assert.equal(s({...base, paid:null}), 'unknown', 'answered without a paid flag');
});

test('success page uses the state and every state has copy', async () => {
  const page = await readFile(resolve('src/pages/CheckoutSuccess.tsx'), 'utf8');
  assert.match(page, /checkoutSuccessState\(/);
  assert.doesNotMatch(page, /result\.isFetching \? c\.confirming : paid \? c\.paid : c\.unpaid/, 'old two-way heading removed');
  const copy = JSON.parse(await readFile(resolve('src/content/connected.json'), 'utf8')).checkout;
  for (const key of ['confirming', 'paid', 'unpaid', 'signInToVerify', 'verifyFailed', 'missingSession']) assert.ok(copy[key], `checkout.${key} copy`);
  assert.doesNotMatch(copy.signInToVerify, /not been confirmed/i);
  assert.doesNotMatch(copy.verifyFailed, /not been confirmed/i);
  assert.doesNotMatch(copy.missingSession, /not been confirmed/i);
  assert.match(page, /staleTime:Infinity,refetchInterval:false/, 'no background re-checks');
});
