import { must } from './_lib.mjs';

export default { id: 'lost', name: 'A wrong address gets the 404 page with ways back', async run({ page, go }) {
  const status = await go('/no-such-page-here/', { expect: 404 });
  must(status === 404, `a missing page answered ${status}`);
  must(await page.locator('a[href="/"], a[href^="/voyage"], a[href^="/year-archive"]').count() >= 1, 'the 404 page offers no way back');
} };
