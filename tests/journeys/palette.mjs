import { must } from './_lib.mjs';

export default { id: 'palette', name: 'Palette draws its voyages and opens one', async run({ page, go }) {
  await go('/palette/');
  await page.waitForSelector('.palette-voyages__list a[href^="#"]', { timeout: 15000 }).catch(() => {});
  const rows = page.locator('.palette-voyages__list a[href^="#"]');
  must(await rows.count() >= 10, `only ${await rows.count()} voyages in the palette list`);
  // At the foot, of the overview and of a voyage's palette, the way on to the essay on how the colours came by their names.
  const essay = page.locator('.palette-page .colour-next a[href$="/posts/in-the-naming-of-light/"]');
  must(await essay.count() === 1, 'the Palette has no way on to In the Naming of Light');
  await rows.first().click();
  await page.waitForFunction(() => location.hash.length > 1, null, { timeout: 5000 }).catch(() => {});
  must(new URL(page.url()).hash.length > 1, 'choosing a voyage did not change the address');
  await page.waitForSelector('.palette-cards', { timeout: 8000 }).catch(() => {});
  must(await essay.count() === 1, "a voyage's palette has no way on to In the Naming of Light");
  // It ends with a way on: the next voyage by colour, and its own book.
  must(await page.locator('.palette-page .colour-next a[href^="#"]').count() === 1, "a voyage's palette has no way on to the next voyage by colour");
  must(await page.locator('.palette-page .colour-next a[href^="/voyage/"]').count() === 1, "a voyage's palette has no way on to its book");
} };
