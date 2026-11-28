import { must } from './_lib.mjs';

export default { id: 'book', name: 'A print opens in the lightbox, steps, and Back returns to the book', async run({ page, go }) {
  await go('/voyage/london/');
  const prints = page.locator('.photobook-frame__print');
  must(await prints.count() >= 2, 'the book has fewer than two prints');
  const open = () => page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true);
  await prints.nth(1).scrollIntoViewIfNeeded();
  await prints.nth(1).click();
  await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open && location.hash.length > 1, null, { timeout: 8000 }).catch(() => {});
  must(await open(), 'clicking a print did not open the lightbox');
  // Each frame's placeholder is in the page once, on its print: the room still takes its colour from it.
  must(await page.evaluate(() => !/"ph":/.test(document.getElementById('photobook-data').textContent)), "the lightbox's data carries every placeholder a second time");
  must(await page.evaluate(() => (document.querySelector('.photobook-lightbox__wash div')?.style.backgroundImage || '').startsWith('url(')), "the lightbox's room did not take the print's placeholder");
  const first = new URL(page.url()).hash;
  must(first.length > 1, 'the open frame has no address');
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((h) => location.hash !== h, first, { timeout: 8000 }).catch(() => {});
  must(new URL(page.url()).hash !== first, 'the right arrow did not step to the next frame');
  const second = new URL(page.url()).hash;
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(400);
  must(new URL(page.url()).hash === second, 'a key held with a modifier stepped the lightbox; it is the browser\'s');
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
  must(!(await open()), 'Back did not close the lightbox');
  must(new URL(page.url()).pathname.endsWith('/voyage/london/'), 'Back left the book');
  must(await page.evaluate(() => document.activeElement?.classList.contains('photobook-frame__print')), 'focus did not return to a print');
} };
