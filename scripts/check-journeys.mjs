#!/usr/bin/env node
/**
 * Does the site still work? Walks the routes a reader takes, in a real browser, and fails when a
 * step does not answer: a page that throws, a link that leads nowhere, a print that does not open,
 * a search that finds nothing, a Back that leaves the page.
 *
 * The pixel diff (npm run visual:diff) proves a page looks the same; nothing proved it still does
 * what it did. This is that check, and the functional half of the gate (scripts/gate.sh, the
 * site-reviewer agent).
 *
 * Serves `_site/` itself on a free port (build it first), or walks a site already served:
 *   node scripts/check-journeys.mjs                        # the built site
 *   node scripts/check-journeys.mjs --base http://localhost:4000
 *   node scripts/check-journeys.mjs --base https://qsdqsb.com
 *   node scripts/check-journeys.mjs --only book,search     # by journey id
 *
 * A headless browser trips the site's motion kill switch (_includes/head/custom.html), so reveals
 * and transitions land at once and the walk is repeatable. The masthead and the opening scene stand
 * still under that switch, so their journeys ask for motion (`?motion=on`) and a phone (`phone: true`). Photographs come from img.qsdqsb.com and
 * map tiles from the network; a failed image or tile is not a failure here, a script error is.
 *
 * A journey is added when a new route becomes one a reader depends on, and removed with the feature.
 * Keep each to what a reader would notice, not how the page is built.
 *
 * Exit codes: 0 every journey passed · 1 a journey failed · 2 usage or environment problem
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.geojson': 'application/geo+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const argv = process.argv.slice(2);
const take = (flag) => { const at = argv.indexOf(flag); return at >= 0 ? argv.splice(at, 2)[1] : null; };
const baseArg = take('--base'), only = take('--only')?.split(','), siteDir = path.resolve(ROOT, take('--site') || '_site');
if (argv.length) { console.error(`Unknown argument: ${argv[0]}`); process.exit(2); }

function serve(dir) {
  const server = http.createServer((req, res) => {
    let file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      const notFound = path.join(dir, '404.html');
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

class Failed extends Error {}
const must = (ok, what) => { if (!ok) throw new Failed(what); };

/** A reader's routes. Each gets a fresh page; `go(path)` loads one and returns its status. */
const JOURNEYS = [
  { id: 'home', name: 'Home opens and its doors lead somewhere', async run({ page, go, ok }) {
    await go('/');
    must(await page.locator('.home__panel').count() >= 3, 'Home has fewer than three panels');
    const doors = await page.locator('.masthead a[href^="/"], .home__doors a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
    must(doors.length >= 4, `only ${doors.length} ways on from Home`);
    for (const href of doors) must(await ok(href), `${href} does not answer`);
    // The hero pays for one door plate; the others are painted when their panel shows.
    const waiting = () => page.locator('.door-shot[data-plate]').count();
    must(await waiting() >= 3, 'every door plate was painted with the page, below a hero that shows none of them');
    await page.evaluate(() => document.getElementById('home-enter').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => !document.querySelector('.door-shot[data-plate]'), null, { timeout: 4000 }).catch(() => {});
    must(await waiting() === 0, 'the door plates were not painted when their panel came into view');
    // Three panels, each a screen: nothing below the last for the scroll to snap back from.
    const tail = await page.evaluate(() => document.documentElement.scrollHeight - document.querySelectorAll('.home__panel').length * innerHeight);
    must(Math.abs(tail) <= 2, `Home runs ${tail} px past its last panel`);
  } },

  { id: 'masthead-touch', phone: true, name: 'On a phone the bar stays away while reading and answers a tap at the top', async run({ page, go }) {
    const has = (cls) => page.evaluate((c) => document.querySelector('.masthead').classList.contains(c), cls);
    await go('/posts/shihuqiao/?motion=on', { early: true });
    await page.waitForSelector('.masthead.is-hidden', { state: 'attached', timeout: 3000 }).catch(() => {});
    must(await has('is-hidden'), 'the opening did not hold the bar away');
    await page.touchscreen.tap(300, 70);
    await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
    must(await has('is-nav-expanded'), 'a tap at the top did not end the opening and bring the bar');

    await page.goto('about:blank');
    await go('/posts/shihuqiao/?motion=on');
    await page.waitForTimeout(4500);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await page.waitForSelector('.masthead.is-nav-collapsed.is-nav-faded', { state: 'attached', timeout: 6000 }).catch(() => {});
    must(await has('is-nav-faded'), 'the bar did not step away while the page was read');
    const spot = await page.evaluate(() => [[20, 600], [370, 600], [20, 480], [195, 700]].find(([x, y]) => !document.elementFromPoint(x, y)?.closest('a, button, input, summary')) || null);
    must(spot, 'found nowhere to tap that is not a control');
    await page.touchscreen.tap(spot[0], spot[1]);
    await page.waitForTimeout(700);
    must(await has('is-nav-faded'), 'a finger on the page called the bar: it should answer only a reader looking for it');
    await page.touchscreen.tap(300, 70);
    await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
    must(await has('is-nav-expanded'), 'a tap at the top of the screen did not bring the bar back');
  } },

  { id: 'masthead-keys', name: 'Tab reaching the bar ends the opening', async run({ page, go }) {
    await go('/posts/shihuqiao/?motion=on', { early: true });
    await page.waitForSelector('.masthead.is-hidden', { state: 'attached', timeout: 3000 }).catch(() => {});
    must(await page.evaluate(() => document.querySelector('.masthead').classList.contains('is-hidden')), 'the opening did not hold the bar away');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
    await page.waitForSelector('.masthead.is-nav-expanded', { state: 'attached', timeout: 2000 }).catch(() => {});
    must(await page.evaluate(() => !!document.activeElement?.closest('.masthead')), 'three Tabs did not reach the bar');
    must(await page.evaluate(() => document.querySelector('.masthead').classList.contains('is-nav-expanded')), 'focus is in the bar and the bar is still hidden');
  } },

  { id: 'voyages', name: 'The Voyage index lists voyages and a card opens one', async run({ page, go }) {
    await go('/voyage/');
    const cards = page.locator('a.card');
    must(await cards.count() >= 10, `only ${await cards.count()} voyage cards`);
    const href = await cards.first().getAttribute('href');
    await Promise.all([page.waitForURL(`**${href}`), cards.first().click()]);
    must(await page.locator('h1').count() >= 1, `${href} opened without a title`);
  } },

  { id: 'book', name: 'A print opens in the lightbox, steps, and Back returns to the book', async run({ page, go }) {
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
  } },

  { id: 'specs-folded', name: 'Folded away, the specs take no Tab', async run({ page, go }) {
    await go('/voyage/london/');
    await page.locator('.photobook-frame__print').first().click();
    await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
    must(await page.evaluate(() => document.querySelector('.photobook-lightbox').classList.contains('has-specs')), 'the lightbox opened without its specs: nothing to fold');
    must(await page.locator('.photobook-specs a[href], .photobook-specs button').count() >= 1, 'the specs hold nothing a Tab could reach: the journey cannot tell');
    await page.keyboard.press('i');
    await page.waitForFunction(() => !document.querySelector('.photobook-lightbox').classList.contains('has-specs'), null, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(700);
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      must(!(await page.evaluate(() => !!document.activeElement?.closest('.photobook-specs'))), 'Tab reached inside the folded specs, where nothing can be seen');
    }
  } },

  { id: 'lightbox-slow', name: 'On a slow line each frame stands on its own placeholder, and only a frame that holds fetches its full print', async run({ page, go }) {
    // The photo host, slowed once `slow` is set: one light print (the first asked for after `gate` is
    // armed) is held until released, the rest arrive 2.5 s late; `asked` keeps what was asked for.
    let slow = false, gated = null, release = () => {}, asked = [];
    await page.route('https://img.qsdqsb.com/**', async (route) => {
      const url = route.request().url();
      asked.push(url);
      if (!slow) return route.continue().catch(() => {});
      if (gated === 'armed' && /\/960\.webp$/.test(url)) {
        gated = url;
        const held = new Promise((r) => { release = r; });
        const response = await route.fetch().catch(() => null);
        await held;
        return response ? route.fulfill({ response }).catch(() => {}) : route.abort().catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 2500));
      return route.continue().catch(() => {});
    });
    await go('/voyage/london/');
    await page.locator('.photobook-frame__print').first().click();
    await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
    must(await page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true), 'clicking a print did not open the lightbox');
    await page.waitForTimeout(1500);
    // Six quick steps: the frames passed fetch their light print and no more.
    asked = [];
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(70); }
    await page.waitForTimeout(1500);
    const full = asked.filter((u) => /\.webp$/.test(u) && !/\/960\.webp$/.test(u));
    must(full.length <= 4, `six quick steps asked for ${full.length} full prints: the frames passed are being downloaded`);
    // What stands in the print's place, and whose placeholder it is (each frame's is on its print in the book).
    const state = () => page.evaluate(() => {
      const lb = document.querySelector('.photobook-lightbox'), at = Number((lb.querySelector('.photobook-lightbox__live').textContent.match(/, (\d+) of/) || [])[1]) - 1;
      const own = document.querySelector(`#photobook-book .photobook-frame[data-i="${at}"] .photobook-frame__print`)?.style.backgroundImage || '';
      const held = [...lb.querySelectorAll('.photobook-lightbox__held.is-on')].map((h) => h.style.backgroundImage);
      return { at, prints: lb.querySelectorAll('.photobook-lightbox__mat > img.is-on').length, held: held.length, own: held.length === 1 && !!own && held[0] === own };
    });
    slow = true;
    await page.keyboard.press('ArrowRight');             // the frame beside: fetched ahead already, so not slow
    await page.waitForTimeout(70);
    gated = 'armed';
    await page.keyboard.press('ArrowRight');             // frame A, not yet fetched: its light print is held back
    await page.waitForTimeout(600);
    const a = await state();
    must(a.prints === 0, "on a slow line the last frame's print stayed under the new frame's words");
    must(a.own, "the frame's own placeholder did not stand in its print's place while it loaded");
    await page.keyboard.press('ArrowRight');             // frame B, and A's print lands just after
    await page.waitForTimeout(60); release();
    await page.waitForTimeout(540);
    const b = await state();
    must(b.at === a.at + 1, 'the second step did not move on a frame');
    must(b.prints === 0 && b.own, "a passed frame's print, landing late, left its placeholder under the next frame's words");
    // Picture only has no mount to stand a placeholder on: the last print stays until the next is in hand.
    await page.waitForFunction(() => document.querySelectorAll('.photobook-lightbox__mat > img.is-on').length === 1, null, { timeout: 8000 }).catch(() => {});
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    const before = (await state()).at;
    await page.keyboard.press('ArrowRight');
    for (const ms of [300, 300, 300]) {
      await page.waitForTimeout(ms);
      const c = await page.evaluate(() => ({ on: document.querySelectorAll('.photobook-lightbox__mat > img.is-on').length, waiting: document.querySelectorAll('.photobook-lightbox__mat > img:not(.is-on)').length }));
      must((await state()).at === before + 1 && c.waiting >= 1, 'the step in picture only was not a slow one: the journey cannot tell');
      must(c.on >= 1, 'in picture only a step on a slow line emptied the screen');
    }
  } },

  { id: 'lightbox-morph', name: 'A print grows into the lightbox as it opens', async run({ page, go }) {
    await go('/voyage/london/?motion=on');
    if (!(await page.evaluate(() => 'startViewTransition' in document))) return;   // a browser with no view transitions simply opens
    const print = page.locator('.photobook-frame__print').nth(1);
    await print.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const im = document.querySelectorAll('.photobook-frame__print img')[1]; return im && im.complete && im.naturalWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => {
      window.__morph = false;
      const until = performance.now() + 3000;
      const look = () => { if (document.getAnimations().some((x) => (x.effect?.pseudoElement || '').includes('photobook-print'))) window.__morph = true; else if (performance.now() < until) requestAnimationFrame(look); };
      requestAnimationFrame(look);
    });
    await print.click();
    await page.waitForFunction(() => window.__morph, null, { timeout: 4000 }).catch(() => {});
    must(await page.evaluate(() => window.__morph), 'the lightbox opened with a plain crossfade: the print on the mat was not named for the transition');
    await page.waitForTimeout(900);
    must(await page.evaluate(() => { const im = document.querySelector('.photobook-lightbox__mat > img.is-on'); return !!im && !im.style.viewTransitionName && !im.style.transition; }), 'the opened print kept its transition name or its stilled fade');
  } },

  { id: 'deeplink', name: 'A frame\'s address opens that frame', async run({ page, go }) {
    await go('/voyage/london/');
    await page.locator('.photobook-frame__print').first().click();
    await page.waitForFunction(() => location.hash.length > 1, null, { timeout: 8000 }).catch(() => {});
    const hash = new URL(page.url()).hash;
    must(hash.length > 1, 'an open frame has no address to share');
    await page.goto('about:blank');   // the same page with a new hash would not load afresh
    await go(`/voyage/london/${hash}`);
    await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
    must(await page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true), `${hash} did not open its frame`);
  } },

  { id: 'search', name: 'Search opens, finds a voyage, and Escape closes it', async run({ page, go }) {
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
    await page.keyboard.press('Escape');
    await page.waitForSelector('.search-content.is--visible', { state: 'detached', timeout: 3000 }).catch(() => {});
    must(await page.locator('.search-content.is--visible').count() === 0, 'Escape did not close the search panel');
  } },

  { id: 'search-corners', name: 'With search open, the corner cards take no click', async run({ page, go }) {
    await go('/voyage/');
    const corner = await page.evaluate(() => {
      const a = document.querySelector('a.floating_tarot_card_container[href]:not([data-random-jump])');
      if (!a) return null;
      const r = a.getBoundingClientRect(), x = Math.min(innerWidth - 2, Math.max(2, r.left + r.width / 2)), y = Math.min(innerHeight - 2, Math.max(2, r.top + r.height / 2));
      return { x, y, hit: !!document.elementFromPoint(x, y)?.closest('.floating_tarot_card_container') };
    });
    must(corner, 'the Voyage index has no corner card: the journey cannot tell');
    must(corner.hit, 'the corner card is not where a click would find it: the journey cannot tell');
    await page.locator('.search__toggle').click();
    await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
    must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open');
    await page.mouse.click(corner.x, corner.y);
    await page.waitForTimeout(800);
    must(new URL(page.url()).pathname === '/voyage/', 'a click through the open search panel landed on an unseen corner card');
  } },

  { id: 'phone-post', phone: true, name: 'On a phone a long title wraps inside the screen, and the subscribe field does not make an iPhone zoom', async run({ page, go }) {
    await go('/posts/war-declaration-to-boredom/');
    const title = await page.evaluate(() => { const t = document.querySelector('.page__hero--overlay .page__title'); if (!t) return null; const r = t.getBoundingClientRect(); return { right: r.right, clipped: t.scrollWidth - t.clientWidth, lines: Math.round(r.height / parseFloat(getComputedStyle(t).lineHeight)), over: document.documentElement.scrollWidth - innerWidth, vw: innerWidth }; });
    must(title, 'the post has no hero title');
    must(title.lines >= 2, 'the long title is on one line: the journey cannot tell whether it would wrap');
    must(title.right <= title.vw && title.clipped <= 1, 'the long title runs off the screen');
    must(title.over <= 0, `the page scrolls sideways by ${title.over} px`);
    const field = await page.evaluate(() => { const i = document.querySelector('.subscribe-slip__input'); return i ? parseFloat(getComputedStyle(i).fontSize) : null; });
    must(field !== null, 'the post has no subscribe slip');
    must(field >= 16, `the subscribe field is ${field} px by touch: under 16 px Safari on an iPhone zooms the page`);
  } },

  { id: 'subscribe', name: 'Subscribing says so, and keeps the reader\'s focus when the form folds away', async run({ page, go }) {
    // The list's own address is answered here: a journey never writes to the real list.
    await page.route('**/api/subscribe', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await go('/posts/shihuqiao/');
    const slip = page.locator('[data-subscribe-slip]').first();
    await slip.scrollIntoViewIfNeeded();
    await slip.locator('.subscribe-slip__input').fill('reader@example.com');
    await page.keyboard.press('Enter');
    const note = slip.locator('.subscribe-slip__note--ok');
    await page.waitForFunction(() => { const n = document.querySelector('.subscribe-slip__note--ok'); return n && !n.hidden && n.textContent.trim().length > 0; }, null, { timeout: 5000 }).catch(() => {});
    must(await note.evaluate((n) => !n.hidden && n.getAttribute('role') === 'status' && n.textContent.trim().length > 0), 'subscribing was not acknowledged in a live region');
    must(await note.evaluate((n) => document.activeElement === n), 'focus was lost when the form gave way to the note');
    await page.waitForFunction(() => document.querySelector('[data-subscribe-slip]').classList.contains('is-folded'), null, { timeout: 12000 }).catch(() => {});
    must(await slip.evaluate((s) => s.classList.contains('is-folded')), 'the slip did not fold after subscribing');
    must(await page.evaluate(() => !!document.activeElement?.closest('[data-subscribe-slip]')), 'focus was lost when the slip folded');
  } },

  { id: 'post', name: 'A post opens from the archive, and its contents list points at real headings', async run({ page, go }) {
    await go('/year-archive/');
    const href = await page.locator('a.card[href*="/posts/"]').first().getAttribute('href');
    must(href, 'the archive lists no posts');
    await go(href);
    must((await page.locator('.page__content').innerText()).trim().length > 200, `${href} has no body text`);
    const dead = await page.locator('.toc__menu a[href^="#"]').evaluateAll((as) => as.map((a) => decodeURIComponent(a.getAttribute('href').slice(1))).filter((id) => id && !document.getElementById(id)));
    must(dead.length === 0, `contents links with no heading: ${dead.slice(0, 3).join(', ')}`);
  } },

  { id: 'post-figures', name: "A post's colour figures are drawn from the site's data, and its Reverie card opens that colour", async run({ page, go }) {
    await go('/posts/in-the-naming-of-light/');
    // Each figure is drawn as it nears the screen: walk the page down to them.
    const figures = page.locator('.colour-figure');
    const count = await figures.count();
    must(count >= 1, 'the post has no colour figures');
    for (let i = 0; i < count; i++) { await figures.nth(i).scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
    await page.waitForFunction(() => !document.querySelector('.colour-figure:not(.is-drawn)'), null, { timeout: 15000 }).catch(() => {});
    must(await page.locator('.colour-figure:not(.is-drawn)').count() === 0, 'a colour figure was left as its link: its data did not arrive, or its voyage or colour is gone');
    must(await page.locator('.colour-figure--palette .palette-blocks a').count() >= 3, "the voyage's palette shows no colours");
    // The frames are folded to a strip: opened, the cards and their prints are there to see.
    await page.locator('.colour-frames summary').click();
    await page.waitForTimeout(400);
    must(await page.locator('.colour-figure--frames .palette-card__print').first().isVisible(), 'the frames did not open to their cards');
    // One frame, with its specs as the lightbox sets them: the print leads to its book.
    const frame = page.locator('.colour-figure--frame');
    if (await frame.count()) {
      must(await frame.locator('.photobook-specs__highlights b').count() >= 4, "the frame's specs are not set under its print");
      must(/\/voyage\/.+#\w+/.test(await frame.locator('.palette-card__print').getAttribute('href') || ''), "the frame's print does not lead to its book");
    }
    // In the Reverie card a voyage's name leads to its palette, not to the card's own Reverie.
    await page.locator('.reverie-card .palette-card__place a').first().click();
    await page.waitForURL(/\/palette\//, { timeout: 8000 }).catch(() => {});
    must(new URL(page.url()).pathname.endsWith('/palette/'), "the voyage's name in the Reverie card did not lead to its palette");
    await go('/posts/in-the-naming-of-light/');
    await page.locator('.colour-figure--reverie').scrollIntoViewIfNeeded();
    await page.waitForSelector('.colour-figure--reverie.is-drawn', { timeout: 15000 }).catch(() => {});
    const card = page.locator('.reverie-card');
    const hex = (await card.locator('.reverie__code').innerText()).replace('#', '').toLowerCase();
    must(/^[0-9a-f]{6}$/.test(hex), 'the Reverie card names no colour');
    must(await card.locator('.palette-card__print').count() >= 1, 'the Reverie card shows no photograph');
    // On the dye: each photograph's card lies above the card's own link, wherever the centre falls.
    await card.locator('.reverie-card__open').click({ position: { x: 40, y: 40 } });
    await page.waitForURL(/\/reverie\/\?/, { timeout: 8000 }).catch(() => {});
    must(new URL(page.url()).searchParams.get('c') === hex, "the card did not open its colour's Reverie");
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must((await page.locator('.reverie__code').innerText()).toLowerCase().includes(hex), 'Reverie opened on another colour than the card showed');
  } },

  { id: 'post-spread', name: 'On a wide window a post is one centred spread, with and without a profile', async run({ page, go }) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    for (const [url, profile] of [['/posts/in-the-naming-of-light/', true], ['/posts/shihuqiao/', false]]) {
      await go(url);
      const at = await page.evaluate(() => {
        const box = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
        const text = box('.page__content'), toc = box('.sidebar__right .toc'), side = box('#main > .sidebar');
        return { centre: text.left + text.width / 2, mid: innerWidth / 2, root: getComputedStyle(document.documentElement).fontSize, toc: !!toc && toc.width > 0, side: !!side && side.width > 0, over: document.documentElement.scrollWidth - innerWidth };
      });
      must(Math.abs(at.centre - at.mid) <= 2, `${url}: the text stands ${Math.round(at.centre - at.mid)} px off the window's centre`);
      must(at.root === '20px', `${url}: the post did not step up a size at 1920 px (root ${at.root})`);
      must(at.toc, `${url}: the contents list is gone`);
      must(at.side === profile, `${url}: the profile is ${profile ? 'missing' : 'shown where the post has none'}`);
      must(at.over <= 0, `${url}: the page scrolls sideways by ${at.over} px`);
    }
  } },

  { id: 'anchor', name: 'A link to a section moves the address and the focus there', async run({ page, go }) {
    await go('/about/');
    const id = await page.locator('.page__content a[href^="#"]').evaluateAll((as) => as.map((a) => decodeURIComponent(a.getAttribute('href').slice(1))).find((x) => x && document.getElementById(x)) || null);
    must(id, 'About has no link to one of its own sections');
    await page.locator(`.page__content a[href="#${id}"]`).first().click();
    await page.waitForFunction((x) => location.hash === `#${x}`, id, { timeout: 4000 }).catch(() => {});
    must(decodeURIComponent(new URL(page.url()).hash) === `#${id}`, 'the address did not take the section');
    must(await page.evaluate((x) => document.activeElement?.id === x, id), 'focus did not go to the section');
  } },

  { id: 'arrival', name: 'On a long post a jump to the foot leaves no screen without words', async run({ page, go }) {
    // Words arrive as they come into view (_scroll-animations.scss, "The arrival"): the first four
    // blocks in turn, 0.12 s apart, each over 0.7 s, so all of a screen is in by 1.06 s.
    const hidden = () => page.evaluate(() => [...document.querySelectorAll('.page__content .reveal-on-scroll')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9 && parseFloat(getComputedStyle(el).opacity) < 0.99;
    }).length);
    // The first screen arrives too, in turn (Q19): its blocks' fade runs, rather than their being drawn shown.
    await page.addInitScript(() => {
      window.__arrivals = 0;
      addEventListener('transitionrun', (e) => { if (e.propertyName === 'opacity' && e.target.classList?.contains('arrives')) window.__arrivals++; }, true);
    });
    await go('/posts/leetcode-july-challenge/?motion=on', { early: true });
    await page.waitForTimeout(1500);
    const first = await page.evaluate(() => window.__arrivals);
    must(first >= 1, 'the first screen was drawn shown, not arrived');
    must(await page.locator('.page__content .reveal-on-scroll.arrives').count() > 10, 'the post\'s blocks do not arrive');
    // To the end of the post's words (below them the footer fills the screen).
    const toEnd = () => page.evaluate(() => {
      const last = [...document.querySelectorAll('.page__content > *')].filter((el) => el.getBoundingClientRect().height > 0).pop();
      scrollTo({ top: last.getBoundingClientRect().bottom + scrollY - innerHeight * 0.8, behavior: 'instant' });
    });
    await toEnd();
    await page.waitForTimeout(400);
    const seen = await page.evaluate(() => [...document.querySelectorAll('.page__content .reveal-on-scroll')].some((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && parseFloat(getComputedStyle(el).opacity) > 0.2;
    }));
    must(seen, 'at the foot of the post nothing has begun to show after 0.4 s');
    await page.waitForTimeout(900);
    const left = await hidden();
    must(left === 0, `${left} block(s) in view are still not at full strength 1.3 s after the jump`);
    // Stillness: with motion off nothing is ever hidden.
    await go('/posts/leetcode-july-challenge/');
    await toEnd();
    await page.waitForTimeout(100);
    must(await hidden() === 0, 'with motion off a block in view was hidden');
  } },

  { id: 'no-flash', name: 'Words are never drawn shown and then made to rise, even on a slow line', async run({ page }) {
    // On a real line the page paints before its deferred scripts arrive. The head holds the blocks
    // from the first frame (_includes/head/custom.html), so the arrival is the first thing a reader
    // sees of them; without the hold they were drawn, then hidden, then made to rise (the flash).
    const first = () => page.evaluate(() => {
      const el = [...document.querySelector('.page__content').children].find((x) => x.textContent.trim() && !x.matches('.sidebar__right, script, style'));
      return parseFloat(getComputedStyle(el).opacity);
    });
    // Not `go`: it waits for the deferred scripts, and this looks at the page while it is waiting.
    const open = (to) => page.goto(base + to, { waitUntil: 'commit' }).then(() => page.waitForSelector('.page__content', { state: 'attached' }));
    await page.route('**/scroll-animations.js', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue().catch(() => {}); });
    await open('/about/?motion=on');
    await page.waitForTimeout(500);
    const before = await first();
    must(before < 0.05, `before the script came, About's first block was drawn at ${before} (it would then be hidden and rise: a flash)`);
    await page.waitForTimeout(2200);
    must(await first() > 0.99, "once the script came, About's first block did not arrive");
    // On a line slower than the hold (the script after four seconds), the words the hold gave up
    // stay shown when the script comes: they are not hidden again to rise.
    await page.unroute('**/scroll-animations.js');
    await page.route('**/scroll-animations.js', async (route) => { await new Promise((r) => setTimeout(r, 5200)); await route.continue().catch(() => {}); });
    await open('/about/?motion=on');
    await page.waitForTimeout(4600);
    must(await first() > 0.99, "with the script late, About's first block was not shown when the hold gave out");
    let lowest = 1;
    for (let i = 0; i < 20; i++) { lowest = Math.min(lowest, await first()); await page.waitForTimeout(100); }
    must(lowest > 0.99, `with the script late, About's first block was shown, then dropped to ${lowest.toFixed(2)} when the script came (the flash, later)`);
    // And should the script never come, the words show of themselves.
    await page.unroute('**/scroll-animations.js');
    await page.route('**/scroll-animations.js', (route) => route.abort());
    await open('/about/?motion=on');
    await page.waitForTimeout(5000);
    must(await first() > 0.99, 'with the script blocked, About stayed blank after five seconds');
  } },

  { id: 'language-arrival', name: 'A switch of language shows the other text at once, in turn', async run({ page, go }) {
    // The panel just shown arrives as a screen does: its first block at once, not after the blocks
    // already on the screen have taken the turns.
    await go('/posts/defined-by-archive/?motion=on');
    await page.evaluate(() => scrollTo({ top: innerHeight * 1.5, behavior: 'instant' }));
    // A reader reads before switching: past the four seconds the head's hold lasts, as most do.
    await page.waitForTimeout(4500);
    const other = page.locator('.bilingual-switch__button[aria-pressed="false"]').first();
    must(await other.count() === 1, 'the post has no other language to switch to');
    // At the click itself the panel's blocks in view are given their turns, the first with none to wait.
    // (The turns are the arrival's to decide; when the fade then starts is the browser's frame rate,
    // which a headless browser laying out a panel of Chinese makes slow, so it is not timed here.)
    const turns = await other.evaluate((b) => {
      b.click(); // where it stands: the page is not scrolled to it
      return [...document.querySelectorAll('.bilingual-switch__panel:not([hidden]) .reveal-on-scroll')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9; })
        .map((el) => (el.classList.contains('is-visible') ? el.style.getPropertyValue('--arrive-delay') || '0s' : 'waiting'));
    });
    must(turns.length > 0, 'after the switch no block of the other language is in view');
    must(turns[0] === '0s', `the other language's first block in view does not arrive at once (its turn: ${turns[0]}; all: ${turns.join(', ')})`);
    must(!turns.includes('waiting'), `a block of the other language in view was left for the next scroll (${turns.join(', ')})`);
    await page.waitForTimeout(1500);
    const left = await page.evaluate(() => [...document.querySelectorAll('.bilingual-switch__panel:not([hidden]) .reveal-on-scroll')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight * 0.9 && parseFloat(getComputedStyle(el).opacity) < 0.99; }).length);
    must(left === 0, `${left} block(s) of the other language are not at full strength 1.5 s after the switch`);
  } },

  { id: 'palette', name: 'Palette draws its voyages and opens one', async run({ page, go }) {
    await go('/palette/');
    await page.waitForSelector('.palette-voyages__list a[href^="#"]', { timeout: 15000 }).catch(() => {});
    const rows = page.locator('.palette-voyages__list a[href^="#"]');
    must(await rows.count() >= 10, `only ${await rows.count()} voyages in the palette list`);
    // At the foot, of the overview and of a voyage's palette, the way on to the essay on how the colours came by their names.
    const essay = page.locator('.palette-page .colour-next a[href$="/posts/in-the-naming-of-light/"]');
    must(await essay.count() === 1, 'the Palette has no way on to In the Naming of Light');
    await rows.first().click();
    await page.waitForFunction(() => location.hash.length > 1, null, { timeout: 5000 }).catch(() => {});
    must(new URL(page.url()).hash.length > 1, 'choosing a voyage did not change the address');
    await page.waitForSelector('.palette-cards', { timeout: 8000 }).catch(() => {});
    must(await essay.count() === 1, "a voyage's palette has no way on to In the Naming of Light");
  } },

  { id: 'reverie', name: 'Reverie shows a colour and the photographs that hold it', async run({ page, go }) {
    await go('/reverie/?c=4a6fa5');
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must((await page.locator('.reverie__code').innerText()).toUpperCase().includes('4A6FA5'), 'the colour asked for is not the colour shown');
    must(await page.locator('.palette-card__print').count() >= 1, 'no photographs for a colour that has them');
    must(await page.locator('.reverie__credit a[href$="/posts/in-the-naming-of-light/"]').count() === 1, 'Reverie has no way on to In the Naming of Light');
    // A print opens in the lightbox, a dye vat for each frame on its rail.
    const open = () => page.evaluate(() => document.querySelector('.photobook-lightbox')?.open === true);
    await page.locator('.palette-card__print').first().click();
    await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 8000 }).catch(() => {});
    must(await open(), 'a print did not open in the lightbox');
    await page.waitForFunction(() => { const r = document.querySelector('.photobook-lightbox__rail'); return r.children.length > 1 && r.querySelectorAll('canvas').length === r.children.length; }, null, { timeout: 8000 }).catch(() => {});
    must(await page.evaluate(() => { const r = document.querySelector('.photobook-lightbox__rail'); return r.querySelectorAll('canvas').length === r.children.length; }), "the rail's marks were not all drawn");
    // The colour is the lightbox's first frame: its address (#colour) opens it, as a photograph's does.
    await page.goto('about:blank');
    await go('/reverie/?c=4a6fa5#colour');
    await page.waitForFunction(() => document.querySelector('.photobook-lightbox')?.open, null, { timeout: 15000 }).catch(() => {});
    must(await open(), '#colour did not open the lightbox on the colour');
    must(await page.locator('.photobook-lightbox__painted').count() >= 1, '#colour opened on something other than the colour');
  } },

  { id: 'no-webgl', nogl: true, name: 'Where there is no WebGL the colour pages still open, with no vat and no error', async run({ page, go }) {
    await go('/palette/');
    await page.waitForSelector('.palette-voyages__list a[href^="#"]', { timeout: 15000 }).catch(() => {});
    must(await page.locator('.palette-voyages__list a[href^="#"]').count() >= 10, 'the palette did not draw its voyages without WebGL');
    await go('/reverie/?c=4a6fa5');
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must(await page.locator('.palette-card__print').count() >= 1, 'Reverie showed no photographs without WebGL');
    await page.waitForTimeout(600);   // every vat the page makes after the first has had its turn to throw
  } },

  { id: 'atlas', name: 'A voyage in parts starts its map when the reader nears it', async run({ page, go }) {
    // The tiles asked for, by zoom level: laid once, they are all of the view the map settles on.
    const zooms = new Set();
    page.on('request', (r) => { const z = (r.url().match(/basemaps\.cartocdn\.com\/[^/]+\/(\d+)\/\d+\/\d+/) || [])[1]; if (z) zooms.add(z); });
    await go('/voyage/japan/');
    const at = await page.evaluate(() => { const m = document.querySelector('.map-container'); return m ? { far: m.getBoundingClientRect().top > innerHeight + 700, started: !!m.querySelector('.leaflet-pane'), leaflet: typeof L !== 'undefined' } : null; });
    must(at, 'the voyage has no map');
    must(at.leaflet, 'Leaflet did not arrive (it comes from unpkg): the journey cannot tell');
    must(at.far, 'the map is no longer far below the fold on this voyage: the journey cannot tell whether it waits');
    must(!at.started && zooms.size === 0, 'the map started with the page, far below the fold');
    await page.locator('.map-container').scrollIntoViewIfNeeded();
    await page.waitForSelector('.map-container--ready', { timeout: 15000 }).catch(() => {});
    must(await page.locator('.map-container--ready').count() === 1, 'the map did not start when it came into view');
    await page.waitForTimeout(1200);
    must(zooms.size >= 1, 'no tile was asked for (or the tile host has changed): the journey cannot tell');
    must(zooms.size === 1, `the map asked for tiles at ${zooms.size} zoom levels (${[...zooms].join(', ')}): it laid them before its view was known`);
  } },

  { id: 'reverie-unheld', name: 'A colour no photograph holds opens on the one that comes closest', async run({ page, go }) {
    await go('/reverie/?c=ff00ff');
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must((await page.locator('.reverie__code').innerText()).toUpperCase().includes('FF00FF'), 'the colour asked for is not the colour shown');
    must(await page.locator('.palette-card__print').count() >= 1, 'an unheld colour showed no photograph');
    const from = new URL(page.url()).searchParams.get('from');
    must(from, 'the page did not say which photograph it opened on');
    await page.goto('about:blank');
    await go('/reverie/?c=ff00ff');
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must(new URL(page.url()).searchParams.get('from') === from, 'the same unheld colour opened on a different photograph: it is choosing at random');
  } },

  { id: 'drift', name: 'Drift opens on a photograph with its controls', async run({ page, go }) {
    await go('/drift/');
    await page.waitForSelector('.colour-drift__zone', { timeout: 15000 }).catch(() => {});
    must(await page.locator('.colour-drift__zone').count() === 2, 'Drift has no way forward or back');
    // In a colour, Escape is the way back to it; with search open the key closes search and no more.
    await go('/drift/?c=4a6fa5');
    await page.waitForSelector('.colour-drift__zone', { timeout: 15000 }).catch(() => {});
    await page.locator('.search__toggle').click();
    await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
    must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open over Drift');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    must(await page.locator('.search-content.is--visible').count() === 0, 'Escape did not close search');
    must(new URL(page.url()).pathname.includes('/drift/'), 'Escape closed search and also left Drift');
  } },

  { id: 'lost', name: 'A wrong address gets the 404 page with ways back', async run({ page, go }) {
    const status = await go('/no-such-page-here/', { expect: 404 });
    must(status === 404, `a missing page answered ${status}`);
    must(await page.locator('a[href="/"], a[href^="/voyage"], a[href^="/year-archive"]').count() >= 1, 'the 404 page offers no way back');
  } },
];

let server = null, base = baseArg;
if (!base) {
  if (!fs.existsSync(path.join(siteDir, 'index.html'))) { console.error(`No built site at ${siteDir}: run npm run build first, or pass --base.`); process.exit(2); }
  server = await serve(siteDir);
  base = `http://127.0.0.1:${server.address().port}`;
}
base = base.replace(/\/$/, '');

let browser;
try {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
} catch {
  try { browser = await chromium.launch({ channel: 'chrome' }); } catch {
    console.error('No Chromium to drive: npx playwright install chromium, or set CHROMIUM_PATH.');
    process.exit(2);
  }
}

const chosen = only ? JOURNEYS.filter((j) => only.includes(j.id)) : JOURNEYS;
if (only && chosen.length !== only.length) { console.error(`Unknown journey in --only. Known: ${JOURNEYS.map((j) => j.id).join(', ')}`); process.exit(2); }

let failed = 0;
for (const journey of chosen) {
  const context = await browser.newContext(journey.phone
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'en-GB' }
    : { viewport: { width: 1440, height: 900 }, colorScheme: 'dark', locale: 'en-GB' });
  // `nogl`: a device with no WebGL (3D off, an old phone): every canvas refuses one.
  if (journey.nogl) await context.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(type) ? null : get.call(this, type, ...rest); };
  });
  const page = await context.newPage();
  const thrown = [], broken = [];
  page.on('pageerror', (e) => thrown.push(String(e.message).split('\n')[0]));
  // The site's own files only: a photograph or a map tile that fails is the network's business.
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base) && r.request().resourceType() !== 'document') broken.push(`${r.status()} ${r.url().slice(base.length)}`); });
  // `early`: hand the page back as soon as its markup is in, for a journey that watches what happens
  // in the first seconds (the opening), which a wait for every image would sit through.
  const go = async (to, { expect = 200, early = false } = {}) => {
    const res = await page.goto(base + to, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!early) await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
    const status = res ? res.status() : 0;
    if (status !== expect) throw new Failed(`${to} answered ${status}`);
    return status;
  };
  const ok = async (href) => { const r = await context.request.get(base + href).catch(() => null); return !!r && r.status() < 400; };
  let why = null;
  try {
    await journey.run({ page, go, ok });
    if (thrown.length) why = `script error: ${thrown[0]}`;
    else if (broken.length) why = `missing file: ${broken[0]}`;
  } catch (e) {
    why = e instanceof Failed ? e.message : `${String(e.message).split('\n')[0]}`;
  }
  console.log(why ? `✗  ${journey.id}: ${journey.name}\n     ${why}` : `✓  ${journey.id}: ${journey.name}`);
  if (why) failed++;
  await context.close();
}
await browser.close();
server?.close();
console.log(failed ? `${failed} of ${chosen.length} journeys failed.` : `All ${chosen.length} journeys pass.`);
process.exit(failed ? 1 : 0);
