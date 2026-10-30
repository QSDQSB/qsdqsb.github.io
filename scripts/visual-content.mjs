#!/usr/bin/env node
/**
 * The pixel harness's content, pinned. The shots test the site's code (layouts, styles, scripts),
 * so what they show must not move when content does: a new voyage re-ordered Home's Recent Updates
 * and the search over it, the voyage lists and Palette, and new photographs re-laid a Photobook and
 * re-drew its colours, every time leaving master's baselines stale until someone re-captured (R005).
 *
 *   node scripts/visual-content.mjs pin      # write tests/visual/content-pin.json from this tree
 *   node scripts/visual-content.mjs freeze   # the visual build's manifests, narrowed to the pin
 *
 * The pin (committed) holds its own moment (the visual build's clock: a page with no date prints
 * the build's, and Jekyll leaves out a document dated after it), every published voyage, part,
 * post and portfolio page as it stood, the raw text of each one's `updated:` line (what Recent
 * Updates sorts by), and every photograph each of their galleries held.
 *
 * `freeze` (run by `npm run visual:build`) reads the merged manifests photos:fetch wrote and writes,
 * to tests/visual/content/photo_manifests/ (gitignored), the same files holding only the pinned
 * photographs: a book that has gained some is laid out again from the pinned ones, and the pages
 * across voyages (Palette, Reverie, Home's Reverie, Drift's kindred frames) are worked out again
 * from the pinned books, by the pipeline's own functions. The kindred frames come out a little
 * unlike the live ones (those are worked out over hidden photographs too); no shot draws them.
 * scripts/visual-content.rb, loaded ahead of Jekyll by the visual build, sets the clock, leaves out
 * every document the pin does not name, puts back each pinned `updated:`, reads these manifests in
 * place of the live ones, and drops the points of pages it does not hold from the maps.
 *
 * What it holds still: content added after the pin (a voyage, a part, a post, photographs), the
 * dates a harvest moves, and the month the build runs in. What it does not: an edit to a pinned
 * page's own words or captions, a pinned photograph removed, re-processed or re-ordered, a cover
 * changed. Those are rare, and the diff shows them on that page alone: re-capture it. With no
 * manifests at all, `freeze` stops (npm run photos:fetch).
 *
 * Exit codes: 0 done · 1 no manifests to narrow · 2 usage
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { galleryKey } from './photos/lib/config.mjs';
import { bookRows, coverIndex, colophonOf, lightboxOf, colourOf } from './photos/lib/book.mjs';
import { atlasOf, palettesOf, framesOf, picksOf, kindredOf } from './photos/lib/atlas.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PIN_FILE = path.join('tests', 'visual', 'content-pin.json');
export const FROZEN_DIR = path.join('tests', 'visual', 'content', 'photo_manifests');
// The collections whose documents list one another (Recent Updates, the voyage lists, the search,
// a post's neighbours). Pages (_pages/) are the site's own and stay live.
export const COLLECTIONS = ['_posts', '_voyage', '_subvoyage', '_portfolio'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const abs = path.join(dir, e.name);
    return e.isDirectory() ? walk(abs) : [abs];
  });
}

const frontMatter = (text) => text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];

/** The front matter's `updated:` value as written (the Ruby half parses it as Jekyll would), or null. */
export function updatedOf(text) {
  const fm = frontMatter(text);
  if (fm === undefined) return undefined; // no front matter: not a document
  const line = fm.match(/^updated:[ \t]*(.*?)[ \t]*$/m);
  return line ? line[1] : null;
}

/** A document Jekyll leaves out (`published: false`): not pinned, so publishing it later stays out of the shots. */
export const unpublished = (text) => /^published:[ \t]*false[ \t]*$/m.test(frontMatter(text) || '');

/** Every document of the collections, by its path from the root, with its raw `updated:`. */
export function docsOf(root = ROOT) {
  const docs = {};
  for (const c of COLLECTIONS) {
    for (const abs of walk(path.join(root, c)).sort()) {
      const text = fs.readFileSync(abs, 'utf8');
      const updated = updatedOf(text);
      if (updated === undefined || unpublished(text)) continue;
      docs[path.relative(root, abs).split(path.sep).join('/')] = { updated };
    }
  }
  return docs;
}

/** The galleries the documents name, each with its photographs' slugs in book order. */
export function photosOf(manifestsDir, galleries) {
  const out = {};
  for (const g of [...galleries].sort()) {
    const file = path.join(manifestsDir, `${galleryKey(g)}.json`);
    out[g] = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')).photos || []).map((p) => p.slug) : [];
  }
  return out;
}

/**
 * A booked manifest (photos:fetch's) holding only `slugs`. Unchanged when it holds nothing else; else
 * the book (rows, cover, colophon, lightbox, colour) is worked out again from the photographs kept,
 * as lib/book.mjs bookOf works it out: each photograph's own layer is already there and stays.
 */
export function narrowBook(merged, slugs) {
  const keep = new Set(slugs);
  const photos = (merged.photos || []).filter((p) => keep.has(p.slug));
  if (photos.length === (merged.photos || []).length) return merged;
  const { photos: tinted, colour } = colourOf(photos);
  return {
    ...merged,
    photos: tinted,
    count: tinted.length,
    inventory: (merged.inventory || []).filter((p) => keep.has(p.slug)),
    book: { rows: bookRows(tinted), cover: coverIndex(tinted, merged.cover?.photo), colophon: colophonOf(tinted), lightbox: lightboxOf(tinted), colour },
  };
}

/** Pinned photographs the local manifests lack: [gallery, slug] each. */
export function missingOf(pin, books) {
  const missing = [];
  for (const [g, slugs] of Object.entries(pin.photos)) {
    const have = new Set((books[g]?.photos || []).map((p) => p.slug));
    for (const s of slugs) if (!have.has(s)) missing.push([g, s]);
  }
  return missing;
}

/** The files of a frozen manifests folder, by name, from the pin and the live merged manifests. */
export function frozenFiles(pin, live, ridgway) {
  const names = Object.keys(pin.photos).sort();
  const books = names.filter((g) => live[galleryKey(g)]).map((g) => narrowBook(live[galleryKey(g)], pin.photos[g]));
  const files = {};
  for (const b of books) files[galleryKey(b.gallery)] = b;
  const pinned = new Set(names);
  files._covers = Object.fromEntries(Object.entries(live._covers || {}).filter(([, c]) => pinned.has(c.gallery)));
  const index = live._index || {};
  files._index = { ...index, galleries: Object.fromEntries(books.map((b) => [b.gallery, { ...(index.galleries?.[b.gallery] || {}), count: b.count }])) };
  // Across voyages: from the pinned books alone, kindred frames included (lib/atlas.mjs kindredOf),
  // so a photograph added since cannot become another's nearest.
  const kindred = kindredOf(books.flatMap((b) => b.photos.filter((p) => p.hash && p.palette).map((p) => ({ hash: p.hash, gallery: b.gallery, palette: p.palette }))));
  const atlas = atlasOf(books, kindred);
  const across = { 'colour-atlas': atlas, 'reverie-picks': picksOf(atlas, ridgway), palettes: palettesOf(books), frames: framesOf(books) };
  for (const [name, data] of Object.entries(across)) if (data) files[name] = data;
  return files;
}

function readManifests(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) out[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
}

function pin() {
  const docs = docsOf();
  const { referencedGalleries } = require('./check-gallery-integrity.js');
  const manifests = path.join(ROOT, '_data', 'photo_manifests');
  if (!fs.existsSync(path.join(manifests, '_index.json'))) {
    console.error('No merged manifests here: run npm run photos:fetch first, so the pin names the photographs.');
    return 2;
  }
  const photos = photosOf(manifests, referencedGalleries().keys());
  // To the minute, so the clock reads as a time someone pinned, not a build's.
  const time = `${new Date().toISOString().slice(0, 16)}:00Z`;
  fs.writeFileSync(path.join(ROOT, PIN_FILE), `${JSON.stringify({ time, docs, photos }, null, 1)}\n`);
  const n = Object.values(photos).reduce((s, l) => s + l.length, 0);
  console.log(`Pinned ${Object.keys(docs).length} documents and ${n} photographs in ${Object.keys(photos).length} galleries: ${PIN_FILE}`);
  return 0;
}

function freeze() {
  const pinFile = path.join(ROOT, PIN_FILE);
  if (!fs.existsSync(pinFile)) {
    console.error(`No ${PIN_FILE}: run node scripts/visual-content.mjs pin.`);
    return 2;
  }
  const pinned = JSON.parse(fs.readFileSync(pinFile, 'utf8'));
  const live = readManifests(path.join(ROOT, '_data', 'photo_manifests'));
  const out = path.join(ROOT, FROZEN_DIR);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  if (!live._index) {
    console.error('visual-content: no merged manifests here, so no pinned photograph can be drawn. Run npm run photos:fetch first.');
    return 1;
  }
  // A pinned photograph gone from its book (unlisted, moved to another voyage, a stale fetch): the
  // rest is drawn as pinned and only that book's shots move, so they alone are re-captured, as for a
  // changed caption. Stopping here would force a re-pin, and with it every page added since.
  const books = Object.fromEntries(Object.keys(pinned.photos).map((g) => [g, live[galleryKey(g)]]));
  const missing = missingOf(pinned, books);
  if (missing.length) {
    console.log(`visual-content: ${missing.length} pinned photograph(s) are not in the local manifests (${missing.slice(0, 5).map(([g, s]) => `${g}/${s}`).join(', ')}${missing.length > 5 ? ', …' : ''}): their books' shots will differ.`);
    console.log('If photos:fetch has not run since they were added, run it; if they left on purpose, re-capture those pages.');
  }
  const ridgway = JSON.parse(fs.readFileSync(path.join(ROOT, '_data', 'ridgway.json'), 'utf8'));
  const files = frozenFiles(pinned, live, ridgway);
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(out, `${name}.json`), `${JSON.stringify(data)}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const run = { pin, freeze }[command];
  if (!run) {
    console.error('Usage: node scripts/visual-content.mjs <pin|freeze>');
    process.exit(2);
  }
  process.exit(run());
}
