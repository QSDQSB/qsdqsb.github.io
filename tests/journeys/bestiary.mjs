import { must } from './_lib.mjs';

export default { id: 'bestiary', name: 'The Bestiary opens from the masthead, a card opens a fable in two languages, and its way on leads on and back', async run({ page, go }) {
  await go('/');
  const door = page.locator('.masthead a[href$="/bestiary/"]').first();
  must(await door.count() === 1, 'the masthead has no way to the Bestiary');
  await go('/bestiary/');
  const cards = page.locator('a.bestiary-card');
  must(await cards.count() >= 2, `only ${await cards.count()} fable card(s) on the Bestiary`);
  // Each card's photograph arrives (a cover named by an address R2 no longer serves would be blank).
  const blank = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.bestiary-card img')];
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    return imgs.filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src);
  });
  must(blank.length === 0, `a fable's cover did not load: ${blank.join(', ')}`);
  const first = await cards.first().getAttribute('href');
  must(/\/bestiary\/the-pineapple-crown\/$/.test(first), `the first card is ${first}, not the anchor story`);
  await Promise.all([page.waitForURL(`**${first}`), cards.first().click()]);
  // It opens as a story: under the title, no record of its creature or its place (the owner, 2026-11-24).
  const head = await page.evaluate(() => document.querySelector('.fable__head')?.innerText || '');
  must(/The Pineapple Crown/.test(head), `the fable's head does not carry its title: ${head.slice(0, 80)}`);
  must(!/Orange Cat|Val di Cenere|橘猫|灰烬谷/.test(head), `the fable names its creature or place before the story: ${head.slice(0, 80)}`);
  // Its room: the wash poured beside the words, the paper drawn under the cover, and the words in the
  // room's own ink on its ground.
  const room = await page.evaluate(() => ({ dye: !!document.querySelector('.fable-room canvas'), sheet: !!document.querySelector('.fable-sheet canvas'), ground: getComputedStyle(document.documentElement).getPropertyValue('--fable-ground').trim() }));
  must(room.dye && room.sheet && /^#[0-9a-f]{6}$/i.test(room.ground), `the fable's room is not drawn (${JSON.stringify(room)})`);
  // Its two texts: the switch shows the other, and only one is shown at a time.
  const zh = page.locator('.bilingual-switch__button[data-bilingual-option="中"]');
  must(await zh.count() === 1, 'the fable has no switch to its Chinese text');
  await zh.click();
  const shown = await page.evaluate(() => [...document.querySelectorAll('.fable__text [data-bilingual-lang]')].filter((s) => !s.hidden).map((s) => s.getAttribute('lang')));
  must(shown.length === 1 && shown[0] === 'zh', `after the switch the fable shows ${JSON.stringify(shown)}, not its Chinese alone`);
  must((await page.locator('.fable__text section[lang="zh"]').innerText()).includes('橘猫'), 'the Chinese text does not read as the story');
  // Its design notes never reach the page: the philosophy that found the story stays in the bestiary.
  const body = await page.locator('.fable__text').innerText();
  must(!/Design Notes|Philosophical Concept|Creature Mapping|Leibniz/.test(body), 'the fable carries its design notes');
  const next = page.locator('.fable__onward a[rel="next"]');
  must(await next.count() === 1, 'the anchor story has no way on to the next fable');
  const nextHref = await next.getAttribute('href');
  await Promise.all([page.waitForURL(`**${nextHref}`), next.click()]);
  must(await page.locator('.fable__onward a[rel="prev"]').count() === 1, `${nextHref} has no way back to the fable before it`);
  const home = page.locator('.fable__onward a[href$="/bestiary/"]');
  await Promise.all([page.waitForURL('**/bestiary/'), home.click()]);
  // On a phone there is no room beside the words: no dye, paper edge to edge (the owner, 2026-11-24),
  // and the way on in two rows, the fables either side above the Bestiary.
  const size = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await go(nextHref);
  const phone = await page.evaluate(() => {
    const top = (q) => document.querySelector(q)?.getBoundingClientRect().top ?? NaN;
    return { dye: !!document.querySelector('.fable-room canvas'), sheet: getComputedStyle(document.querySelector('.fable-sheet')).backgroundColor !== 'rgba(0, 0, 0, 0)', prev: top('.fable__onward a[rel="prev"]'), index: top('.fable__onward a[href$="/bestiary/"]') };
  });
  if (size) await page.setViewportSize(size);
  must(!phone.dye && phone.sheet, `on a phone the fable's room is ${JSON.stringify(phone)}, not paper edge to edge`);
  must(phone.prev < phone.index, `on a phone the way on is not in two rows (${JSON.stringify(phone)})`);
} };
