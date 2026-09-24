#!/usr/bin/env node
/**
 * The processor. Runs in GitHub Actions against R2, or anywhere against a
 * directory with `--local`. For every original in the originals bucket:
 *
 *   1. skip it when the public manifest already carries this exact file
 *      (same etag + size), unless --force
 *   2. read EXIF, orient, measure, thumbhash, dominant colour
 *   3. render every public tier and upload it
 *   4. record the photo in <gallery>/manifest.json (public, no GPS; the sun
 *      at the moment of the frame, worked out at city precision) and
 *      <gallery>/.private.json (originals bucket, GPS + full EXIF)
 *
 * Tiers whose original has disappeared are deleted and dropped from the
 * manifest. When anything changed and CF_PAGES_DEPLOY_HOOK is set, the site
 * is asked to rebuild.
 *
 * Usage:
 *   node scripts/photos/process.mjs [--gallery <name>]… [--force] [--dry-run]
 *                                   [--local [dir]] [--no-avif] [--concurrency 2] [--gc]
 *   PHOTOS_GALLERIES='["london","prague/twilight"]'   same as repeated --gallery
 *
 * Exit codes: 0 ok, 1 one or more photos failed, 2 environment problem.
 */

import path from 'node:path';
import crypto from 'node:crypto';
import { readCamera, closeCamera } from './lib/camera.mjs';
import { env, ROOT, PATHS, ORIGINAL_RE, IGNORED_PREFIXES, MANIFEST_FILE, PRIVATE_FILE, MANIFEST_VERSION, FORMATS, BOOTSTRAP_STAMP, parseArgs } from './lib/config.mjs';
import { storesFrom } from './lib/store.mjs';
import { readExif } from './lib/exif.mjs';
import { assignSlugs } from './lib/slug.mjs';
import { analyse, renderTiers } from './lib/tiers.mjs';
import { emptyManifest, sortPhotos } from './lib/manifest.mjs';
import { lightGallery } from './lib/sun.mjs';
import { galleryPlaces } from './lib/places.mjs';

const args = parseArgs(process.argv.slice(2), { multi: ['gallery'] });
const DRY = !!args['dry-run'];
const FORCE = !!args.force;
const CONCURRENCY = Math.max(1, Number(args.concurrency) || 2);
const formats = Object.keys(FORMATS).filter(f => f !== 'avif' || (env.avif && !args['no-avif']));
const placeOf = galleryPlaces(ROOT);
const galleryFilter = new Set([...(args.gallery || []), ...(safeJson(process.env.PHOTOS_GALLERIES) || [])].map(String));

function safeJson(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
const log = (...a) => console.log(...a);
const isOriginal = (key) => ORIGINAL_RE.test(key) && !IGNORED_PREFIXES.some(p => key.startsWith(p)) && !key.split('/').some(seg => seg.startsWith('.'));

async function main() {
  let stores;
  try { stores = storesFrom(args, { ...env, localStoreDefault: PATHS.localStore }); }
  catch (e) { console.error(e.message); return 2; }
  const { originals, pub } = stores;
  log(`processor: ${stores.local ? `local store ${stores.local}` : `R2 ${env.originalsBucket} → ${env.publicBucket}`}${DRY ? ' (dry run)' : ''}${FORCE ? ' (force)' : ''}, formats ${formats.join('/')}`);

  const objects = (await originals.list('')).filter(o => isOriginal(o.key));
  const byGallery = new Map();
  for (const o of objects) {
    const gallery = path.posix.dirname(o.key);
    if (gallery === '.') { log(`  skip ${o.key}: originals must sit inside a gallery folder`); continue; }
    if (galleryFilter.size && !galleryFilter.has(gallery)) continue;
    if (!byGallery.has(gallery)) byGallery.set(gallery, []);
    byGallery.get(gallery).push(o);
  }
  // A gallery named in the filter with no originals left still needs its manifest reconciled.
  for (const g of galleryFilter) if (!byGallery.has(g)) byGallery.set(g, []);

  let changed = 0, failed = 0, skipped = 0, removed = 0, lit = 0;
  for (const [gallery, files] of [...byGallery].sort()) {
    const r = await processGallery(gallery, files, { originals, pub });
    changed += r.changed; failed += r.failed; skipped += r.skipped; removed += r.removed; lit += r.lit;
  }

  await closeCamera();
  log(`\ndone: ${changed} processed, ${skipped} unchanged, ${removed} removed, ${failed} failed, ${lit} given their sun across ${byGallery.size} galleries`);
  if (args.gc) await collectGarbage(pub);
  if (changed + removed + lit > 0 && env.deployHook && !DRY) {
    const r = await fetch(env.deployHook, { method: 'POST' });
    log(`deploy hook: ${r.status}`);
  }
  return failed ? 1 : 0;
}

async function processGallery(gallery, files, { originals, pub }) {
  const manifestKey = `${gallery}/${MANIFEST_FILE}`, privateKey = `${gallery}/${PRIVATE_FILE}`;
  const manifest = (await pub.getJson(manifestKey)) || emptyManifest(gallery);
  const priv = (await originals.getJson(privateKey)) || { gallery, photos: {} };
  const bySlug = new Map(manifest.photos.map(p => [p.slug, p]));
  const { slugs, warnings } = assignSlugs(files.map(f => path.posix.basename(f.key)));
  for (const w of warnings) log(`  ${gallery}: ${w}`);
  const fileMeta = new Map(files.map(f => [path.posix.basename(f.key), f]));

  let changed = 0, failed = 0, skipped = 0, removed = 0;
  const queue = [...slugs];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const { file, slug } = item; const meta = fileMeta.get(file);
      const version = `${meta.etag}:${meta.size}`;
      const existing = bySlug.get(slug);
      // Entries from before content-addressed tiers (no hash) are re-rendered once into t/<hash>/.
      if (existing && existing.hash && existing.version === version && existing.formats?.join() === formats.join() && !FORCE) {
        skipped++; continue;
      }
      log(`  ${gallery}/${file} → ${slug}${existing ? ' (changed)' : ''}`);
      if (DRY) { changed++; continue; }
      try {
        const buf = await originals.get(meta.key);
        // Tiers live under the original's content hash: a new original is a new URL, so
        // `immutable` caching is true by construction and never serves a replaced picture.
        const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
        const [exif, facts, cam] = await Promise.all([readExif(buf), analyse(buf), readCamera(buf).catch(e => { log(`  ${gallery}/${file}: camera record unreadable (${e.message})`); return null; })]);
        const tiers = await renderTiers(buf, { formats, longEdge: Math.max(facts.w, facts.h) });
        await runLimited(tiers.map(t => () => pub.put(`t/${hash}/${t.name}`, t.buffer)), 6);
        // Legacy <gallery>/<slug>/ tiers go once their photo is re-rendered; hash tiers are only
        // ever removed by --gc, since another gallery may share the same original.
        const stale = existing && !existing.hash ? tierKeys(gallery, existing) : [];
        if (stale.length) await pub.del(stale);

        const sizes = {}; for (const t of tiers) (sizes[t.format] = sizes[t.format] || []).push(t.size);
        for (const k of Object.keys(sizes)) sizes[k].sort((a, b) => a - b);
        bySlug.set(slug, {
          slug, file, key: meta.key, hash, frame: path.parse(file).name.toUpperCase(),
          version, w: facts.w, h: facts.h, ratio: +(facts.w / facts.h).toFixed(4),
          taken: exif.taken, camera: exif.camera, lens: exif.lens, focal: exif.focal, focal35: exif.focal35,
          aperture: exif.aperture, shutter: exif.shutter, iso: exif.iso, exposureBias: exif.exposureBias,
          ...(cam ? cam.pub : {}),
          thumbhash: facts.thumbhash, tint: facts.tint, sizes, formats, processed: new Date().toISOString(),
          ...(exif.software === BOOTSTRAP_STAMP ? { compressed: true } : {}),
        });
        priv.photos[slug] = {
          file, key: meta.key, hash, version, gps: exif.gps,
          shutterCount: cam?.priv.shutterCount ?? null,
          exif: cam?.priv.all || exif.raw,
        };
        changed++;
      } catch (e) {
        failed++; log(`  FAILED ${gallery}/${file}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Garbage-collect photos whose original is gone.
  const live = new Set(slugs.map(s => s.slug));
  for (const [slug, p] of bySlug) {
    if (live.has(slug)) continue;
    log(`  ${gallery}/${slug}: original gone, removing ${p.file}'s tiers`);
    if (!DRY && !p.hash) await pub.del(tierKeys(gallery, p));
    bySlug.delete(slug); delete priv.photos[slug]; removed++;
  }

  // The sun, once per photo, from the original's GPS or the gallery's point on the atlas:
  // no download, no render, so photos processed before it was kept get it on the next run.
  const lit = lightGallery([...bySlug.values()], (slug) => priv.photos[slug]?.gps, placeOf(gallery));

  if ((changed || removed || lit) && !DRY) {
    const photos = sortPhotos([...bySlug.values()]);
    await pub.putJson(manifestKey, { version: MANIFEST_VERSION, gallery, generated: new Date().toISOString(), photos });
    await originals.putJson(privateKey, { gallery, generated: new Date().toISOString(), photos: priv.photos });
  }
  if (changed || removed || failed || lit) log(`  ${gallery}: ${changed} processed, ${skipped} unchanged, ${removed} removed, ${failed} failed${lit ? `, ${lit} given their sun` : ''}`);
  return { changed, failed, skipped, removed, lit };
}

/**
 * Delete tiers under t/<hash>/ that no gallery's manifest references any
 * more (an original replaced or removed). Runs only with --gc, after every
 * manifest is written, because one original may be shared by galleries.
 */
async function collectGarbage(pub) {
  const all = await pub.list('');
  const refs = new Set();
  for (const o of all.filter(o => o.key.endsWith('/' + MANIFEST_FILE))) {
    for (const p of (await pub.getJson(o.key))?.photos || []) if (p.hash) refs.add(p.hash);
  }
  const dead = all.filter(o => o.key.startsWith('t/') && !refs.has(o.key.split('/')[1])).map(o => o.key);
  log(`gc: ${refs.size} referenced originals; ${dead.length} unreferenced tier file(s)${DRY ? ' (dry run, kept)' : ' deleted'}`);
  if (dead.length && !DRY) await pub.del(dead);
}

/** Legacy tier keys (<gallery>/<slug>/<size>.<fmt>), for entries rendered before content addressing. */
function tierKeys(gallery, p) {
  const out = [];
  for (const [fmt, sizes] of Object.entries(p.sizes || {})) for (const s of sizes) out.push(`${gallery}/${p.slug}/${s}.${fmt}`);
  return out;
}
async function runLimited(fns, limit) {
  const q = [...fns];
  await Promise.all(Array.from({ length: limit }, async () => { for (let f = q.shift(); f; f = q.shift()) await f(); }));
}

main().then(code => process.exit(code), err => { console.error(err); process.exit(2); });
