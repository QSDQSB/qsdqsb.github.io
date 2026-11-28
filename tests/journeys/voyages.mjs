import { must } from './_lib.mjs';

export default { id: 'voyages', name: 'The Voyage index lists voyages and a card opens one', async run({ page, go }) {
  await go('/voyage/');
  const cards = page.locator('a.card');
  must(await cards.count() >= 10, `only ${await cards.count()} voyage cards`);
  const href = await cards.first().getAttribute('href');
  await Promise.all([page.waitForURL(`**${href}`), cards.first().click()]);
  must(await page.locator('h1').count() >= 1, `${href} opened without a title`);
} };
