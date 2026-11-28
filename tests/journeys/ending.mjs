import { must } from './_lib.mjs';

export default { id: 'ending', name: 'A post, a voyage, Home and About end with the same mark, line and links, and from Home a reader reaches RSS and Terms', async run({ page, go, ok }) {
  const ending = () => page.evaluate(() => {
    const all = document.querySelectorAll('.site-colophon');
    const f = all[0];
    return { count: all.length, mark: !!f?.querySelector('.site-colophon__mark'), line: f?.querySelector('.site-colophon__line')?.textContent.trim() || '',
      links: f ? [...f.querySelectorAll('.site-colophon__links a')].map((a) => a.getAttribute('href')) : [] };
  });
  let first = null;
  for (const to of ['/posts/in-the-naming-of-light/', '/voyage/barcelona/', '/', '/about/']) {
    await go(to);
    const e = await ending();
    must(e.count === 1, `${to} ends ${e.count} times`);
    must(e.mark && e.line, `${to}'s ending has no mark or no sign-off`);
    first ??= e.links;
    must(JSON.stringify(e.links) === JSON.stringify(first), `${to}'s ending offers other links: ${e.links.join(' ')}`);
  }
  must(first.includes('/feed.xml') && first.includes('/terms/'), 'the ending does not lead to RSS and Terms');
  // On Home the ending closes the last panel (the rooms), which may scroll inside itself: it must come into view there.
  await go('/');
  const seen = await page.evaluate(async () => {
    const body = document.querySelector('.home__panel--index .home__panel-body');
    body.scrollIntoView({ behavior: 'instant' });
    body.scrollTop = body.scrollHeight;
    await new Promise((r) => setTimeout(r, 300));
    return ['/feed.xml', '/terms/'].every((href) => {
      const a = document.querySelector(`.site-colophon a[href="${href}"]`); const r = a.getBoundingClientRect();
      return r.height > 0 && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a') === a;
    });
  });
  must(seen, 'on Home the ending\'s RSS and Terms cannot be reached');
  for (const href of ['/feed.xml', '/terms/']) must(await ok(href), `${href} does not answer`);
} };
