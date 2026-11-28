import { must } from './_lib.mjs';

export default { id: 'reverie-unheld', name: 'A colour no photograph holds opens on the one that comes closest', async run({ page, go }) {
  await go('/reverie/?c=ff00ff');
  await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
  must((await page.locator('.reverie__code').innerText()).toUpperCase().includes('FF00FF'), 'the colour asked for is not the colour shown');
  must(await page.locator('.palette-card__print').count() >= 1, 'an unheld colour showed no photograph');
  const from = new URL(page.url()).searchParams.get('from');
  must(from, 'the page did not say which photograph it opened on');
  await page.goto('about:blank');
  await go('/reverie/?c=ff00ff');
  await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
  must(new URL(page.url()).searchParams.get('from') === from, 'the same unheld colour opened on a different photograph: it is choosing at random');
} };
