import { must } from './_lib.mjs';

export default { id: 'about', name: 'About leads to the CV, and the CV opens under its picture; Terms opens', async run({ page, go }) {
  await go('/about/');
  const cv = page.locator('.about__onward a[href="/cv/"]');
  must(await cv.count() === 1, 'About has no way to the CV');
  await cv.click();
  await page.waitForURL('**/cv/', { timeout: 10000 }).catch(() => {});
  must(new URL(page.url()).pathname === '/cv/', 'the way to the CV did not lead there');
  must(await page.locator('.page__hero--overlay').count() === 1, 'the CV opens without its picture');
  await go('/terms/');
  must(/Terms/.test(await page.locator('h1').first().innerText()), 'Terms opens without its title');
} };
