import { must } from './_lib.mjs';

export default { id: 'home-part', name: 'Recent updates names the part of a voyage that changed, not the voyage that holds it', async run({ page, go }) {
  await go('/');
  const cards = await page.$$eval('.wn-card', (as) => as.map((a) => a.getAttribute('href')));
  const parentOf = (href) => /^\/voyage\/[^/]+\/[^/]+\/$/.test(href) && href.split('/').slice(0, 3).join('/') + '/';
  for (const part of cards.filter(parentOf)) must(!cards.includes(parentOf(part)), `Home's board links ${part} and also ${parentOf(part)}, the voyage that holds it`);
  // The sitemap's lastmod is the board's own key (updated, else date) as this build has it, to the day.
  const xml = await (await page.request.get(new URL('/sitemap.xml', page.url()).href)).text();
  const days = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(([, loc, day]) => [new URL(loc, 'http://x').pathname, day])
    .filter(([href]) => /^\/(posts|voyage|portfolio)\/[^/]+\//.test(href));   // pieces, not the indexes (dated by the build's clock)
  const latest = days.reduce((m, [, day]) => (day > m ? day : m), '');
  const newest = days.filter(([, day]) => day === latest).map(([href]) => href);
  if (newest.length !== 1 || !parentOf(newest[0])) return;   // the newest change is not one part's alone: nothing more to see
  must(cards.includes(newest[0]), `the newest change is ${newest[0]}, and no card on Home links it`);
} };
