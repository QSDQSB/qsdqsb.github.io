import { must } from './_lib.mjs';

export default { id: 'drift', name: 'Drift opens on a photograph with its controls', async run({ page, go }) {
  await go('/drift/');
  await page.waitForSelector('.colour-drift__zone', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.colour-drift__zone').count() === 2, 'Drift has no way forward or back');
  // In a colour, Escape is the way back to it; with search open the key closes search and no more.
  await go('/drift/?c=4a6fa5');
  await page.waitForSelector('.colour-drift__zone', { timeout: 15000 }).catch(() => {});
  await page.locator('.search__toggle').click();
  await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
  must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open over Drift');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  must(await page.locator('.search-content.is--visible').count() === 0, 'Escape did not close search');
  must(new URL(page.url()).pathname.includes('/drift/'), 'Escape closed search and also left Drift');
} };
