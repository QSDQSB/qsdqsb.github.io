import { must } from './_lib.mjs';

export default { id: 'atlas-index', name: 'The Voyage page keeps its map after the covers, and a marker opens its label', async run({ page, go }) {
  await go('/voyage/');
  const after = await page.evaluate(() => { const a = document.querySelector('.container > .voyage-atlas'); const cards = document.querySelectorAll('.container > a.card'); return !!a && cards.length > 0 && !!(cards[cards.length - 1].compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING); });
  must(after, 'the atlas is gone from the Voyage page, or stands before the covers');
  await page.locator('.voyage-atlas .map-container').scrollIntoViewIfNeeded();
  await page.waitForSelector('.map-container--ready', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.map-container--ready').count() === 1, 'the map did not start when it came into view');
  await page.locator('.map-container path.leaflet-interactive').first().dispatchEvent('mouseover');   // the first voyage may lie outside Europe's view, where no pointer reaches it
  await page.waitForTimeout(500);
  const href = await page.locator('.leaflet-popup a.popup-content--atlas').getAttribute('href').catch(() => null);
  must(href && href.startsWith('/voyage/'), 'a marker under the pointer opened no label leading to its voyage');
} };
