import { must } from './_lib.mjs';

export default { id: 'subscribe', name: 'Subscribing says so, and keeps the reader\'s focus when the form folds away', async run({ page, go }) {
  // The list's own address is answered here: a journey never writes to the real list.
  await page.route('**/api/subscribe', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await go('/posts/shihuqiao/');
  const slip = page.locator('[data-subscribe-slip]').first();
  await slip.scrollIntoViewIfNeeded();
  await slip.locator('.subscribe-slip__input').fill('reader@example.com');
  await page.keyboard.press('Enter');
  const note = slip.locator('.subscribe-slip__note--ok');
  await page.waitForFunction(() => { const n = document.querySelector('.subscribe-slip__note--ok'); return n && !n.hidden && n.textContent.trim().length > 0; }, null, { timeout: 5000 }).catch(() => {});
  must(await note.evaluate((n) => !n.hidden && n.getAttribute('role') === 'status' && n.textContent.trim().length > 0), 'subscribing was not acknowledged in a live region');
  must(await note.evaluate((n) => document.activeElement === n), 'focus was lost when the form gave way to the note');
  await page.waitForFunction(() => document.querySelector('[data-subscribe-slip]').classList.contains('is-folded'), null, { timeout: 12000 }).catch(() => {});
  must(await slip.evaluate((s) => s.classList.contains('is-folded')), 'the slip did not fold after subscribing');
  must(await page.evaluate(() => !!document.activeElement?.closest('[data-subscribe-slip]')), 'focus was lost when the slip folded');
} };
