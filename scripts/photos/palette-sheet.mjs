#!/usr/bin/env node
/**
 * A contact sheet for judging picture distance by eye: a handful of photos,
 * each with its nearest neighbours under three measures side by side:
 *
 *   colour        the earth mover's distance between the two palettes
 *   + layout      the same, with the 3×3 grid blended in (what sits above what)
 *   vector        χ² between the 32-anchor histograms (the fast, indexable one)
 *
 * Reads the local palettes sidecar (node scripts/photos/palettes.mjs) and the
 * merged manifests; writes one self-contained HTML page that loads the public
 * 480 px tiers. Nothing is uploaded.
 *
 * Usage: node scripts/photos/palette-sheet.mjs [--gallery london] [--seeds 10] [--k 5] [--out file.html]
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS, parseArgs } from './lib/config.mjs';
import { parsePalette, parseGrid, distance, vectorOf, chi2, swatchesOf } from './lib/palette.mjs';
import { PALETTES_DIR } from './palettes.mjs';

const args = parseArgs(process.argv.slice(2));
const SEEDS = +args.seeds || 10, K = +args.k || 5, LAYOUT = 0.35;
const out = String(args.out || path.join(PATHS.localStore, 'palette-sheet.html'));

/** Every photo with a palette: its place in the book, its tier, its colours. */
export function loadAll() {
  const all = [];
  for (const f of fs.readdirSync(PALETTES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
    const side = JSON.parse(fs.readFileSync(path.join(PALETTES_DIR, f), 'utf8'));
    const mf = path.join(PATHS.mergedDir, f);
    if (!fs.existsSync(mf)) continue;
    const merged = JSON.parse(fs.readFileSync(mf, 'utf8'));
    for (const p of merged.photos) {
      const s = side.photos[p.hash];
      if (!s) continue;
      const P = parsePalette(s.palette);
      all.push({ gallery: merged.gallery, slug: p.slug, name: p.name, url: p.url, light: p.light?.text || null, P, G: parseGrid(s.grid), V: vectorOf(P) });
    }
  }
  return all;
}

const measures = {
  colour: (a, b) => distance(a, b),
  layout: (a, b) => distance(a, b, { composition: LAYOUT }),
  vector: (a, b) => chi2(a.V, b.V),
};

function nearest(seed, pool, fn) {
  return pool.filter(p => p !== seed).map(p => ({ p, d: fn(seed, p) })).sort((x, y) => x.d - y.d).slice(0, K);
}

function seedsOf(pool, n) {
  // Evenly through the list, so the sample is the same every run.
  const step = pool.length / n;
  return Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[Math.floor(i * step + step / 2)]);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chips = (P) => swatchesOf(P).map(s => `<i style="background:${s.hex};flex:${s.pc}"></i>`).join('');
const card = (p, d, cross) => `<figure><img src="${p.url}/480.webp" alt=""><div class="bar">${chips(p.P)}</div><figcaption>${esc(p.name)}${cross ? ` · <b>${esc(p.gallery.split('/')[0])}</b>` : ''}${d != null ? ` <span>${d.toFixed(d < 1 ? 3 : 1)}</span>` : ''}</figcaption></figure>`;

function section(title, note, seeds, pool, cross) {
  const rows = seeds.map(s => {
    const cols = Object.entries(measures).map(([name, fn]) => {
      const nn = nearest(s, cross ? pool.filter(p => p.gallery !== s.gallery) : pool, fn);
      return `<div class="m"><h4>${name}</h4><div class="nn">${nn.map(({ p, d }) => card(p, d, cross)).join('')}</div></div>`;
    }).join('');
    return `<section class="row"><div class="seed">${card(s, null, cross)}</div>${cols}</section>`;
  }).join('');
  return `<h2>${title}</h2><p class="note">${note}</p>${rows}`;
}

async function main() {
  const all = loadAll();
  const within = args.gallery ? all.filter(p => p.gallery === String(args.gallery)) : all.filter(p => p.gallery === 'london');
  const t = performance.now();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kindred frames</title>
<style>
:root{--bg:#111;--ink:#e8e4dc;--mute:#8a857c;--line:#2a2724}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.45 Barlow,system-ui,sans-serif;padding:32px 24px 80px}
h1{font:700 34px/1.1 "Playfair Display",Didot,serif;margin:0 0 6px}h2{font:700 22px "Playfair Display",Didot,serif;margin:48px 0 4px}
.note{color:var(--mute);max-width:70ch;margin:0 0 16px}
.row{display:grid;grid-template-columns:200px repeat(3,minmax(0,1fr));gap:18px;padding:18px 0;border-top:1px solid var(--line)}
.m h4{margin:0 0 6px;font:600 10px Barlow,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.nn{display:grid;grid-template-columns:repeat(${K},minmax(0,1fr));gap:6px}
figure{margin:0}img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block;background:#1a1a1a}
.seed img{aspect-ratio:auto}
.bar{display:flex;height:4px;margin-top:3px}.bar i{display:block}
figcaption{font-size:10px;color:var(--mute);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}figcaption span{float:right;font-family:Didot,serif}
figcaption b{font-weight:600;color:var(--ink);text-transform:capitalize}
@media (max-width:900px){.row{grid-template-columns:1fr}}
</style></head><body>
<h1>Kindred frames</h1>
<p class="note">Each row: a photograph, then its ${K} nearest under three measures. <b>colour</b> is the earth mover's distance between the 32-colour palettes (in ΔE: how far, on average, a unit of colour must travel). <b>layout</b> blends in the 3×3 grid at ${LAYOUT}. <b>vector</b> is χ² over the 32 fixed anchors, the fast one an index would use. The strip under each photo is its five display swatches.</p>
${section('Within London', `${within.length} photographs; ${Math.min(SEEDS, within.length)} evenly spaced seeds.`, seedsOf(within, SEEDS), within, false)}
${section('Across every voyage', `${all.length} photographs; seeds drawn evenly from all of them; neighbours from other voyages only.`, seedsOf(all, SEEDS), all, true)}
</body></html>`;
  fs.writeFileSync(out, html);
  console.log(`palette sheet: ${all.length} photos, ${((performance.now() - t) / 1000).toFixed(1)} s → ${out}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().catch(e => { console.error(e); process.exit(2); });
