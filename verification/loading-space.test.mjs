import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// While the catalogue loaded, the shop and product pages were one line tall, so the footer
// sat on screen and jumped away when the watches arrived (CLS 0.17-0.57 on the live site,
// 25 Nov 2026). Every state without the product grid (loading, error, empty, not found)
// holds a screen of space, so the footer stays below the fold however the request ends.
// This checks the markup; the layout-shift numbers come from the browser measurement
// recorded in DEFECT-LOG.md (CI's preview mode loads no data, so it cannot measure this).
const source = (file) => readFile(resolve(file), 'utf8');

test('every shop state without the grid reserves the page height', async () => {
  const shop = await source('src/pages/Shop.tsx');
  assert.match(shop, /isPending \? \(\s*<div className="reserved-region" role="status">/, 'loading');
  assert.match(shop, /isError \? \(\s*<div className="reserved-region" role="alert">/, 'error');
  assert.match(shop, /<div className="empty-state reserved-region">/, 'empty');
});

test('the product page reserves the height until a product is shown', async () => {
  const product = await source('src/pages/ProductDetail.tsx');
  const fallback = product.match(/if \(!p\)\s*return \(\s*<Layout>\s*<div className="([^"]+)">/);
  assert.ok(fallback, 'the no-product branch renders one container');
  assert.ok(fallback[1].split(' ').includes('reserved-region'), 'loading, error and not found all reserve the height');
  assert.match(product, /<section className="container product-page reserved-region">/, 'the loaded page is never shorter than the placeholder (tall screens)');
});

test('the reserved region is one small-viewport screen tall', async () => {
  const css = await source('src/index.css');
  const rule = css.match(/\.reserved-region\s*\{([^}]*)\}/);
  assert.ok(rule, '.reserved-region is defined');
  assert.match(rule[1], /min-height:\s*100svh/, 'svh, so phone toolbars do not change it (all build targets support it)');
});
