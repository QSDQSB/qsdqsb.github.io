import { must } from './_lib.mjs';

export default { id: 'post-spread', name: 'On a wide window a post is one centred spread, with and without a profile', async run({ page, go }) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const [url, profile] of [['/posts/in-the-naming-of-light/', true], ['/posts/shihuqiao/', false]]) {
    await go(url);
    const at = await page.evaluate(() => {
      const box = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
      const text = box('.page__content'), toc = box('.sidebar__right .toc'), side = box('#main > .sidebar');
      return { centre: text.left + text.width / 2, mid: innerWidth / 2, root: getComputedStyle(document.documentElement).fontSize, toc: !!toc && toc.width > 0, side: !!side && side.width > 0, over: document.documentElement.scrollWidth - innerWidth };
    });
    must(Math.abs(at.centre - at.mid) <= 2, `${url}: the text stands ${Math.round(at.centre - at.mid)} px off the window's centre`);
    must(at.root === '20px', `${url}: the post did not step up a size at 1920 px (root ${at.root})`);
    must(at.toc, `${url}: the contents list is gone`);
    must(at.side === profile, `${url}: the profile is ${profile ? 'missing' : 'shown where the post has none'}`);
    must(at.over <= 0, `${url}: the page scrolls sideways by ${at.over} px`);
  }
} };
