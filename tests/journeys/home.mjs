import { must } from './_lib.mjs';

export default { id: 'home', name: 'Home opens and its doors lead somewhere', async run({ page, go, ok }) {
  await go('/');
  must(await page.locator('.home__panel').count() >= 3, 'Home has fewer than three panels');
  const doors = await page.locator('.masthead a[href^="/"], .home__doors a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
  must(doors.length >= 4, `only ${doors.length} ways on from Home`);
  for (const href of doors) must(await ok(href), `${href} does not answer`);
  // The hero pays for one door plate; the others are painted when their panel shows.
  const waiting = () => page.locator('.door-shot[data-plate]').count();
  must(await waiting() >= 3, 'every door plate was painted with the page, below a hero that shows none of them');
  await page.evaluate(() => document.getElementById('home-enter').scrollIntoView({ behavior: 'instant' }));
  await page.waitForFunction(() => !document.querySelector('.door-shot[data-plate]'), null, { timeout: 4000 }).catch(() => {});
  must(await waiting() === 0, 'the door plates were not painted when their panel came into view');
  // Three panels, each a screen: nothing below the last for the scroll to snap back from.
  const tail = await page.evaluate(() => document.documentElement.scrollHeight - document.querySelectorAll('.home__panel').length * innerHeight);
  must(Math.abs(tail) <= 2, `Home runs ${tail} px past its last panel`);
  // What is new comes straight after the welcome; the rooms close the page as its index.
  const order = await page.$$eval('.home__panel', (ps) => ps.map((p) => (p.matches('.home__panel--new') ? 'new' : p.matches('.home__panel--index') ? 'rooms' : 'welcome')));
  must(order.join() === 'welcome,new,rooms', `Home's panels run ${order.join(', ')}`);
  // Each room's figure is what its page lists; About holds none.
  const figures = await page.$$eval('.home__doors .door', (ds) => ds.map((d) => [d.getAttribute('href'), d.querySelector('.door__fig')?.textContent.trim() ?? null]));
  const listed = { '/year-archive/': '#main a.card', '/voyage/': '.container a.card', '/palette/': '.palette-voyages__list a', '/bestiary/': '.bestiary-card' };
  for (const [href, figure] of figures) {
    if (!listed[href]) { must(figure === null, `${href}'s door carries a figure, ${figure}`); continue; }
    await go(href);
    await page.waitForSelector(listed[href], { timeout: 8000 }).catch(() => {});   // Palette's list is drawn by its script
    const count = await page.locator(listed[href]).count();
    must(figure === String(count), `${href}'s door says ${figure}, its page lists ${count}`);
  }
} };
