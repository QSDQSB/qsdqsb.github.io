#!/usr/bin/env node
/**
 * One-time bootstrap: turn today's gallery/ tree into the photos/ tree the
 * pipeline expects, without touching gallery/ itself.
 *
 * For every gallery/<g>/<legacy name>.jpg:
 *   - photos/<g>/<FRAME>.jpg        bytes copied unchanged, except that the
 *                                   exposure encoded in the legacy filename
 *                                   is written into real EXIF (lossless)
 *   - _data/photos/<g>.yml          caption per slug from the legacy place
 *                                   text (created only when absent, unless --force)
 *   - photos/<g>/.bootstrap-map.json  legacy name ↔ new name, for tracing
 *
 * Re-collected originals later overwrite photos/<g>/<FRAME>.jpg with the
 * camera file; the slug and the YAML survive.
 *
 * Usage: npm run photos:bootstrap [-- --gallery london] [--dry-run] [--force] [--no-exif] [--yaml-only]
 *
 * --yaml-only writes the authored skeletons and nothing under photos/, so
 * the captions can be committed before the originals are ever copied.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { PATHS, ORIGINAL_RE, parseArgs } from './lib/config.mjs';
import { parseLegacyName, slugFor } from './lib/slug.mjs';
import { injectExif } from './lib/exif-write.mjs';

const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];
const YAML_ONLY = !!args['yaml-only'];

function galleries(root) {
  const out = [];
  const visit = (abs, rel) => {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    const files = entries.filter(e => e.isFile() && ORIGINAL_RE.test(e.name)).map(e => e.name).sort();
    if (files.length) out.push({ gallery: rel, files });
    for (const d of entries.filter(e => e.isDirectory())) visit(path.join(abs, d.name), rel ? `${rel}/${d.name}` : d.name);
  };
  for (const e of fs.readdirSync(root, { withFileTypes: true })) if (e.isDirectory()) visit(path.join(root, e.name), e.name);
  return out;
}

function main() {
  if (!fs.existsSync(PATHS.legacyGallery)) { console.error(`no ${PATHS.legacyGallery}; nothing to bootstrap`); return 2; }
  const filter = args.gallery ? String(args.gallery).replace(/^\/+|\/+$/g, '') : null;
  let files = 0, captions = 0, exifs = 0, yamls = 0;

  for (const { gallery, files: names } of galleries(PATHS.legacyGallery)) {
    if (filter && gallery !== filter && !gallery.startsWith(`${filter}/`)) continue;
    const destDir = path.join(PATHS.photosDir, ...gallery.split('/'));
    const map = []; const used = new Set(); const authored = {};

    for (const name of names) {
      const legacy = parseLegacyName(name);
      const ext = path.extname(name).toLowerCase().replace('.jpeg', '.jpg');
      const base = legacy.frame || slugFor(name).toUpperCase();
      let dest = `${base}${ext}`, n = 1;
      while (used.has(dest.toLowerCase())) dest = `${base}-${++n}${ext}`;
      used.add(dest.toLowerCase());
      const slug = slugFor(dest);
      map.push({ from: name, to: dest, slug, place: legacy.place });
      if (legacy.place) { authored[slug] = { caption: legacy.place }; captions++; }
      files++;
      if (DRY || YAML_ONLY) continue;

      fs.mkdirSync(destDir, { recursive: true });
      let buf = fs.readFileSync(path.join(PATHS.legacyGallery, ...gallery.split('/'), name));
      const hasExposure = legacy.aperture || legacy.shutter || legacy.iso || legacy.lens;
      if (hasExposure && ext === '.jpg' && !args['no-exif']) {
        try { buf = injectExif(buf, { aperture: legacy.aperture, shutter: legacy.shutter, iso: legacy.iso, focal: legacy.focal, lens: legacy.lens }); exifs++; }
        catch (e) { console.log(`  ${gallery}/${name}: EXIF not written (${e.message})`); }
      }
      fs.writeFileSync(path.join(destDir, dest), buf);
    }

    const yml = path.join(PATHS.authoredDir, `${gallery}.yml`);
    const writeYaml = !fs.existsSync(yml) || args.force;
    console.log(`${gallery}: ${names.length} file(s)${YAML_ONLY ? '' : ` → photos/${gallery}/`}${writeYaml ? `, ${yml.replace(PATHS.authoredDir, '_data/photos')}` : ' (YAML kept)'}`);
    if (DRY) continue;
    if (!YAML_ONLY) fs.writeFileSync(path.join(destDir, '.bootstrap-map.json'), JSON.stringify(map, null, 2) + '\n');
    if (writeYaml) {
      fs.mkdirSync(path.dirname(yml), { recursive: true });
      const doc = { photos: authored };
      fs.writeFileSync(yml, `# Authored layer for gallery/${gallery} — captions, order, stories.\n# Slugs are camera frame numbers; see _docs/photos-pipeline.md.\n` + yaml.dump(doc, { lineWidth: 120, quotingType: '"' }));
      yamls++;
    }
  }
  console.log(`\n${DRY ? 'would write' : 'wrote'} ${YAML_ONLY ? `${captions} caption(s) for ${files} file(s), ${yamls} YAML file(s)` : `${files} file(s), ${exifs} with injected EXIF, ${captions} caption(s), ${yamls} YAML file(s)`}.`);
  if (!DRY && !YAML_ONLY) console.log('Next: `npm run photos:push`, then watch the processing workflow.');
  return 0;
}

process.exit(main());
