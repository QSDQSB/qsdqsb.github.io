import fs from 'node:fs';
import { must } from './_lib.mjs';

export default { id: 'tags', name: 'A tag page lists its tags in one line over every entry, a tag opens its list with the tags still in sight and each taking its own click, the address names the tag, Back retraces, and a tag in the address opens its list', async run({ page, go }) {
  for (const at of ['/voyage-by-tags/', '/tags/']) {
    await go(at);
    const rows = page.locator('.tag-page__tags a');
    must(await rows.count() >= 6, `${at}: only ${await rows.count()} tags`);
    const open = () => page.locator('.tag-page__room:visible').evaluateAll((els) => els.map((el) => el.id).join(','));
    must(await open() === 'all', `${at}: with no tag chosen, "${await open()}" is open instead of every entry`);
    must(await rows.first().getAttribute('aria-current') === 'true', `${at}: "All" is not marked open`);
    // Over the list, in sight, and every tag the line shows takes its own click: the corner's
    // tarot card, unseen above everything, gives way while the tags are under it. A tag run on past the line's edge is not on the screen.
    const tagsInSight = async (why) => {
      const r = await page.locator('.tag-page__tags').evaluate((el) => {
        const box = el.getBoundingClientRect(), line = el.querySelector('ol').getBoundingClientRect(), h = innerHeight;
        const lost = [...el.querySelectorAll('a')].filter((a) => {
          const b = a.getBoundingClientRect(), y = b.top + b.height / 2;
          return y > 0 && y < h && b.left + 12 > line.left && b.left + 12 < line.right && document.elementFromPoint(b.left + 12, y)?.closest('a') !== a;
        }).map((a) => a.textContent.trim());
        return { top: box.top, lost };
      });
      must(r.top >= 0 && r.top < page.viewportSize().height, `${at}: ${why}, the tags are out of sight (top ${Math.round(r.top)})`);
      must(r.lost.length === 0, `${at}: ${why}, a click on ${r.lost.join(', ')} goes elsewhere`);
    };
    const [first, second] = [(await rows.nth(1).getAttribute('href')).slice(1), (await rows.nth(2).getAttribute('href')).slice(1)];
    const list = (slug) => page.locator(`.tag-page__room[id="${slug}"]`);
    // The row is marked as the address changes, a moment after the list shows.
    const marked = (slug) => page.locator(`.tag-page__tags a[href="#${slug}"][aria-current]`).waitFor({ timeout: 3000 }).then(() => true, () => false);
    await rows.nth(1).click();
    await list(first).waitFor({ state: 'visible' });
    must(new URL(page.url()).hash === `#${first}`, `${at}: the address does not name #${first}`);
    must(await open() === first, `${at}: choosing #${first} left "${await open()}" open`);
    must(await list(first).locator(':scope > a.card').count() >= 1, `${at}: the list #${first} is empty`);
    must(await marked(first), `${at}: #${first} is not marked open`);
    await page.waitForTimeout(500);
    await tagsInSight('with a list open');
    await rows.nth(2).click();
    await list(second).waitFor({ state: 'visible' });
    must(await open() === second, `${at}: #${first} stayed open beside #${second}`);
    await page.goBack();
    await list(first).waitFor({ state: 'visible' });
    must(await open() === first && await marked(first), `${at}: Back did not return to #${first}`);
    await page.goBack();
    await page.locator('.tag-page__room--all').waitFor({ state: 'visible' });
    must(await open() === 'all' && await marked('all'), `${at}: Back did not return to every entry`);
    // As a tag under a post or a voyage arrives, from another page: its list open, its tag marked, and a cover there opens.
    await page.goto('about:blank');
    await go(`${at}#${second}`);
    await list(second).waitFor({ state: 'visible' });
    must(await marked(second), `${at}: arriving at #${second}, its tag is not marked open`);
    await page.waitForTimeout(500);
    await tagsInSight('arriving at a tag');
    const cover = list(second).locator(':scope > a.card').first();
    const href = await cover.getAttribute('href');
    await Promise.all([page.waitForURL(`**${href}`), cover.click()]);
    must(await page.locator('h1').count() >= 1, `${href} opened without a title`);
  }
  // Arriving at the last tag: the tags still one line, never two, and the open one brought into it.
  // An open post tag carries the owner's line (_data/tag_lines.yml, keyed exactly as front matter
  // writes the tag: a retyped tag would lose its line silently); a voyage tag carries none.
  const yml = fs.readFileSync(new URL('../../_data/tag_lines.yml', import.meta.url), 'utf8');
  const postLines = ((yml.split(/^posts:\s*$/m)[1] ?? '').split(/^\S/m)[0].match(/^ {2}"/gm) || []).length;
  for (const at of ['/voyage-by-tags/', '/tags/']) {
    await go(at);
    const last = (await page.locator('.tag-page__tags a').last().getAttribute('href')).slice(1);
    const lineCount = await page.locator('.tag-page__room-line').count();
    const want = at === '/tags/' ? postLines : 0;
    must(lineCount === want, `${at}: ${lineCount} tags carry a line, ${want} should (_data/tag_lines.yml)`);
    await page.goto('about:blank');
    await go(`${at}#${last}`);
    await page.locator(`.tag-page__room[id="${last}"]`).waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const ol = document.querySelector('.tag-page__tags ol');
      const a = ol.querySelector('[aria-current]').getBoundingClientRect(), o = ol.getBoundingClientRect();
      return { rows: new Set([...ol.children].map((li) => li.offsetTop)).size, inside: a.left >= o.left - 1 && a.right <= o.right + 1 };
    });
    must(r.rows === 1, `${at}: the tags run onto ${r.rows} rows`);
    must(r.inside, `${at}: arriving at #${last}, its tag is not brought into the line`);
  }
  // At a width between a phone and a laptop (an iPad held sideways, a small laptop), the tags stand
  // above the list and scroll away with it, never over it.
  const size = page.viewportSize();
  await page.goto('about:blank'); // resized on a blank page: a page's own transition aborts on a resize
  await page.setViewportSize({ width: 1100, height: 900 });
  try {
    await go('/tags/');
    const slug = (await page.locator('.tag-page__tags a').nth(1).getAttribute('href')).slice(1);
    await page.goto('about:blank');
    await go(`/tags/#${slug}`);
    await page.locator(`.tag-page__room[id="${slug}"]`).waitFor({ state: 'visible' });
    for (const y of [0, 3000]) {
      await page.evaluate((by) => window.scrollBy(0, by), y);
      await page.waitForTimeout(300);
      const over = await page.evaluate((s) => {
        const t = document.querySelector('.tag-page__tags').getBoundingClientRect(), r = document.getElementById(s).getBoundingClientRect();
        return t.bottom > r.top + 1 && t.top < r.bottom && t.right > r.left && t.left < r.right;
      }, slug);
      must(!over, `/tags/ at 1100 px: the tags lie over the list of #${slug}`);
    }
  } finally { await page.goto('about:blank'); await page.setViewportSize(size); }
} };
