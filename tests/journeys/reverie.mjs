import { must } from './_lib.mjs';

export default { id: 'reverie', name: 'Reverie shows a colour and the photographs that hold it', async run({ page, go }) {
  await go('/reverie/?c=4a6fa5');
  await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
  must((await page.locator('.reverie__code').innerText()).toUpperCase().includes('4A6FA5'), 'the colour asked for is not the colour shown');
  must(await page.locator('.palette-card__print').count() >= 1, 'no photographs for a colour that has them');
  must(await page.locator('.reverie__credit a[href$="/posts/in-the-naming-of-light/"]').count() === 1, 'Reverie has no way on to In the Naming of Light');
  // A print opens in the lightbox, a dye vat for each frame on its rail.
  const open = () => page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true);
  await page.locator('.palette-card__print').first().click();
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
  must(await open(), 'a print did not open in the lightbox');
  await page.waitForFunction(() => { const r = document.querySelector('.photobook-lightbox__rail'); return r.children.length > 1 && r.querySelectorAll('canvas').length === r.children.length; }, null, { timeout: 8000 }).catch(() => {});
  must(await page.evaluate(() => { const r = document.querySelector('.photobook-lightbox__rail'); return r.querySelectorAll('canvas').length === r.children.length; }), "the rail's marks were not all drawn");
  // The colour is the lightbox's first frame: its address (#colour) opens it, as a photograph's does.
  await page.goto('about:blank');
  await go('/reverie/?c=4a6fa5#colour');
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 15000 }).catch(() => {});
  must(await open(), '#colour did not open the lightbox on the colour');
  must(await page.locator('.photobook-lightbox__painted').count() >= 1, '#colour opened on something other than the colour');
  // The colour fills the lightbox's frame, whatever the window's shape.
  await page.waitForTimeout(400);
  const fill = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), m = r('.photobook-lightbox__mat'), p = r('.photobook-lightbox__painted'); return [p.width / m.width, p.height / m.height]; });
  must(fill.every((x) => x > 0.97), `the colour fills ${fill.map((x) => `${Math.round(x * 100)}%`).join(' × ')} of the lightbox's frame`);
} };
