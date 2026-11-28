import { must } from './_lib.mjs';

export default { id: 'cover-focus', name: 'On Posts a cover reached by keyboard shows its words, as it does under the pointer', async run({ page, go }) {
  await go('/year-archive/');
  const card = page.locator('a.card').first();
  const date = card.locator('.date');
  await card.focus();
  await page.waitForFunction((el) => getComputedStyle(el).opacity === '1', await date.elementHandle(), { timeout: 3000 }).catch(() => {});
  must(await date.evaluate((el) => getComputedStyle(el).opacity) === '1', 'a cover reached by keyboard keeps its date hidden');
} };
