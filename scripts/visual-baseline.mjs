#!/usr/bin/env node
/**
 * Visual regression harness — pixel-diffs a fixed page set against a
 * committed baseline, at desktop and mobile-small.
 *
 *   npm run visual:build       # seeded Jekyll build of _site/ (see below)
 *   npm run visual:capture     # (re)write tests/visual/baseline/*.png
 *   npm run visual:diff        # render again, compare, exit 1 on any delta
 *
 * Capture and diff expect a built site in `_site/` and serve it themselves
 * on a free localhost port. Build it with `visual:build`, not `build:fast`:
 * several layouts pick content with Liquid's `sample` (the QSD logo, related
 * and random posts, the word card), so an ordinary build differs from the
 * last one before a single style changes. `visual:build` seeds Ruby's PRNG
 * first, which is what `sample` draws from, so the same source renders the
 * same HTML. Thumbnails must already exist (`npm run build` once).
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

/** The page set. `setup` runs after load for pages reached by interaction. */
const PAGES = [
  { id: 'home', url: '/' },
  { id: 'post-toc', url: '/posts/shihuqiao/' },
  { id: 'post-jianfei', url: '/posts/jianfei-diary/' },
  { id: 'voyage', url: '/voyage/' },
  { id: 'voyage-prague', url: '/voyage/prague/' },
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

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  },
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

async function shoot(browser, baseUrl, pageDef, viewportName, outDir) {
  const context = await browser.newContext({
    ...VIEWPORTS[viewportName],
    colorScheme: 'dark',
    locale: 'en-GB',
    timezoneId: 'UTC',
    reducedMotion: 'no-preference',
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
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    const url = `${baseUrl}${pageDef.url}${pageDef.url.includes('?') ? '&' : '?'}motion=off`;
    const startedAt = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    if (pageDef.setup) await pageDef.setup(page);
    await settle(page, startedAt);
    const file = path.join(outDir, `${pageDef.id}--${viewportName}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    return { file, errors };
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
  if (!['capture', 'diff'].includes(args.command)) {
    console.error('Usage: visual-baseline.mjs <capture|diff> [--only ids] [--viewport desktop|mobile] [--site dir]');
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
    for (const pageDef of pages) {
      for (const viewportName of viewports) {
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
