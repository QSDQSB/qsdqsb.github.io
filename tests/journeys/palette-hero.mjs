import { must } from './_lib.mjs';

export default { id: 'palette-hero', name: "Palette's head is the dye: choosing a voyage changes it at once with motion off, and the round vat stays", async run({ page, go }) {
  await go('/palette/');
  const layer = () => page.evaluate(() => { const m = document.querySelector('.palette-hero .page__hero-media--dye'), c = m?.lastElementChild; if (!c || c.tagName !== 'CANVAS') return null; c.dataset.seen ??= String(Math.random()); const d = c.getContext('2d').getImageData(c.width >> 1, c.height >> 1, 1, 1).data; return { id: c.dataset.seen, px: [...d].join(','), opacity: getComputedStyle(c).opacity, layers: m.children.length }; });
  await page.waitForFunction(() => document.querySelector('.palette-hero .page__hero-media--dye canvas'), null, { timeout: 15000 }).catch(() => {});
  const first = await layer();
  must(first && first.px.split(',')[3] > 200, "Palette's hero shows no dye");
  must((await page.locator('.palette-hero h1').innerText()).trim() === "QSD's Palette", "Palette's hero does not carry its title");
  await page.locator('.palette-voyages__list a[href="#barcelona"]').click();
  await page.waitForSelector('.palette-cards', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(150);
  const second = await layer();
  must(second && second.id !== first.id && second.px !== first.px, "choosing a voyage did not change the hero's dye");
  must(second.opacity === '1', `with motion off the hero's new dye is at ${second.opacity}, not there at once`);
  must(await page.locator('.palette-voyage__vat canvas').count() >= 1, "a voyage's round vat is gone from beside its colours");
  must((await page.locator('.palette-hero .colour-kicker').innerText()).trim().toLowerCase() === 'palette', 'the label over a voyage\'s title does not read "Palette"');
} };
