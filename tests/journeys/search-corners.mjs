import { must } from './_lib.mjs';

export default { id: 'search-corners', name: 'With search open, the corner cards take no click', async run({ page, go }) {
  await go('/voyage/');
  const corner = await page.evaluate(() => {
    const a = document.querySelector('a.floating_tarot_card_container[href]:not([data-random-jump])');
    if (!a) return null;
    const r = a.getBoundingClientRect(), x = Math.min(innerWidth - 2, Math.max(2, r.left + r.width / 2)), y = Math.min(innerHeight - 2, Math.max(2, r.top + r.height / 2));
    return { x, y, hit: !!document.elementFromPoint(x, y)?.closest('.floating_tarot_card_container') };
  });
  must(corner, 'the Voyage index has no corner card: the journey cannot tell');
  must(corner.hit, 'the corner card is not where a click would find it: the journey cannot tell');
  await page.locator('.search__toggle').click();
  await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
  must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open');
  await page.mouse.click(corner.x, corner.y);
  await page.waitForTimeout(800);
  must(new URL(page.url()).pathname === '/voyage/', 'a click through the open search panel landed on an unseen corner card');
} };
