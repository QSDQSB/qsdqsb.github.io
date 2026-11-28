import { must } from './_lib.mjs';

export default { id: 'palette-card', name: "A frame's card is a print with its colour strip: a colour opens its Reverie, and a keyboard reaches it", async run({ page, go }) {
  await go('/palette/#barcelona');
  await page.waitForSelector('.palette-card__strip a', { timeout: 15000 }).catch(() => {});
  const card = page.locator('.palette-card').first();
  must(await card.locator('.palette-card__strip a').count() >= 2, "a frame's card has no colour strip");
  must(await card.locator('.palette-blocks, .palette-card__bar').count() === 0, "a frame's card still carries its codes and shares");
  must(await card.locator('.palette-card__vat').count() === 1, "a frame's card has lost its small vat");
  const colour = card.locator('.palette-card__strip a').first();
  must(/^#[0-9A-F]{6}$/.test(await colour.getAttribute('data-tip') || ''), "a colour on a card does not show its code under the pointer");
  await colour.focus();
  must(await colour.evaluate((a) => a === document.activeElement), 'a keyboard cannot reach a colour on a card');
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/reverie\/\?/, { timeout: 8000 }).catch(() => {});
  must(new URL(page.url()).pathname.endsWith('/reverie/'), "a colour on a card did not open its Reverie");
} };
