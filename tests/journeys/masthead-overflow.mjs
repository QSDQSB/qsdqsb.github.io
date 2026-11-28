import { must } from './_lib.mjs';

export default { id: 'masthead-overflow', name: 'On a narrow screen the rooms that do not fit open beneath the bar, the room you are in is marked there, and one leads on', async run({ page, go }) {
  await page.setViewportSize({ width: 400, height: 800 });
  await go('/about/');
  const toggle = page.locator('.greedy-nav__toggle');
  must(await toggle.isVisible(), 'a narrow screen shows no overflow button on About');
  await toggle.click();
  const panel = page.locator('.greedy-nav--menu-open .hidden-links');
  await panel.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  must(await panel.isVisible(), 'the overflow button did not open the rest of the rooms');
  must(await panel.locator('a[aria-current="page"]').count() === 1, 'About is not marked as the room you are in');
  const other = panel.locator('a:not([aria-current])').first();
  const href = await other.getAttribute('href');
  await Promise.all([page.waitForURL(`**${href}`), other.click()]);
} };
