import { must } from './_lib.mjs';

export default { id: 'masthead-keys', name: 'Tab reaching the bar ends the opening', async run({ page, go }) {
  await go('/posts/shihuqiao/?motion=on', { early: true });
  await page.waitForSelector('.masthead.is-hidden', { state: 'attached', timeout: 3000 }).catch(() => {});
  must(await page.evaluate(() => document.querySelector('.masthead').classList.contains('is-hidden')), 'the opening did not hold the bar away');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
  must(await page.evaluate(() => !!document.activeElement?.closest('.masthead')), 'three Tabs did not reach the bar');
  must(await page.evaluate(() => document.querySelector('.masthead').classList.contains('is-nav-expanded')), 'focus is in the bar and the bar is still hidden');
} };
