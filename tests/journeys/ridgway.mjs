import { must } from './_lib.mjs';

export default { id: 'ridgway', name: "Ridgway's plates stand as the book sets them: three hues by seven steps, every colour named, three plates abreast", async run({ page, go }) {
  await go('/utils/ridgway/');
  const plates = page.locator('.ridgway-plate');
  must(await plates.count() >= 50, `only ${await plates.count()} of Ridgway's plates`);
  const first = await plates.first().evaluate((s) => ({ n: s.querySelectorAll('.ridgway-swatch').length, cols: getComputedStyle(s.querySelector('ol')).gridTemplateColumns.split(' ').length, unnamed: [...s.querySelectorAll('.ridgway-swatch b')].filter((b) => !b.textContent.trim()).length }));
  must(first.n === 21 && first.cols === 3, `a plate holds ${first.n} colours in ${first.cols} columns, not three hues by seven steps`);
  must(first.unnamed === 0, `${first.unnamed} colours on a plate have no name`);
  const tops = await plates.evaluateAll((ps) => ps.slice(0, 3).map((p) => Math.round(p.getBoundingClientRect().top)));
  must(new Set(tops).size === 1, `the first three plates are not abreast on a desktop (tops ${tops.join(', ')})`);
  must(await page.locator('.ridgway-swatch[href*="/reverie/?c="]').count() >= 1000, "the plates' colours do not open their Reverie");
} };
