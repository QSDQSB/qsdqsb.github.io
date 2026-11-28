import { must } from './_lib.mjs';

export default { id: 'post', name: 'A post opens from the archive, and its contents list points at real headings', async run({ page, go }) {
  await go('/year-archive/');
  const href = await page.locator('a.card[href*="/posts/"]').first().getAttribute('href');
  must(href, 'the archive lists no posts');
  await go(href);
  must((await page.locator('.page__content').innerText()).trim().length > 200, `${href} has no body text`);
  const dead = await page.locator('.toc__menu a[href^="#"]').evaluateAll((as) => as.map((a) => decodeURIComponent(a.getAttribute('href').slice(1))).filter((id) => id && !document.getElementById(id)));
  must(dead.length === 0, `contents links with no heading: ${dead.slice(0, 3).join(', ')}`);
} };
