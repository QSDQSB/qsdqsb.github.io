import { must } from './_lib.mjs';

export default { id: 'post-related', name: 'Under a post, You Might Also Enjoy offers four covers at the content\'s full width, after the post\'s ending', async run({ page, go }) {
  await go('/posts/in-the-naming-of-light/');
  const covers = page.locator('.page__related a.card');
  must(await covers.count() === 4, `You Might Also Enjoy offers ${await covers.count()} covers, not four`);
  const place = await page.evaluate(() => {
    const r = document.querySelector('.page__related');
    // The ending's pieces stand on the text's width; the covers on the content's.
    const piece = document.querySelector('.page__ending > .page__meta, .page__ending > *');
    return { inEnding: !!r.closest('.page__ending'), wider: r.getBoundingClientRect().width > piece.getBoundingClientRect().width };
  });
  must(!place.inEnding && place.wider, 'You Might Also Enjoy is squeezed into the text\'s width');
} };
