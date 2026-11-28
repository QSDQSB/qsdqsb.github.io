import { must } from './_lib.mjs';

export default { id: 'anchor', name: 'A link to a section moves the address and the focus there', async run({ page, go }) {
  // The 404's closing line leads back up to its song (About's own such link went with its rainbow logo).
  await go('/404.html');
  const id = await page.locator('.page__content a[href^="#"]').evaluateAll((as) => as.map((a) => decodeURIComponent(a.getAttribute('href').slice(1))).find((x) => x && document.getElementById(x)) || null);
  must(id, 'the 404 has no link to one of its own sections');
  await page.locator(`.page__content a[href="#${id}"]`).first().click();
  await page.waitForFunction((x) => location.hash === `#${x}`, id, { timeout: 4000 }).catch(() => {});
  must(decodeURIComponent(new URL(page.url()).hash) === `#${id}`, 'the address did not take the section');
  must(await page.evaluate((x) => document.activeElement?.id === x, id), 'focus did not go to the section');
} };
