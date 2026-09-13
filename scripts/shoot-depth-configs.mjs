#!/usr/bin/env node
/* Screenshot driver: renders the harness for a list of configs × tilts and
   composites labelled rows into one contact-sheet PNG per config set.
   Usage: python3 -m http.server 8123 (repo root), then: node scripts/shoot-depth-configs.mjs <configs.json> <out.png>
   configs.json: [{label, photo, depth, amp, focus, tilts:[[tx,ty],...]}] */
import fs from 'fs';
import sharp from 'sharp';
import { chromium } from 'playwright';

const [cfgPath, outPath] = process.argv.slice(2);
const configs = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const BASE = 'http://127.0.0.1:8123/scripts/depth-render-harness.html';
const W = 1100;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: W + 40, height: 900 } });

const rows = [];
for (const c of configs) {
  const cells = [];
  for (const [tx, ty] of c.tilts) {
    const url = `${BASE}?photo=${encodeURIComponent(c.photo)}&depth=${encodeURIComponent(c.depth)}` +
      `&amp=${c.amp}&focus=${c.focus}&tx=${tx}&ty=${ty}&w=${W}&even=0&ay=${c.ay == null ? 1 : c.ay}`;
    await page.goto(url);
    await page.waitForFunction('window.__done === true', null, { timeout: 15000 });
    const el = await page.$('#gl');
    let shot = await el.screenshot();
    if (c.crop) {
      const m = await sharp(shot).metadata();
      const [x0, y0, x1, y1] = c.crop;
      shot = await sharp(shot).extract({
        left: Math.round(x0 * m.width),
        top: Math.round(y0 * m.height),
        width: Math.round((x1 - x0) * m.width),
        height: Math.round((y1 - y0) * m.height)
      }).resize({ width: 520 }).toBuffer();
    }
    cells.push(shot);
  }
  // side-by-side cells for this config
  const metas = await Promise.all(cells.map((b) => sharp(b).metadata()));
  const cw = metas[0].width, ch = metas[0].height;
  const rowW = cw * cells.length + 8 * (cells.length - 1);
  const labelH = 34;
  const row = sharp({
    create: { width: rowW, height: ch + labelH, channels: 3, background: { r: 11, g: 11, b: 18 } }
  }).composite([
    {
      input: Buffer.from(
        `<svg width="${rowW}" height="${labelH}"><text x="8" y="24" font-family="sans-serif" font-size="20" fill="#c9a35c">${c.label}</text></svg>`
      ),
      top: 0, left: 0
    },
    ...cells.map((b, i) => ({ input: b, top: labelH, left: i * (cw + 8) }))
  ]);
  rows.push(await row.png().toBuffer());
}
await browser.close();

const rowMetas = await Promise.all(rows.map((b) => sharp(b).metadata()));
const totalH = rowMetas.reduce((a, m) => a + m.height + 10, 0);
const maxW = Math.max(...rowMetas.map((m) => m.width));
let top = 0;
const comps = rows.map((b, i) => {
  const c = { input: b, top, left: 0 };
  top += rowMetas[i].height + 10;
  return c;
});
await sharp({ create: { width: maxW, height: totalH, channels: 3, background: { r: 11, g: 11, b: 18 } } })
  .composite(comps).jpeg({ quality: 88 }).toFile(outPath);
console.log('wrote', outPath);
