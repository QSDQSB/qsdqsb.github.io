#!/usr/bin/env node
/**
 * Visual regression harness — pixel-diffs a fixed page set against a
 * committed baseline, at desktop and mobile-small.
 *
 *   npm run visual:build       # seeded Jekyll build of _site/ (see below)
 *   npm run visual:capture     # (re)write tests/visual/baseline/*.png
 *   npm run visual:diff        # render again, compare, exit 1 on any delta
 *   npm run visual:audit       # assert nothing animates under motion-off
 *
 * Capture and diff expect a built site in `_site/` and serve it themselves
 * on a free localhost port. Build it with `visual:build`, not `build:fast`:
 * several layouts pick content with Liquid's `sample` (the QSD logo, related
 * and random posts, the word card), so an ordinary build differs from the
 * last one before a single style changes. `visual:build` seeds Ruby's PRNG
 * first, which is what `sample` draws from, so the same source renders the
 * same HTML, but only while no source changes: any edit reshuffles the draws,
 * so the sampled blocks (SAMPLED below) are painted over in every shot.
 *
 * Why this exists: CSS refactors — `!important` triage, token inlining,
 * import reordering — are verified by eye or not at all, and "not at all"
 * is what happens. A committed baseline turns "looks the same" into a
 * number.
 *
 * Determinism. Every page loads with `?motion=off` (see
 * _includes/head/custom.html) so entrance animations land on their final
 * frame. The run scrolls each page to the bottom and back before shooting,
 * so lazy images and scroll reveals are settled, then holds until the
 * page's slowest timers have run (the Home reveal fallback at 6 s, the
 * masthead's idle-collapse and auto-fade at 2.6 s + 3 s) and pins the
 * masthead to its expanded resting state, which is what a reader sees at
 * the top of a page. The first-visit welcome toast is pre-dismissed through
 * its localStorage key, so shots are of a returning visitor, and
 * `Math.random` is seeded so the Home's intriguing-word card picks the same
 * word every run. Anything
 * fetched from the network at render time (map tiles) is still
 * nondeterministic, so the Leaflet tile pane is blanked before the shot —
 * the controls, popups and chrome around it are what the stylesheet owns.
 * Leaflet itself is served from the local `leaflet` package instead of
 * unpkg (same version, same bytes, so the SRI hashes still pass); sandboxed
 * runners often cannot reach the CDN, and without it the map never mounts.
 *
 * Profiles. Every page is shot at desktop and mobile. Pages flagged
 * `motion: true` are also shot with the OS reduced-motion preference on
 * (desktop-reduced, mobile-reduced), so the `prefers-reduced-motion`
 * rules — the site's kill switches — are pixel-checked too.
 *
 * Audit. `audit` loads each page under motion-off and lists every element
 * whose computed style still has a running animation or a live transition.
 * The kill switches exist so that list is empty; the command exits 1 when
 * it is not. It is the behavioural test behind the pixel one: a screenshot
 * proves the final frame, the audit proves nothing is still moving.
 *
 * Tolerance. pixelmatch runs with anti-aliasing detection on, and a page
 * still passes if the remaining delta is at most DIFF_TOLERANCE of its
 * pixels (or ABS_TOLERANCE pixels, whichever is larger). That covers font
 * hinting jitter; it does not cover a moved border or a changed colour.
 * A size mismatch always fails.
 *
 * Options:
 *   --only <id>[,<id>]   restrict to these page ids
 *   --viewport <name>    desktop | mobile (default: both)
 *   --site <dir>         built site directory (default: _site)
 *
 * Environment:
 *   CHROMIUM_PATH        browser binary; falls back to /opt/pw-browsers/chromium
 *                        when present, else Playwright's own resolution.
 *
 * Exit codes:
 *   0  capture written / diff clean
 *   1  diff found deltas (see tests/visual/diff/*.png)
 *   2  usage or environment problem
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const VISUAL_DIR = path.join(ROOT, 'tests', 'visual');
const BASELINE_DIR = path.join(VISUAL_DIR, 'baseline');
const CURRENT_DIR = path.join(VISUAL_DIR, 'current');
const DIFF_DIR = path.join(VISUAL_DIR, 'diff');

const DIFF_TOLERANCE = 0.00005; // 0.005 % of the page's pixels
const ABS_TOLERANCE = 40;       // or this many pixels, whichever is larger
const PIXELMATCH_THRESHOLD = 0.1;
const SETTLE_MS = 7000; // longest page-side timer (Home reveal fallback) + margin

/**
 * The page set. `setup` runs after load for pages reached by interaction.
 * post-bilingual covers the language switch's [hidden] panels; post-notices
 * covers kramdown `{: .notice}` paragraphs, where `.page__content p` outranks
 * the notice class — neither is reachable from the other pages.
 */
// What Liquid picks with `sample`: the footer logo, the word cards, the related and "elsewhere"
// cards. The seeded build repeats a draw only while no source changes, so any unrelated edit
// would reshuffle them; the shots paint them over instead of comparing them.
const SAMPLED = ['img[alt="QSD Logo"]', '.center-wrapper:has(img[alt="QSD Logo"])', '.word_card_container', '.page__related .grid__wrapper', '.photobook-end__more'];

async function drawAllRows(page) {
  await page.addStyleTag({ content: '.photobook-row { content-visibility: visible; }' });
}

const PAGES = [
  { id: 'home', url: '/', motion: true },
  { id: 'post-toc', url: '/posts/shihuqiao/', motion: true },
  { id: 'post-jianfei', url: '/posts/jianfei-diary/', motion: true },
  { id: 'post-bilingual', url: '/posts/defined-by-archive/' },
  { id: 'post-notices', url: '/posts/leetcode-july-challenge/' },
  { id: 'voyage', url: '/voyage/', motion: true },
  { id: 'voyage-prague', url: '/voyage/prague/', motion: true },
  // The Photobook: a gallery page, and its lightbox opened by a frame link (#slug). Its rows skip
  // rendering off screen (content-visibility: auto), which a full-page shot would record as blank,
  // so the shot draws them all; the scroll-through that follows loads their images.
  { id: 'photobook', url: '/voyage/london/', setup: drawAllRows },
  {
    id: 'photobook-lightbox',
    url: '/voyage/london/#dscf7406',
    screenOnly: true, // the dialog covers the screen; the book behind it is the shot above
    setup: async (page) => {
      await drawAllRows(page);
      await page.waitForSelector('#photobook-lightbox[open] .photobook-lightbox__mat img.is-on', { timeout: 10000 });
      await page.waitForFunction(() => [...document.querySelectorAll('.photobook-lightbox__mat img')].every((im) => im.complete), null, { timeout: 20000 });
    },
  },
  { id: 'voyage-by-tags', url: '/voyage-by-tags/' },
  { id: 'about', url: '/about/' },
  { id: 'portfolio', url: '/portfolio/' },
  { id: '404', url: '/404.html' },
  {
    id: 'search',
    url: '/',
    setup: async (page) => {
      await page.click('.search__toggle');
      await page.waitForSelector('.search-content.is--visible', { timeout: 5000 });
      await page.fill('.search-content input.search-input', 'prague');
      // lunr loads its index asynchronously; wait for the result list to stop changing.
      await page.waitForFunction(() => {
        const el = document.getElementById('results');
        const html = el ? el.innerHTML : '';
        const same = html && html === window.__visualLastResults;
        window.__visualLastResults = html;
        return same;
      }, null, { timeout: 15000, polling: 500 });
    },
  },
];

const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const VIEWPORTS = {
  desktop: DESKTOP,
  mobile: MOBILE,
  'desktop-reduced': { ...DESKTOP, reducedMotion: 'reduce', motionOnly: true },
  'mobile-reduced': { ...MOBILE, reducedMotion: 'reduce', motionOnly: true },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function parseArgs(argv) {
  const args = { command: argv[0], only: null, viewport: null, site: '_site' };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--only') args.only = argv[++i].split(',');
    else if (a === '--viewport') args.viewport = argv[++i];
    else if (a === '--site') args.site = argv[++i];
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function serve(siteDir) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = path.join(siteDir, urlPath);
    if (!filePath.startsWith(siteDir)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      const notFound = path.join(siteDir, '404.html');
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function browserExecutable() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const preinstalled = '/opt/pw-browsers/chromium';
  return fs.existsSync(preinstalled) ? preinstalled : undefined;
}

async function settle(page, startedAt) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    // Walk the page so IntersectionObserver reveals and lazy images fire.
    // `behavior: 'instant'` — the site sets an inline smooth scroll-behavior,
    // and a scroll still gliding back to the top when the shot starts fires
    // late scroll events (the masthead's is-scrolled toggle) mid-capture.
    const step = Math.max(200, window.innerHeight / 2);
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y <= total; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    while (window.scrollY > 0) await new Promise((r) => setTimeout(r, 20));
    await Promise.all(Array.from(document.images, (img) => img.decode().catch(() => {})));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  const remaining = SETTLE_MS - (Date.now() - startedAt);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.evaluate(() => {
    // By now the masthead's idle timers have all fired and none are pending,
    // so this state holds through the capture.
    const masthead = document.querySelector('.masthead');
    if (masthead) {
      masthead.classList.remove('is-hidden', 'is-nav-collapsed', 'is-nav-faded', 'is-scrolled');
      masthead.classList.add('is-nav-expanded');
    }
  });
  await page.addStyleTag({
    content: [
      '.leaflet-tile-pane { visibility: hidden !important; }',
      'video { visibility: hidden !important; }',
      '*, *::before, *::after { caret-color: transparent !important; }',
    ].join('\n'),
  });
  await page.waitForTimeout(300);
}

async function openPage(browser, viewportName) {
  const { motionOnly, ...options } = VIEWPORTS[viewportName];
  const context = await browser.newContext({
    reducedMotion: 'no-preference',
    ...options,
    colorScheme: 'dark',
    locale: 'en-GB',
    timezoneId: 'UTC',
  });
  await context.addInitScript(() => {
    try { localStorage.setItem('qsd:welcome-seen', '1'); } catch (e) { /* storage blocked */ }
    // mulberry32 — small, seedable, good enough to make a picker repeatable.
    let seed = 0x9e3779b9;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  await context.route(/^https:\/\/unpkg\.com\/leaflet@[\d.]+\/dist\/(leaflet\.(?:js|css))$/, (route, request) => {
    const file = request.url().split('/').pop();
    route.fulfill({
      path: require.resolve(`leaflet/dist/${file}`),
      contentType: file.endsWith('.css') ? MIME['.css'] : MIME['.js'],
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
  const page = await context.newPage();
  return { context, page };
}

/** The page's URL with ?motion=off, placed before any #fragment so the page does not read it as part of the hash. */
function motionOff(baseUrl, url) {
  const [pathPart, hash = ''] = url.split('#');
  return `${baseUrl}${pathPart}${pathPart.includes('?') ? '&' : '?'}motion=off${hash ? `#${hash}` : ''}`;
}

async function shoot(browser, baseUrl, pageDef, viewportName, outDir) {
  const { context, page } = await openPage(browser, viewportName);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    const url = motionOff(baseUrl, pageDef.url);
    const startedAt = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    if (pageDef.setup) await pageDef.setup(page);
    await settle(page, startedAt);
    const file = path.join(outDir, `${pageDef.id}--${viewportName}.png`);
    await page.screenshot({ path: file, fullPage: !pageDef.screenOnly, animations: 'disabled', mask: SAMPLED.map((s) => page.locator(s)), maskColor: '#2a2a2a' });
    return { file, errors };
  } finally {
    await context.close();
  }
}

/** Elements still moving under motion-off. Empty is the only passing answer. */
async function audit(browser, baseUrl, pageDef, viewportName) {
  const { context, page } = await openPage(browser, viewportName);
  try {
    await page.goto(motionOff(baseUrl, pageDef.url), { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    return await page.evaluate(() => {
      const label = (el, pseudo) => {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).map((c) => `.${c}`).join('') : '';
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}${pseudo}`;
      };
      const moving = [];
      for (const el of document.querySelectorAll('*')) {
        for (const pseudo of ['', '::before', '::after']) {
          const cs = getComputedStyle(el, pseudo || null);
          if (pseudo && cs.content === 'none') continue;
          if (cs.animationName && cs.animationName !== 'none') moving.push(`${label(el, pseudo)} — animation ${cs.animationName}`);
          const durations = (cs.transitionDuration || '').split(',').map(parseFloat);
          if (durations.some((d) => d > 0)) moving.push(`${label(el, pseudo)} — transition ${cs.transitionProperty} ${cs.transitionDuration}`);
        }
      }
      return [...new Set(moving)];
    });
  } finally {
    await context.close();
  }
}

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function compare(id, viewportName) {
  const name = `${id}--${viewportName}.png`;
  const basePath = path.join(BASELINE_DIR, name);
  const currentPath = path.join(CURRENT_DIR, name);
  if (!fs.existsSync(basePath)) {
    return { name, status: 'missing-baseline' };
  }
  const base = readPng(basePath);
  const current = readPng(currentPath);
  if (base.width !== current.width || base.height !== current.height) {
    return {
      name,
      status: 'size',
      detail: `${base.width}×${base.height} → ${current.width}×${current.height}`,
    };
  }
  const diff = new PNG({ width: base.width, height: base.height });
  const mismatched = pixelmatch(base.data, current.data, diff.data, base.width, base.height, {
    threshold: PIXELMATCH_THRESHOLD,
    includeAA: false,
  });
  const total = base.width * base.height;
  const allowed = Math.max(ABS_TOLERANCE, Math.round(total * DIFF_TOLERANCE));
  if (mismatched > allowed) {
    fs.mkdirSync(DIFF_DIR, { recursive: true });
    fs.writeFileSync(path.join(DIFF_DIR, name), PNG.sync.write(diff));
    return { name, status: 'diff', detail: `${mismatched} px differ (allowed ${allowed})` };
  }
  return { name, status: 'ok', detail: mismatched ? `${mismatched} px within tolerance` : 'identical' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!['capture', 'diff', 'audit'].includes(args.command)) {
    console.error('Usage: visual-baseline.mjs <capture|diff|audit> [--only ids] [--viewport name] [--site dir]');
    return 2;
  }
  const siteDir = path.resolve(ROOT, args.site);
  if (!fs.existsSync(path.join(siteDir, 'index.html'))) {
    console.error(`No built site at ${siteDir} — run \`npm run build:fast\` first.`);
    return 2;
  }
  const pages = args.only ? PAGES.filter((p) => args.only.includes(p.id)) : PAGES;
  if (args.only && pages.length !== args.only.length) {
    console.error(`Unknown page id in --only. Known: ${PAGES.map((p) => p.id).join(', ')}`);
    return 2;
  }
  const viewports = args.viewport ? [args.viewport] : Object.keys(VIEWPORTS);
  if (viewports.some((v) => !VIEWPORTS[v])) {
    console.error(`Unknown viewport. Known: ${Object.keys(VIEWPORTS).join(', ')}`);
    return 2;
  }
  const viewportsFor = (pageDef) => viewports.filter((v) => pageDef.motion || !VIEWPORTS[v].motionOnly);

  const outDir = args.command === 'capture' ? BASELINE_DIR : CURRENT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  if (args.command === 'diff' && fs.existsSync(DIFF_DIR)) {
    for (const f of fs.readdirSync(DIFF_DIR)) fs.unlinkSync(path.join(DIFF_DIR, f));
  }

  const { server, port } = await serve(siteDir);
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({
    executablePath: browserExecutable(),
    args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  });

  let failures = 0;
  try {
    if (args.command === 'audit') {
      for (const pageDef of pages) {
        for (const viewportName of (args.viewport ? viewports : ['desktop', 'mobile'])) {
          const moving = await audit(browser, baseUrl, pageDef, viewportName);
          if (moving.length) failures += 1;
          console.log(`${moving.length ? 'FAIL    ' : 'ok      '}  ${pageDef.id}--${viewportName}  ${moving.length} still moving`);
          for (const m of moving.slice(0, 20)) console.log(`            ${m}`);
        }
      }
      console.log(failures ? `\n${failures} page(s) still animate under motion-off.` : '\nMotion-off audit clean.');
      return failures ? 1 : 0;
    }
    for (const pageDef of pages) {
      for (const viewportName of viewportsFor(pageDef)) {
        const { file, errors } = await shoot(browser, baseUrl, pageDef, viewportName, outDir);
        const label = path.basename(file);
        if (errors.length) console.log(`          ${label}: ${errors.length} page error(s) — ${errors[0]}`);
        if (args.command === 'capture') {
          console.log(`captured  ${label}`);
          continue;
        }
        const result = compare(pageDef.id, viewportName);
        const ok = result.status === 'ok';
        if (!ok) failures += 1;
        console.log(`${ok ? 'ok      ' : 'FAIL    '}  ${label}  ${result.status}${result.detail ? ` — ${result.detail}` : ''}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (args.command === 'capture') {
    console.log(`\nBaseline written to ${path.relative(ROOT, BASELINE_DIR)}/`);
    return 0;
  }
  if (failures) {
    console.log(`\n${failures} shot(s) differ from baseline. Diff images: ${path.relative(ROOT, DIFF_DIR)}/`);
    return 1;
  }
  console.log('\nVisual diff clean.');
  return 0;
}

main().then((code) => process.exit(code), (err) => {
  console.error(err);
  process.exit(2);
});
