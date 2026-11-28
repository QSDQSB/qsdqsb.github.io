import { must } from './_lib.mjs';

export default { id: 'post-figures', name: "A post's colour figures are drawn from the site's data, and its Reverie card opens that colour", async run({ page, go }) {
  await go('/posts/in-the-naming-of-light/');
  // Each figure is drawn as it nears the screen: walk the page down to them. The post is in two
  // languages, each with its own figures; the hidden one's are drawn when it is chosen.
  const figures = page.locator('.colour-figure:visible');
  const count = await figures.count();
  must(count >= 1, 'the post has no colour figures');
  for (let i = 0; i < count; i++) { await figures.nth(i).scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
  await page.waitForFunction(() => ![...document.querySelectorAll('.colour-figure:not(.is-drawn)')].some((f) => f.checkVisibility()), null, { timeout: 15000 }).catch(() => {});
  must(await page.locator('.colour-figure:not(.is-drawn):visible').count() === 0, 'a colour figure was left as its link: its data did not arrive, or its voyage or colour is gone');
  must(await page.locator('.colour-figure--palette:visible .palette-blocks a').count() >= 3, "the voyage's palette shows no colours");
  // The frames are folded to a strip: opened, the cards and their prints are there to see.
  await page.locator('.colour-frames:visible summary').click();
  await page.waitForTimeout(400);
  must(await page.locator('.colour-figure--frames:visible .palette-card__print').first().isVisible(), 'the frames did not open to their cards');
  // One frame, with its specs as the lightbox sets them: the print leads to its book.
  const frame = page.locator('.colour-figure--frame:visible');
  if (await frame.count()) {
    must(await frame.locator('.photobook-specs__highlights b').count() >= 4, "the frame's specs are not set under its print");
    must(/\/voyage\/.+#\w+/.test(await frame.locator('.palette-card__print').getAttribute('href') || ''), "the frame's print does not lead to its book");
  }
  // A link in the text wears its brass on a hairline (Q9), inside a language's panel too.
  const dress = await page.locator('.page__content [data-bilingual-lang]:not([hidden]) > p a').first().evaluate((a) => [getComputedStyle(a).color, getComputedStyle(a).textDecorationLine]);
  must(dress[0] === 'rgb(195, 180, 152)' && dress[1] === 'underline', `a link in the post's text is ${dress.join(', ')}, not brass on a hairline`);
  // The other language's figures are drawn once it is chosen.
  await page.locator('.bilingual-switch__button[data-bilingual-option="EN"]').click();
  const other = page.locator('.colour-figure:visible');
  for (let i = 0; i < await other.count(); i++) { await other.nth(i).scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
  await page.waitForFunction(() => ![...document.querySelectorAll('.colour-figure:not(.is-drawn)')].some((f) => f.checkVisibility()), null, { timeout: 15000 }).catch(() => {});
  must(await page.locator('.colour-figure:not(.is-drawn):visible').count() === 0, "a figure of the post's other language was not drawn when it was chosen");
  await page.locator('.bilingual-switch__button[data-bilingual-option="中"]').click();
  // In the Reverie card a voyage's name leads to its palette, not to the card's own Reverie.
  await page.locator('.reverie-card:visible .palette-card__place a').first().click();
  await page.waitForURL(/\/palette\//, { timeout: 8000 }).catch(() => {});
  must(new URL(page.url()).pathname.endsWith('/palette/'), "the voyage's name in the Reverie card did not lead to its palette");
  await go('/posts/in-the-naming-of-light/');
  await page.locator('.colour-figure--reverie:visible').scrollIntoViewIfNeeded();
  await page.waitForSelector('.colour-figure--reverie.is-drawn:visible', { timeout: 15000 }).catch(() => {});
  const card = page.locator('.reverie-card:visible');
  const hex = (await card.locator('.reverie__code').innerText()).replace('#', '').toLowerCase();
  must(/^[0-9a-f]{6}$/.test(hex), 'the Reverie card names no colour');
  must(await card.locator('.palette-card__print').count() >= 1, 'the Reverie card shows no photograph');
  // On the dye: each photograph's card lies above the card's own link, wherever the centre falls.
  await card.locator('.reverie-card__open').click({ position: { x: 40, y: 40 } });
  await page.waitForURL(/\/reverie\/\?/, { timeout: 8000 }).catch(() => {});
  must(new URL(page.url()).searchParams.get('c') === hex, "the card did not open its colour's Reverie");
  await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
  must((await page.locator('.reverie__code').innerText()).toLowerCase().includes(hex), 'Reverie opened on another colour than the card showed');
} };
