import { must } from './_lib.mjs';

export default { id: 'deeplink', name: 'A frame\'s address opens that frame', async run({ page, go }) {
  await go('/voyage/london/');
  await page.locator('.photobook-frame__print').first().click();
  await page.waitForFunction(() => location.hash.length > 1, null, { timeout: 8000 }).catch(() => {});
  const hash = new URL(page.url()).hash;
  must(hash.length > 1, 'an open frame has no address to share');
  await page.goto('about:blank');   // the same page with a new hash would not load afresh
  await go(`/voyage/london/${hash}`);
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
  must(await page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true), `${hash} did not open its frame`);
} };
