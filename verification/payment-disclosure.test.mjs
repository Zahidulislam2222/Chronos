import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Every screen that leads to or follows a payment must say that checkout is Stripe test mode.
async function contentModule(mode) {
  const result = await build({configFile:false, envDir:false, logLevel:'error',
    resolve:{alias:{'@':resolve('src')}},
    define:Object.fromEntries(Object.entries({VITE_STOREFRONT_MODE:mode})
      .map(([name,value])=>['import.meta.env.'+name,JSON.stringify(value)])),
    build:{write:false,minify:false,lib:{entry:resolve('src/content/index.ts'),formats:['es']}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item=>item.output);
  const code = outputs.find(item=>item.type==='chunk'&&item.isEntry).code;
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}

const disclosure = (text, where) => {
  assert.match(text, /Stripe in test mode|Stripe test mode/, `${where}: names Stripe test mode`);
  assert.match(text, /no card is charged/i, `${where}: says no card is charged`);
  assert.match(text, /not shipped|no order ships/i, `${where}: says orders do not ship`);
};

test('connected storefront copy discloses Stripe test mode wherever money is involved', async () => {
  const {content, connectedContent} = await contentModule('connected');
  disclosure(connectedContent.checkout.notice, 'checkout and success screens');
  disclosure(content.preview.notice, 'bag drawer and cart page');
  disclosure(content.ui.productNote, 'product page');
});

test('checkout, success, bag drawer, cart and product screens render the disclosure', async () => {
  const source = async (file) => readFile(resolve('src', file), 'utf8');
  assert.match(await source('pages/ConnectedCheckout.tsx'), /\{c\.notice\}/);
  assert.match(await source('pages/CheckoutSuccess.tsx'), /\{c\.notice\}/);
  assert.match(await source('components/CartDrawer.tsx'), /\{content\.preview\.notice\}/);
  assert.match(await source('pages/Cart.tsx'), /\{content\.preview\.notice\}/);
  assert.match(await source('pages/ProductDetail.tsx'), /\{content\.ui\.productNote\}/);
});
