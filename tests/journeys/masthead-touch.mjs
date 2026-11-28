import { must } from './_lib.mjs';

export default { id: 'masthead-touch', phone: true, name: 'On a phone the bar stays away while reading and answers a tap at the top', async run({ page, go }) {
  const has = (cls) => page.evaluate((c) => document.querySelector('.masthead').classList.contains(c), cls);
  await go('/posts/shihuqiao/?motion=on', { early: true });
  await page.waitForSelector('.masthead.is-hidden', { state: 'attached', timeout: 3000 }).catch(() => {});
  must(await has('is-hidden'), 'the opening did not hold the bar away');
  await page.touchscreen.tap(300, 70);
  await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
  must(await has('is-nav-expanded'), 'a tap at the top did not end the opening and bring the bar');

  await page.goto('about:blank');
  await go('/posts/shihuqiao/?motion=on');
  await page.waitForTimeout(4500);
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  await page.waitForSelector('.masthead.is-nav-collapsed.is-nav-faded', { state: 'attached', timeout: 6000 }).catch(() => {});
  must(await has('is-nav-faded'), 'the bar did not step away while the page was read');
  const spot = await page.evaluate(() => [[20, 600], [370, 600], [20, 480], [195, 700]].find(([x, y]) => !document.elementFromPoint(x, y)?.closest('a, button, input, summary')) || null);
  must(spot, 'found nowhere to tap that is not a control');
  await page.touchscreen.tap(spot[0], spot[1]);
  await page.waitForTimeout(700);
  must(await has('is-nav-faded'), 'a finger on the page called the bar: it should answer only a reader looking for it');
  await page.touchscreen.tap(300, 70);
  await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
  must(await has('is-nav-expanded'), 'a tap at the top of the screen did not bring the bar back');
} };
