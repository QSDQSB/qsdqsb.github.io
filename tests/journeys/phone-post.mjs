import { must } from './_lib.mjs';

export default { id: 'phone-post', phone: true, name: 'On a phone a long title wraps inside the screen, and the subscribe field does not make an iPhone zoom', async run({ page, go }) {
  await go('/posts/war-declaration-to-boredom/');
  const title = await page.evaluate(() => { const t = document.querySelector('.page__hero--overlay .page__title'); if (!t) return null; const r = t.getBoundingClientRect(); return { right: r.right, clipped: t.scrollWidth - t.clientWidth, lines: Math.round(r.height / parseFloat(getComputedStyle(t).lineHeight)), over: document.documentElement.scrollWidth - innerWidth, vw: innerWidth }; });
  must(title, 'the post has no hero title');
  must(title.lines >= 2, 'the long title is on one line: the journey cannot tell whether it would wrap');
  must(title.right <= title.vw && title.clipped <= 1, 'the long title runs off the screen');
  must(title.over <= 0, `the page scrolls sideways by ${title.over} px`);
  const field = await page.evaluate(() => { const i = document.querySelector('.subscribe-slip__input'); return i ? parseFloat(getComputedStyle(i).fontSize) : null; });
  must(field !== null, 'the post has no subscribe slip');
  must(field >= 16, `the subscribe field is ${field} px by touch: under 16 px Safari on an iPhone zooms the page`);
} };
