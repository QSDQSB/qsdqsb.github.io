import { must } from './_lib.mjs';

export default { id: 'post-contents', phone: true, name: "On a phone a post's contents are one row that a press opens and closes, a chapter leads to its heading, the text begins on the first screen; on a wide window the list is open and marks the chapter being read", async run({ page, go }) {
  await go('/posts/terminology/');
  const toggle = page.locator('.sidebar__right .toc__toggle');
  const menu = page.locator('.sidebar__right .toc__menu');
  must(await toggle.count() === 1, 'the contents have no row to press');
  must(!(await menu.isVisible()), 'the contents lie open above the text');
  must(await toggle.getAttribute('aria-expanded') === 'false', 'the folded row does not say it is folded');
  must(/\d+ parts?/i.test(await page.locator('.sidebar__right .toc__count').textContent()), 'the row does not say how many parts');
  must(await page.evaluate(() => document.querySelector('.page__content').getBoundingClientRect().top < innerHeight), 'the text does not begin on the first screen');
  await toggle.click();
  must(await menu.isVisible() && await toggle.getAttribute('aria-expanded') === 'true', 'a press did not open the contents');
  // Opened, a chapter leads to its heading.
  const link = menu.locator('a[href^="#"]').nth(3);
  const id = decodeURIComponent((await link.getAttribute('href')).slice(1));
  await link.click();
  await page.waitForFunction((x) => { const h = document.getElementById(x); return h && Math.abs(h.getBoundingClientRect().top) < innerHeight / 2; }, id, { timeout: 4000 }).catch(() => {});
  must(await page.evaluate((x) => Math.abs(document.getElementById(x).getBoundingClientRect().top) < innerHeight / 2, id), 'a chapter in the opened contents did not lead to its heading');
  await page.evaluate(() => window.scrollTo(0, 0));
  await toggle.click();
  must(!(await menu.isVisible()), 'a second press did not fold them again');
  // On a wide window the list stands open beside the text, and marks the chapter being read.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate((x) => document.getElementById(x).scrollIntoView(), id);
  await page.waitForTimeout(400);
  must(await menu.isVisible() && await toggle.isDisabled(), 'on a wide window the contents are not an open list');
  must(await page.locator('.toc__menu a.toc-active').count() === 1, 'the chapter being read is not marked');
} };
