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
    await page.locator('.search__toggle').click();
    await page.waitForSelector('.search-content.is--visible', { timeout: 5000 }).catch(() => {});
    must(await page.locator('.search-content.is--visible').count() === 1, 'the search panel did not open');
    await page.locator('#search').fill('prague');
    await page.waitForSelector('#results a[href]', { timeout: 20000 }).catch(() => {});
    must(await page.locator('#results a[href]').count() >= 1, 'searching "prague" found nothing');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.search-content.is--visible', { state: 'detached', timeout: 3000 }).catch(() => {});
    must(await page.locator('.search-content.is--visible').count() === 0, 'Escape did not close the search panel');
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
    must(await page.locator('.colour-figure--frames .palette-card').count() >= 1, 'the frames figure shows no frames');
    const card = page.locator('.reverie-card');
    const hex = (await card.locator('.reverie__code').innerText()).replace('#', '').toLowerCase();
    must(/^[0-9a-f]{6}$/.test(hex), 'the Reverie card names no colour');
    must(await card.locator('.palette-card__print').count() >= 1, 'the Reverie card shows no photograph');
    await card.locator('.reverie-card__open').click();
    await page.waitForURL(/\/reverie\/\?/, { timeout: 8000 }).catch(() => {});
    must(new URL(page.url()).searchParams.get('c') === hex, "the card did not open its colour's Reverie");
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must((await page.locator('.reverie__code').innerText()).toLowerCase().includes(hex), 'Reverie opened on another colour than the card showed');
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

  { id: 'palette', name: 'Palette draws its voyages and opens one', async run({ page, go }) {
    await go('/palette/');
    await page.waitForSelector('.palette-voyages__list a[href^="#"]', { timeout: 15000 }).catch(() => {});
    const rows = page.locator('.palette-voyages__list a[href^="#"]');
    must(await rows.count() >= 10, `only ${await rows.count()} voyages in the palette list`);
    await rows.first().click();
    await page.waitForFunction(() => location.hash.length > 1, null, { timeout: 5000 }).catch(() => {});
    must(new URL(page.url()).hash.length > 1, 'choosing a voyage did not change the address');
  } },

  { id: 'reverie', name: 'Reverie shows a colour and the photographs that hold it', async run({ page, go }) {
    await go('/reverie/?c=4a6fa5');
    await page.waitForSelector('.palette-card__print', { timeout: 15000 }).catch(() => {});
    must((await page.locator('.reverie__code').innerText()).toUpperCase().includes('4A6FA5'), 'the colour asked for is not the colour shown');
    must(await page.locator('.palette-card__print').count() >= 1, 'no photographs for a colour that has them');
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
