import { must } from './_lib.mjs';

export default { id: 'no-webgl', nogl: true, name: 'Where there is no WebGL the colour pages still open, with a still vat and no error', async run({ page, go }) {
  await go('/palette/');
  await page.waitForSelector('.palette-voyages__list a[href^="#"]', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.palette-voyages__list a[href^="#"]').count() >= 10, 'the palette did not draw its voyages without WebGL');
  // A still vat stands in: painted (an opaque middle), and repainted, label and all, for the next voyage.
  const vatNow = () => page.evaluate(() => { const c = [...document.querySelectorAll('canvas.colour-vat')].find((x) => x.getAttribute('aria-label')); if (!c) return null; const d = c.getContext('2d')?.getImageData(c.width / 2, c.height / 2, 1, 1).data; return { label: c.getAttribute('aria-label'), still: c.dataset.still, opaque: !!d && d[3] > 200, mid: d ? [...d].join(',') : '' }; });
  const links = page.locator('.palette-voyages__list a[href^="#"]');
  await links.nth(0).click(); await page.waitForTimeout(500);
  const first = await vatNow();
  must(first && first.still === '2d' && first.opaque, 'without WebGL the vat was not painted in its still version');
  const name = (await links.nth(3).innerText()).trim().split('\n')[0];
  await links.nth(3).click(); await page.waitForTimeout(500);
  const second = await vatNow();
  must(second && second.still === '2d' && second.opaque, 'without WebGL the vat was not repainted for the next voyage');
  must(second.label.includes(name), `without WebGL the vat still says "${second.label}" after choosing ${name}`);
  must(second.mid !== first.mid, 'without WebGL the vat kept the first voyage\'s colours');
  await go('/reverie/?c=4a6fa5');
  await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
  must(await page.locator('.palette-card__print').count() >= 1, 'Reverie showed no photographs without WebGL');
  const chip = page.locator('.reverie__chip').first();
  if (await chip.count()) await chip.hover().catch(() => {});   // a stir asked of a still vat does nothing, and throws nothing
  await go('/');
  const tile = page.locator('.wn-dye').first();
  if (await tile.count()) { await tile.scrollIntoViewIfNeeded().catch(() => {}); await tile.hover().catch(() => {}); }   // Home's Reverie tile stirs its vat on hover
  await page.waitForTimeout(600);   // every vat the page makes after the first has had its turn to throw
} };
