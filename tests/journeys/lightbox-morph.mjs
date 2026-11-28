import { must } from './_lib.mjs';

export default { id: 'lightbox-morph', name: 'A print grows into the lightbox as it opens', async run({ page, go }) {
  await go('/voyage/london/?motion=on');
  if (!(await page.evaluate(() => 'startViewTransition' in document))) return;   // a browser with no view transitions simply opens
  const print = page.locator('.photobook-frame__print').nth(1);
  await print.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const im = document.querySelectorAll('.photobook-frame__print img')[1]; return im && im.complete && im.naturalWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => {
    window.__morph = false;
    const until = performance.now() + 3000;
    const look = () => { if (document.getAnimations().some((x) => (x.effect?.pseudoElement || '').includes('photobook-print'))) window.__morph = true; else if (performance.now() < until) requestAnimationFrame(look); };
    requestAnimationFrame(look);
  });
  await print.click();
  await page.waitForFunction(() => window.__morph, null, { timeout: 4000 }).catch(() => {});
  must(await page.evaluate(() => window.__morph), 'the lightbox opened with a plain crossfade: the print on the mat was not named for the transition');
  await page.waitForTimeout(900);
  must(await page.evaluate(() => { const im = document.querySelector('.photobook-lightbox__mat > img.is-on'); return !!im && !im.style.viewTransitionName && !im.style.transition; }), 'the opened print kept its transition name or its stilled fade');
} };
