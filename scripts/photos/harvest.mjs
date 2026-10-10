#!/usr/bin/env node
/**
 * From the album to the site. The owner gathers the photographs they want
 * published in one Apple Photos album (Voyage-of-QSDQSB); this brings them in.
 *
 *   look    list the album; export each new photo as edited (the owner's crop)
 *           and give it back its camera record from the same item's original;
 *           name its place; propose the voyage it belongs to. Writes the plan
 *           and a thumbnail of each, for the session and the command centre
 *   set     a destination decided by judgement or by the owner: a voyage's
 *           gallery, a new gallery, or `hold` (stays in the album for now)
 *   go      the owner's yes, as the command centre stored it: valid only for the
 *           exact set it was given on (the plan's hash), and used once
 *   bring   with a go: pull each voyage whole from R2 (locate needs the full set),
 *           then photos:ingest from the plan's own inbox: import, locate, check,
 *           push. Then each photo now in the bucket gets the keyword
 *           `qsdqsb: <gallery>` in Photos and its voyage's `updated:` moves to now
 *
 * Photos is reached only through the album (lib/apple-photos.mjs: albumItems,
 * exportFromAlbum, tagInAlbum): nothing outside it is listed, searched or
 * exported, and enrich, which searches the whole library, is skipped, since
 * look has already restored each record from the album item itself.
 *
 * Nothing leaves the album by script: Photos' scripting cannot remove an item
 * from an album. A tagged or published photo is skipped on every later run,
 * and once the whole album is on the site, the owner empties it in one go.
 *
 * Files: .photos-local/harvest/ (gitignored): plan.json, go.json, last.json,
 * export/ (edited, enriched), thumbs/, inbox/ (what ingest takes).
 *
 * Usage: npm run photos:harvest [-- look] [--album <name>]
 *        npm run photos:harvest -- set <frame|id> <gallery|hold> [--why "<reason>"] [--by claude|owner]
 *        npm run photos:harvest -- go '<json>' | --file <path>     {"hash": "…", "destinations": {"DSCF7548": "japan/kyoto"}}
 *        npm run photos:harvest -- bring
 * The album name defaults to PHOTOS_ALBUM, else Voyage-of-QSDQSB.
 * Exit codes: 0 done · 1 refused or partly failed · 2 usage or setup
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'js-yaml';
import { PATHS, ROOT, parseArgs } from './lib/config.mjs';
import { readMerged, readHeadExif, originalsBucket } from './lib/inventory.mjs';
import { frameFromName } from './lib/slug.mjs';
import { albumItems, exportFromAlbum, tagInAlbum } from './lib/apple-photos.mjs';
import { locate } from './lib/reverse-geocode.mjs';
import { transplant } from './enrich.mjs';
import { HOLD, attribute, keywordFor, planHash, siteIndex, validGallery, voyageGalleries } from './lib/harvest.mjs';

export const ALBUM = process.env.PHOTOS_ALBUM || 'Voyage-of-QSDQSB';
export const DIR = path.join(PATHS.localStore, 'harvest');
const at = (...p) => path.join(DIR, ...p);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const writeJSON = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 1) + '\n'); };
const safe = (id) => id.replace(/[^A-Za-z0-9-]/g, '_');
const places = (g) => { try { return yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'photo_locations', `${g}.yml`), 'utf8')); } catch { return null; } };
const exif = (file, tags) => {
  const r = spawnSync('exiftool', ['-j', '-n', ...tags.map((t) => `-${t}`), file], { encoding: 'utf8' });
  try { return JSON.parse(r.stdout)[0] || {}; } catch { return {}; }
};
const hasMakerNotes = (file) => { const x = exif(file, ['FilmMode', 'ImageCount']); return x.ImageCount != null || x.FilmMode != null; };
const nowStamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

/** The one exported file in an item's folder, or null. */
const exported = (kind, id) => {
  const dir = at(kind, safe(id));
  const f = fs.existsSync(dir) && fs.readdirSync(dir).find((n) => !n.startsWith('.'));
  return f ? path.join(dir, f) : null;
};

/** Export one item as edited, and restore its camera record from the same item's original. */
async function exportOne(album, item, log) {
  const dir = at('export', safe(item.id)), odir = at('original', safe(item.id));
  for (const d of [dir, odir]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  exportFromAlbum(album, [item.id], dir);
  const file = exported('export', item.id);
  if (!file) throw new Error('Photos exported nothing');
  const x = await readHeadExif(file).catch(() => null);
  if (x?.camera && /FUJIFILM/i.test(x.camera) && !hasMakerNotes(file)) {
    exportFromAlbum(album, [item.id], odir, { originals: true });
    const orig = exported('original', item.id);
    if (orig) {
      const before = fs.readFileSync(file), size = await sharp(file).metadata();
      try {
        transplant(orig, file);
        const after = await sharp(file).metadata();
        if (after.width !== size.width || after.height !== size.height || !hasMakerNotes(file)) throw new Error('the result changed shape or lacks maker notes');
      } catch (e) { fs.writeFileSync(file, before); log(`  ${item.filename}: camera record not restored (${e.message})`); }
    }
    fs.rmSync(odir, { recursive: true, force: true });
  }
  const thumb = at('thumbs', `${safe(item.id)}.jpg`);
  fs.mkdirSync(path.dirname(thumb), { recursive: true });
  await sharp(file).rotate().resize(480, 480, { fit: 'inside' }).jpeg({ quality: 72 }).toFile(thumb); // no metadata: no GPS
  return file;
}

async function look(args) {
  const album = String(args.album || ALBUM);
  const log = (m) => console.log(m);
  const items = albumItems(album);
  const old = readJSON(at('plan.json'));
  const prior = new Map((old?.album === album ? old.items : []).map((i) => [i.id, i]));
  const voyages = voyageGalleries(ROOT);
  const index = siteIndex(voyages, { readMerged, places });
  const out = [];
  for (const it of items) {
    const frame = (frameFromName(it.filename) || path.parse(it.filename).name).toUpperCase();
    const tagged = it.keywords.find((k) => k.startsWith('qsdqsb: '));
    const was = prior.get(it.id);
    const base = { id: it.id, file: it.filename, frame, photosDate: it.date, w: it.w, h: it.h };
    if (tagged) { out.push({ ...base, taken: was?.taken || null, status: 'on-site', gallery: tagged.slice(8), confidence: 'sure', why: 'tagged in Photos' }); continue; }
    let file = exported('export', it.id);
    if (!file) {
      if (args['no-export']) { out.push({ ...base, status: 'waiting', gallery: null, confidence: 'open', why: 'not exported yet' }); continue; }
      log(`exporting ${it.filename}…`);
      try { file = await exportOne(album, it, log); } catch (e) { out.push({ ...base, status: 'failed', gallery: null, confidence: 'open', why: `export failed: ${e.message.split('\n')[0].slice(0, 120)}` }); continue; }
    }
    const x = await readHeadExif(file).catch(() => null);
    const taken = x?.taken || it.date;
    let place = was?.place || null;
    if (!place && it.lat != null && it.lng != null) {
      try { const p = await locate(it.lat, it.lng); place = { landmark: p.landmark, city: p.city, country: p.country }; } catch { /* asked again next run */ }
    }
    const proposal = attribute({ frame, taken, city: place?.city, country: place?.country }, index);
    const row = { ...base, taken, camera: x?.camera || null, place, ...proposal };
    // A destination decided by judgement or by the owner outlives a re-look; the evidence is fresh.
    if (was?.decided && proposal.status === 'waiting') Object.assign(row, { gallery: was.gallery, decided: was.decided, confidence: 'decided', why: was.decidedWhy || row.why, proposed: proposal.gallery });
    out.push(row);
  }
  // Exports of items that have left the album are no longer needed.
  const live = new Set(items.map((i) => safe(i.id)));
  for (const kind of ['export', 'original']) for (const d of (fs.existsSync(at(kind)) ? fs.readdirSync(at(kind)) : [])) if (!live.has(d)) fs.rmSync(at(kind, d), { recursive: true, force: true });
  for (const f of (fs.existsSync(at('thumbs')) ? fs.readdirSync(at('thumbs')) : [])) if (!live.has(f.replace(/\.jpg$/, ''))) fs.rmSync(at('thumbs', f));
  const plan = { album, looked: new Date().toISOString(), voyages: voyages.map((v) => v.gallery), items: out };
  plan.hash = planHash(out);
  writeJSON(at('plan.json'), plan);
  if (old?.hash !== plan.hash) fs.rmSync(at('go.json'), { force: true });
  report(plan);
  return 0;
}

function report(plan) {
  const waiting = plan.items.filter((i) => i.status === 'waiting');
  console.log(`\n${plan.album}: ${plan.items.length} photo(s), ${waiting.length} waiting · plan ${plan.hash}`);
  for (const i of plan.items) {
    const where = [i.place?.landmark, i.place?.city, i.place?.country].filter(Boolean).join(', ');
    console.log(`  ${i.frame.padEnd(9)} ${String(i.taken || '').slice(0, 16).padEnd(16)} ${i.status.padEnd(8)} ${(i.gallery || '?').padEnd(28)} ${i.confidence.padEnd(8)} ${where}\n${' '.repeat(12)}${i.why}`);
  }
  const open = waiting.filter((i) => !i.gallery);
  if (open.length) console.log(`\n${open.length} open: decide each with  npm run photos:harvest -- set <frame> <gallery|hold> --why "…"`);
  if (plan.items.length && plan.items.every((i) => i.status === 'on-site')) console.log(`\nEvery photo in ${plan.album} is on the site. Empty the album: open it in Photos, ⌘A, then Delete (⌫) → Remove from Album. Not ⌘⌫, which deletes from the library.`);
}

function set(args) {
  const plan = readJSON(at('plan.json'));
  if (!plan) { console.error('No plan yet: npm run photos:harvest first.'); return 2; }
  const [who, dest] = args._.slice(1);
  if (!who || !dest) { console.error('usage: photos:harvest -- set <frame|id> <gallery|hold> [--why "…"]'); return 2; }
  const hits = plan.items.filter((i) => i.id === who || i.frame === who.toUpperCase());
  if (hits.length !== 1) { console.error(hits.length ? `${who} names ${hits.length} photos; use the id` : `${who} is not in the plan`); return 1; }
  const item = hits[0];
  if (item.status !== 'waiting') { console.error(`${item.frame} is ${item.status}; nothing to set`); return 1; }
  if (dest !== HOLD && !validGallery(dest)) { console.error(`"${dest}" is not a gallery name (lower-case words with hyphens, a part after a slash)`); return 2; }
  if (dest !== HOLD && !plan.voyages.includes(dest)) console.log(`${dest} is a new gallery: its voyage page comes as a pull request (voyage-scaffolder).`);
  Object.assign(item, { gallery: dest, decided: String(args.by || 'claude'), decidedWhy: args.why ? String(args.why) : null, confidence: 'decided', why: args.why ? String(args.why) : item.why });
  plan.hash = planHash(plan.items);
  writeJSON(at('plan.json'), plan);
  fs.rmSync(at('go.json'), { force: true });
  console.log(`${item.frame} → ${dest} · plan ${plan.hash}`);
  return 0;
}

/** The owner's yes from the command centre: for the plan they saw, with any destinations they changed. */
function go(args) {
  const plan = readJSON(at('plan.json'));
  if (!plan) { console.error('No plan: nothing to say yes to.'); return 2; }
  const raw = args.file ? fs.readFileSync(String(args.file), 'utf8') : args._[1];
  let doc; try { doc = JSON.parse(raw); } catch { console.error('The go is not JSON.'); return 2; }
  if (doc.hash !== plan.hash) { console.error(`This go was given on plan ${doc.hash}; the plan is now ${plan.hash}. Republish the command centre and ask again.`); return 1; }
  for (const [who, dest] of Object.entries(doc.destinations || {})) {
    const item = plan.items.find((i) => i.status === 'waiting' && (i.id === who || i.frame === who.toUpperCase()));
    if (!item) { console.error(`${who} is not waiting in the plan`); return 1; }
    if (dest !== HOLD && !validGallery(dest)) { console.error(`"${dest}" is not a gallery name`); return 1; }
    if (dest !== item.gallery) Object.assign(item, { gallery: dest, decided: 'owner', decidedWhy: 'the owner chose it', confidence: 'decided' });
  }
  const open = plan.items.filter((i) => i.status === 'waiting' && !i.gallery);
  if (open.length) { console.error(`Still open: ${open.map((i) => i.frame).join(', ')}. Each needs a voyage or hold.`); return 1; }
  plan.hash = planHash(plan.items);
  writeJSON(at('plan.json'), plan);
  const bringing = plan.items.filter((i) => i.status === 'waiting' && i.gallery !== HOLD);
  writeJSON(at('go.json'), { hash: plan.hash, album: plan.album, at: doc.at || new Date().toISOString(), galleries: [...new Set(bringing.map((i) => i.gallery))].sort(), photos: bringing.map((i) => i.frame) });
  console.log(`Go recorded for ${bringing.length} photo(s) → ${[...new Set(bringing.map((i) => i.gallery))].join(', ')} · plan ${plan.hash}`);
  return 0;
}

/** Set a voyage page's `updated:` to now: the parent's for a part, since the board reads _voyage/ only. */
function touchVoyage(gallery) {
  const parent = gallery.split('/')[0];
  const page = [path.join(ROOT, '_voyage', `${parent}.md`)].find((f) => fs.existsSync(f));
  if (!page) return null;
  const text = fs.readFileSync(page, 'utf8');
  const stamp = nowStamp();
  const next = /^updated:.*$/m.test(text.split(/\n---/)[0])
    ? text.replace(/^updated:[^#\n]*(#.*)?$/m, (_, c) => `updated: ${stamp}${c ? `  ${c}` : ''}`)
    : text.replace(/^(date:.*)$/m, `$1\nupdated: ${stamp}  # its photographs last changed: how Recent Updates ranks it`);
  fs.writeFileSync(page, next);
  return path.relative(ROOT, page);
}

async function bring() {
  const plan = readJSON(at('plan.json')), yes = readJSON(at('go.json'));
  if (!plan) { console.error('No plan: npm run photos:harvest first.'); return 2; }
  if (!yes || yes.hash !== plan.hash || yes.album !== plan.album) { console.error('No go for this plan. The owner says yes on the command centre (Bring them in); then photos:harvest -- go records it.'); return 1; }
  const { bucket, why } = originalsBucket();
  if (!bucket) { console.error(`${why}: the voyages cannot be pulled whole, so nothing is brought in.`); return 2; }
  const bringing = plan.items.filter((i) => i.status === 'waiting' && i.gallery && i.gallery !== HOLD);
  fs.rmSync(at('inbox'), { recursive: true, force: true });
  for (const i of bringing) {
    const file = exported('export', i.id);
    if (!file) { console.error(`${i.frame}: its export is gone; run look again`); return 1; }
    const dest = at('inbox', ...i.gallery.split('/'), i.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }
  const galleries = [...new Set(bringing.map((i) => i.gallery))].sort();
  const known = new Set(plan.voyages);
  for (const g of galleries.filter((g) => known.has(g))) {
    console.log(`── pull ${g} whole, so its places are kept`);
    if (spawnSync(process.execPath, [path.join(HERE, 'pull.mjs'), '--gallery', g], { stdio: 'inherit' }).status !== 0) { console.error(`pull of ${g} failed; nothing brought in`); return 1; }
  }
  const fresh = galleries.filter((g) => !known.has(g)).flatMap((g) => ['--new-gallery', g]);
  const ingest = spawnSync(process.execPath, [path.join(HERE, 'ingest.mjs'), '--from', at('inbox'), '--skip-enrich', '--go', at('go.json'), ...fresh], { stdio: 'inherit' });

  // What reached the bucket is on its way to the site, whatever ingest said about the rest.
  const done = [];
  for (const g of galleries) {
    const r = spawnSync('rclone', ['lsf', '--files-only', `${bucket}/${g}`], { encoding: 'utf8' });
    const there = new Set((r.stdout || '').split('\n').map((f) => (frameFromName(f) || '').toUpperCase()).filter(Boolean));
    const arrived = bringing.filter((i) => i.gallery === g && there.has(i.frame));
    if (!arrived.length) continue;
    try { tagInAlbum(plan.album, arrived.map((i) => i.id), keywordFor(g)); } catch (e) { console.error(`tagging in Photos failed (${e.message.split('\n')[0]}); the next look finds them on the site anyway`); }
    const page = touchVoyage(g);
    for (const i of arrived) { i.status = 'on-site'; i.why = `brought in ${new Date().toISOString().slice(0, 10)}`; }
    done.push({ gallery: g, page, photos: arrived.map((i) => i.frame) });
  }
  plan.hash = planHash(plan.items);
  writeJSON(at('plan.json'), plan);
  fs.rmSync(at('go.json'), { force: true });
  writeJSON(at('last.json'), { at: new Date().toISOString(), album: plan.album, done, held: plan.items.filter((i) => i.status === 'waiting').map((i) => ({ frame: i.frame, gallery: i.gallery })) });
  console.log(`\n${done.reduce((n, d) => n + d.photos.length, 0)} of ${bringing.length} photo(s) reached the bucket: ${done.map((d) => `${d.gallery} (${d.photos.join(', ')})`).join('; ') || 'none'}.`);
  if (done.length) console.log(`Voyage pages to commit (updated:): ${[...new Set(done.map((d) => d.page).filter(Boolean))].join(', ')}`);
  report(plan);
  return ingest.status === 0 && done.length === galleries.length ? 0 : 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'look';
  if (spawnSync('exiftool', ['-ver']).status !== 0) { console.error('exiftool is not installed: brew install exiftool'); return 2; }
  if (cmd === 'look') return look(args);
  if (cmd === 'set') return set(args);
  if (cmd === 'go') return go(args);
  if (cmd === 'bring') return bring();
  console.error(`Unknown command "${cmd}". See the head of scripts/photos/harvest.mjs.`);
  return 2;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then((c) => process.exit(c), (e) => { console.error(e.stack || e); process.exit(2); });
