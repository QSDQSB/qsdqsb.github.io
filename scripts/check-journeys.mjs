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
 * A journey is added when a new route becomes one a reader depends on, and removed with the feature:
 * a file `tests/journeys/<id>.mjs` whose default export is `{ id, name, [phone], [nogl], run }`.
 * Keep each to what a reader would notice, not how the page is built.
 *
 * Exit codes: 0 every journey passed · 1 a journey failed · 2 usage or environment problem
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Failed } from '../tests/journeys/_lib.mjs';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JOURNEY_DIR = path.join(ROOT, 'tests', 'journeys');
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

/** A reader's routes, one file each in tests/journeys/ (the id is the file's name), so two branches that add a journey never touch the same file. Each gets a fresh page; `go(path)` loads one and returns its status. */
const JOURNEYS = [];
for (const file of fs.readdirSync(JOURNEY_DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
  const { default: journey } = await import(pathToFileURL(path.join(JOURNEY_DIR, file)).href);
  if (journey.id + '.mjs' !== file) { console.error(`tests/journeys/${file}: its id is ${journey.id}, so the file must be ${journey.id}.mjs`); process.exit(2); }
  JOURNEYS.push(journey);
}

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
    await journey.run({ page, go, ok, base });
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
