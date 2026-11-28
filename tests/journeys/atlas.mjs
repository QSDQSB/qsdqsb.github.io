import { must } from './_lib.mjs';

export default { id: 'atlas', name: 'A voyage in parts starts its map when the reader nears it', async run({ page, go }) {
  // The tiles asked for, by zoom level: laid once, they are all of the view the map settles on.
  const zooms = new Set();
  page.on('request', (r) => { const z = (r.url().match(/basemaps\.cartocdn\.com\/[^/]+\/(\d+)\/\d+\/\d+/) || [])[1]; if (z) zooms.add(z); });
  await go('/voyage/japan/');
  const at = await page.evaluate(() => { const m = document.querySelector('.map-container'); return m ? { far: m.getBoundingClientRect().top > innerHeight + 700, started: !!m.querySelector('.leaflet-pane'), leaflet: typeof L !== 'undefined' } : null; });
  must(at, 'the voyage has no map');
  must(at.leaflet, 'Leaflet did not arrive (it comes from unpkg): the journey cannot tell');
  must(at.far, 'the map is no longer far below the fold on this voyage: the journey cannot tell whether it waits');
  must(!at.started && zooms.size === 0, 'the map started with the page, far below the fold');
  await page.locator('.map-container').scrollIntoViewIfNeeded();
  await page.waitForSelector('.map-container--ready', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.map-container--ready').count() === 1, 'the map did not start when it came into view');
  await page.waitForTimeout(1200);
  must(zooms.size >= 1, 'no tile was asked for (or the tile host has changed): the journey cannot tell');
  must(zooms.size === 1, `the map asked for tiles at ${zooms.size} zoom levels (${[...zooms].join(', ')}): it laid them before its view was known`);
  // Awake from the start: a marker under the pointer opens its label, which leads to the part.
  must(await page.locator('.map-container .map-name').count() >= 2, "the parts' names are not written beside their markers");
  await page.locator('.map-container path.leaflet-interactive').first().hover();
  await page.waitForTimeout(500);
  const href = await page.locator('.leaflet-popup a.popup-content--atlas').getAttribute('href').catch(() => null);
  must(href && href.startsWith('/voyage/japan/'), 'a marker under the pointer opened no label leading to its part');
} };
