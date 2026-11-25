import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';

async function searchModule(mode) {
  const result = await build({configFile:false, envDir:false, logLevel:'error',
    resolve:{alias:{'@':resolve('src')}},
    define:Object.fromEntries(Object.entries({VITE_STOREFRONT_MODE:mode,VITE_SITE_URL:'https://chronos.example',VITE_SEARCH_INDEXABLE:'false'})
      .map(([name,value])=>['import.meta.env.'+name,JSON.stringify(value)])),
    build:{write:false,minify:false,lib:{entry:resolve('src/lib/search.ts'),formats:['es']}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item=>item.output);
  const code = outputs.find(item=>item.type==='chunk'&&item.isEntry).code;
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}

test('connected account/contact/checkout metadata uses the store voice and keeps the workflow contract', async()=>{
  const search = await searchModule('connected');
  assert.match(search.pageSearch('/contact').description,/Chronos team/);
  assert.match(search.pageSearch('/account').description,/Chronos account/);
  assert.equal(search.pageSearch('/my-account').description,search.pageSearch('/account').description);
  assert.equal(search.pageSearch('/my-account/').title,search.pageSearch('/account').title);
  assert.equal(search.pageSearch('/my-account').index,false);
  assert.match(search.pageSearch('/checkout').description,/Stripe checkout/);
  assert.equal(search.pageSearch('/checkout').index,false);
  assert.match(search.pageSearch('/checkout/success').description,/status of your payment/);
  assert.equal(search.cmsOwnsPage('/contact'),false);
  assert.equal(search.cmsOwnsPage('/account'),false);
  assert.equal(search.cmsOwnsPage('/privacy'),true);
  assert.equal(search.cmsOwnsPage('/about'),true);
});

test('offline preview keeps its no-submission and disabled-payment disclosures', async()=>{
  const search = await searchModule('preview');
  assert.match(search.pageSearch('/contact').description,/does not submit messages/);
  assert.match(search.pageSearch('/account').description,/No accounts are created/);
  assert.equal(search.pageSearch('/my-account').description,search.pageSearch('/account').description);
  assert.match(search.pageSearch('/checkout').description,/payments are disabled/);
  assert.match(search.pageSearch('/cart').description,/No order is created/);
});

test('offline about copy states the designs are not offered for delivery and checkout is test mode', async()=>{
  const {readFile} = await import('node:fs/promises');
  const copy = JSON.parse(await readFile(resolve('src/content/storefront.json'), 'utf8'));
  const about = copy.about.body.join(' ');
  assert.match(about, /not offered for delivery/);
  assert.match(about, /Stripe test mode/);
  assert.match(copy.legal.terms.body.join(' '), /not .*offers for sale/);
  assert.doesNotMatch(JSON.stringify(copy), /portfolio/i);
});
