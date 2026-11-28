import { must } from './_lib.mjs';

export default { id: 'language-arrival', name: 'A switch of language shows the other text at once, in turn', async run({ page, go }) {
  // The panel just shown arrives as a screen does: its first block at once, not after the blocks
  // already on the screen have taken the turns.
  await go('/posts/defined-by-archive/?motion=on');
  await page.evaluate(() => scrollTo({ top: innerHeight * 1.5, behavior: 'instant' }));
  // A reader reads before switching: past the four seconds the head's hold lasts, as most do.
  await page.waitForTimeout(4500);
  const other = page.locator('.bilingual-switch__button[aria-pressed="false"]').first();
  must(await other.count() === 1, 'the post has no other language to switch to');
  // At the click itself the panel's blocks in view are given their turns, the first with none to wait.
  // (The turns are the arrival's to decide; when the fade then starts is the browser's frame rate,
  // which a headless browser laying out a panel of Chinese makes slow, so it is not timed here.)
  const turns = await other.evaluate((b) => {
    b.click(); // where it stands: the page is not scrolled to it
    return [...document.querySelectorAll('.bilingual-switch__panel:not([hidden]) .reveal-on-scroll')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9; })
      .map((el) => (el.classList.contains('is-visible') ? el.style.getPropertyValue('--arrive-delay') || '0s' : 'waiting'));
  });
  must(turns.length > 0, 'after the switch no block of the other language is in view');
  must(turns[0] === '0s', `the other language's first block in view does not arrive at once (its turn: ${turns[0]}; all: ${turns.join(', ')})`);
  must(!turns.includes('waiting'), `a block of the other language in view was left for the next scroll (${turns.join(', ')})`);
  await page.waitForTimeout(1500);
  const left = await page.evaluate(() => [...document.querySelectorAll('.bilingual-switch__panel:not([hidden]) .reveal-on-scroll')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9 && parseFloat(getComputedStyle(el).opacity) < 0.99; }).length);
  must(left === 0, `${left} block(s) of the other language are not at full strength 1.5 s after the switch`);
} };
