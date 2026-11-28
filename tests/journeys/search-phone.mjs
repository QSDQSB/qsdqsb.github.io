import { webkit, devices } from 'playwright-core';
import { must } from './_lib.mjs';

export default { id: 'search-phone', name: 'In Safari\'s engine on a phone the results stand on the panel\'s dark fill, and the panel shows it can be closed', async run({ base }) {
  const phone = await webkit.launch().catch(() => null);
  must(phone, 'no WebKit to drive: npx playwright install webkit');
  try {
    const p = await (await phone.newContext({ ...devices['iPhone 13'] })).newPage();
    await p.goto(base + '/year-archive/', { waitUntil: 'load', timeout: 45000 });
    await p.locator('.search__toggle').click();
    await p.locator('#search').fill('light');
    await p.waitForSelector('#results a[href]', { timeout: 20000 }).catch(() => {});
    const s = await p.evaluate(() => {
      const wrap = document.querySelector('.search-content__inner-wrap');
      const alpha = +((getComputedStyle(wrap).backgroundColor.match(/rgba?\(([^)]+)\)/) || [])[1] || '').split(',')[3] ?? 1;
      const toggle = document.querySelector('.search__toggle');
      const cross = toggle.querySelector('.search__toggle-close');
      return { results: document.querySelectorAll('#results a[href]').length, alpha: Number.isNaN(alpha) ? 1 : alpha,
        open: toggle.getAttribute('aria-expanded') === 'true', cross: !!cross && getComputedStyle(cross).display !== 'none' };
    });
    must(s.results >= 1, 'searching "light" on a phone found nothing');
    must(s.alpha >= 0.9, `the phone's panel is filled at ${s.alpha}: the page shows through the results`);
    must(s.open && s.cross, 'the open panel does not show that it is open and can be closed');
  } finally { await phone.close(); }
} };
