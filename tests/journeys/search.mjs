import { must } from './_lib.mjs';

export default { id: 'search', name: 'Search opens, finds a voyage, and Escape closes it', async run({ page, go }) {
  await go('/year-archive/');
  // Search's scripts and its store are fetched when it is first opened, not with every page.
  must(await page.evaluate(() => typeof window.lunr === 'undefined' && typeof window.store === 'undefined'), 'search came with the page: lunr or its store is loaded before the panel is opened');
  await page.locator('.search__toggle').click();
  await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
  must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open');
  await page.locator('#search').fill('prague');
  await page.waitForSelector('#results a[href]', { timeout: 20000 }).catch(() => {});
  must(await page.locator('#results a[href]').count() >= 1, 'searching "prague" found nothing');
  must(/\d/.test(await page.locator('#results-live').innerText().catch(() => '')), 'the number found is not said to a screen reader');
  // A result's words are shown as words: no entity left standing (the Voyage index once showed "&lt;!").
  await page.locator('#search').fill('porto');
  await page.waitForFunction(() => /porto/i.test(document.getElementById('results')?.innerText || ''), null, { timeout: 20000 }).catch(() => {});
  const shown = await page.locator('#results').innerText();
  must(/porto/i.test(shown), 'searching "porto" found nothing');
  must(!/&(lt|gt|amp|quot|#\d+);/.test(shown), `a result shows an entity as text: ${(shown.match(/.{0,30}&(?:lt|gt|amp|quot|#\d+);.{0,10}/) || [''])[0]}`);
  // Every word is marked in one pass: a later word never lands inside an earlier mark (R014: "naming
  // of light" once showed `In the light">Naming of Light`).
  await page.locator('#search').fill('naming of light');
  const titles = () => page.evaluate(() => [...document.querySelectorAll('#results .archive__item-title')].map((t) => t.textContent.trim()));
  await page.waitForFunction(() => /naming/i.test(document.getElementById('results')?.innerText || ''), null, { timeout: 20000 }).catch(() => {});
  const named = await titles();
  must(named.includes('In the Naming of Light'), `searching "naming of light" did not show its post's title whole: ${JSON.stringify(named.slice(0, 3))}`);
  must(!named.some((t) => /">|class=|<mark/.test(t)), `a result's title shows markup as text: ${named.find((t) => /">|class=|<mark/.test(t))}`);
  // A result says the passage it was found by, with the word marked in it.
  await page.locator('#search').fill('venice');
  const passage = () => page.evaluate(() => [...document.querySelectorAll('#results .search-result__snapshot mark')].some((m) => /venice/i.test(m.textContent)));
  await page.waitForFunction(() => [...document.querySelectorAll('#results .search-result__snapshot mark')].some((m) => /venice/i.test(m.textContent)), null, { timeout: 20000 }).catch(() => {});
  must(await passage(), 'searching "venice" showed no passage with the word marked in it');
  // A tag picked from the suggestions finds the pages that carry it, its emoji ("🐮Ox") and all.
  await page.locator('#search').fill('ox');
  await page.waitForSelector('.search-suggestion.is-tag', { timeout: 5000 }).catch(() => {});
  const tag = page.locator('.search-suggestion.is-tag').first();
  must(await tag.count() === 1, 'typing "ox" offered no tag to pick');
  const picked = await tag.getAttribute('data-search-suggestion');
  // The results for "ox" are already there: mark them, so the wait is for the tag's own answer.
  const answered = () => page.waitForFunction(() => !document.getElementById('stale-results'), null, { timeout: 20000 }).catch(() => {});
  const markStale = () => page.evaluate(() => document.getElementById('results').insertAdjacentHTML('beforeend', '<i id="stale-results"></i>'));
  await markStale();
  await tag.click();
  await answered();
  must(await page.locator('#stale-results').count() === 0, 'the search never answered the picked tag');
  must(await page.locator('#results a[href]').count() >= 1, `picking the tag ${picked} found nothing`);
  // A query that is only an emoji has nothing to look for, and finds nothing, not every page.
  await markStale();
  await page.locator('#search').fill('🐮');
  await answered();
  must(await page.locator('#stale-results').count() === 0, 'the search never answered an emoji alone');
  must(await page.locator('#results a[href]').count() === 0, `searching for an emoji alone listed ${await page.locator('#results a[href]').count()} results`);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.search-content.is--visible', { state: 'detached', timeout: 3000 }).catch(() => {});
  must(await page.locator('.search-content.is--visible').count() === 0, 'Escape did not close the search panel');
} };
