import { must } from './_lib.mjs';

export default { id: 'atlas-phone', phone: true, name: 'On a phone the map unfolds to the whole screen at a tap, a marker opens its strip, and it folds back', async run({ page, go }) {
  await go('/voyage/dolomites/');
  await page.locator('.map-container').scrollIntoViewIfNeeded();
  await page.waitForSelector('.map-unfold', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.map-unfold').count() === 1, 'the folded map has no tap to unfold it');
  await page.locator('.map-unfold').dispatchEvent('click');
  await page.waitForTimeout(600);
  const box = await page.evaluate(() => { const r = document.querySelector('.map-container').getBoundingClientRect(); return [r.left, r.top, r.width - innerWidth, r.height - innerHeight]; });
  must(box.every((v) => Math.abs(v) < 1), `the unfolded map does not fill the screen (${box.join(', ')})`);
  await page.locator('.map-container path.leaflet-interactive').first().dispatchEvent('click');
  await page.waitForTimeout(400);
  const strip = await page.locator('.map-strip:not([hidden]) a.popup-content--atlas').getAttribute('href').catch(() => null);
  must(strip && strip.startsWith('/voyage/dolomites/'), "a marker's tap opened no strip leading to its part");
  await page.locator('.leaflet-control-fullscreen-button').dispatchEvent('click');
  await page.waitForTimeout(400);
  must(await page.locator('.map-container--unfolded').count() === 0 && await page.locator('#main .map-container').count() === 1, 'the close mark did not fold the map back into the page');
} };
