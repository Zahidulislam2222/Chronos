import { renderStateAttribute } from '../src/lib/render-readiness.mjs';

export async function requirePublishedPageContent(page) {
  const body = page.locator('.information-page .wordpress-content');
  if (await body.count() !== 1 || !(await body.innerText()).trim()) {
    throw new Error('Published CMS page content missing');
  }
}

export async function withinRenderDeadline(run, deadline) {
  const remaining = deadline - performance.now();
  if (remaining <= 0) throw new Error('Render deadline exceeded');
  let timer;
  try {
    return await Promise.race([run(), new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Render deadline exceeded')), remaining);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForRenderReady(page, deadline) {
  if (performance.now() >= deadline) throw new Error('Render deadline exceeded');
  const observed = await page.waitForFunction(attribute => {
    const state = document.querySelector('main')?.getAttribute(attribute);
    return state === 'ready' || state === 'error' ? state : false;
  }, renderStateAttribute, {timeout: Math.max(1, deadline - performance.now())});
  try {
    if (performance.now() >= deadline) throw new Error('Render deadline exceeded');
    if (await observed.jsonValue() === 'error') {
      throw new Error('Required page data failed during render');
    }
  } finally {
    await observed.dispose();
  }
}

export async function captureRenderedPage(page) {
  return page.evaluate(attribute => {
    if (document.querySelector('main')?.getAttribute(attribute) === 'error') throw new Error('Required page data failed before capture');
      // Capture the same semantic UI supplied to people; never crawler-only content.
      const clone = document.documentElement.cloneNode(true);
      // Vite 8's preload helper writes absolute URLs on the preview server's origin.
      clone.querySelectorAll('[href],[src]').forEach(n => { for (const a of ['href','src']) { const v = n.getAttribute(a); if (v && v.startsWith(location.origin + '/')) n.setAttribute(a, v.slice(location.origin.length)); } });
      clone.removeAttribute('style');
      clone.classList.add('prerendered');
      clone.querySelectorAll('script[data-chronos-runtime], [data-radix-portal]').forEach(n => n.remove());
      clone.querySelectorAll('[style]').forEach(n => { n.style.removeProperty('opacity'); n.style.removeProperty('transform'); });
      clone.querySelectorAll('video').forEach(n => { n.removeAttribute('autoplay'); n.setAttribute('preload','none'); });
      return {html:'<!doctype html>\n'+clone.outerHTML, canonical:document.querySelector('link[rel="canonical"]')?.href,index:document.querySelector('meta[name="robots"]')?.content.startsWith('index'),title:document.title};
  }, renderStateAttribute);
}
