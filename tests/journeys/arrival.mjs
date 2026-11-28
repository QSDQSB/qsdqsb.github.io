import { must } from './_lib.mjs';

export default { id: 'arrival', name: 'On a long post a jump to the foot leaves no screen without words', async run({ page, go }) {
  // Words arrive as they come into view (_scroll-animations.scss, "The arrival"): the first four
  // blocks in turn, 0.12 s apart, each over 0.7 s, so all of a screen is in by 1.06 s.
  const hidden = () => page.evaluate(() => [...document.querySelectorAll('.page__content .reveal-on-scroll')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9 && parseFloat(getComputedStyle(el).opacity) < 0.99;
  }).length);
  // The first screen arrives too, in turn (Q19): its blocks' fade runs, rather than their being drawn shown.
  await page.addInitScript(() => {
    window.__arrivals = 0;
    addEventListener('transitionrun', (e) => { if (e.propertyName === 'opacity' && e.target.classList?.contains('arrives')) window.__arrivals++; }, true);
  });
  await go('/posts/leetcode-july-challenge/?motion=on', { early: true });
  await page.waitForTimeout(1500);
  const first = await page.evaluate(() => window.__arrivals);
  must(first >= 1, 'the first screen was drawn shown, not arrived');
  must(await page.locator('.page__content .reveal-on-scroll.arrives').count() > 10, 'the post\'s blocks do not arrive');
  // To the end of the post's words (below them the footer fills the screen).
  const toEnd = () => page.evaluate(() => {
    const last = [...document.querySelectorAll('.page__content > *')].filter((el) => el.getBoundingClientRect().height > 0).pop();
    scrollTo({ top: last.getBoundingClientRect().bottom + scrollY - innerHeight * 0.8, behavior: 'instant' });
  });
  await toEnd();
  await page.waitForTimeout(400);
  const seen = await page.evaluate(() => [...document.querySelectorAll('.page__content .reveal-on-scroll')].some((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && parseFloat(getComputedStyle(el).opacity) > 0.2;
  }));
  must(seen, 'at the foot of the post nothing has begun to show after 0.4 s');
  await page.waitForTimeout(900);
  const left = await hidden();
  must(left === 0, `${left} block(s) in view are still not at full strength 1.3 s after the jump`);
  // Stillness: with motion off nothing is ever hidden.
  await go('/posts/leetcode-july-challenge/');
  await toEnd();
  await page.waitForTimeout(100);
  must(await hidden() === 0, 'with motion off a block in view was hidden');
} };
