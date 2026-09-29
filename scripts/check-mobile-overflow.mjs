#!/usr/bin/env node
/**
 * Does any page run wider than an iPhone? Loads each page in WebKit (Safari's engine) as an iPhone 14
 * (390 px) and an iPhone SE (320 px) and fails on any horizontal overflow, naming the widest elements.
 *
 * The pixel diff (npm run visual:diff) and the reviews run in Chromium, which forgives what Safari
 * does not: a 4:3 hero with a min-height above it was kept at 4:3 by Safari by widening it past the
 * screen, and the whole page zoomed out on every iPhone (fixed in _page.scss). This is the check
 * that would have caught it.
 *
 * Needs a served site (npm run serve, or the preview server) and Playwright's WebKit, once:
 *   npx playwright install webkit
 *
 * Usage: node scripts/check-mobile-overflow.mjs [--base http://localhost:4100] [/path/ …]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { webkit, devices } = require('playwright-core');

const args = process.argv.slice(2);
const at = args.indexOf('--base');
const base = at >= 0 ? args.splice(at, 2)[1] : 'http://localhost:4100';
const PAGES = args.length ? args : [
  '/', '/about/', '/cv/', '/bestiary/', '/year-archive/', '/posts/shihuqiao/', '/posts/defined-by-archive/',
  '/voyage/', '/voyage/prague/', '/voyage/london/', '/voyage-by-tags/', '/portfolio/',
  '/palette/', '/palette/#london', '/reverie/?c=4a6fa5', '/drift/?from=london%2Fdscf0958&c=4a6fa5',
  '/utils/', '/utils/ridgway/',
];

let browser;
try { browser = await webkit.launch(); } catch {
  console.error('WebKit is not installed: npx playwright install webkit');
  process.exit(2);
}
let failed = 0;
for (const [name, width] of [['iPhone 14', null], ['iPhone SE', 320]]) {
  const device = { ...devices[name] };
  if (width) device.viewport = { width, height: 568 };
  const context = await browser.newContext(device);
  await context.addInitScript(() => { try { localStorage.setItem('qsd:welcome-seen', '1'); } catch { /* private */ } });
  const page = await context.newPage();
  for (const path of PAGES) {
    try { await page.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 }); } catch { console.log(`?  ${name} ${path}: did not load`); failed++; continue; }
    await page.waitForTimeout(1000);
    const wide = await page.evaluate(() => {
      const W = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
      if (sw <= W + 1) return null;
      const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; });
      return `${sw}px on a ${W}px screen: ${over.slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${String(e.className?.baseVal ?? e.className).split(' ')[0]} (${Math.round(e.getBoundingClientRect().width)}px)`).join(', ')}`;
    });
    if (wide) { console.log(`✗  ${name} ${path}: ${wide}`); failed++; }
  }
  await context.close();
}
await browser.close();
console.log(failed ? `${failed} page(s) run wider than an iPhone.` : `Every page fits an iPhone (390 and 320 px, WebKit), ${PAGES.length} pages.`);
process.exit(failed ? 1 : 0);
