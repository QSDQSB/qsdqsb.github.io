#!/usr/bin/env node
/**
 * Audit the voyages' galleries against the photo pipeline.
 *
 * `check-frontmatter.js` answers "does this page's gallery_name resolve?".
 * This answers the set-level questions that only show up when you look at
 * both sides at once:
 *
 *   - Does every gallery_name have a processed manifest with photographs in
 *     _data/photo_manifests/_index.json (written by `npm run photos:fetch`)?
 *     Without one the Photobook renders empty.
 *   - Which galleries under photos/ (the local mirror of the originals) does
 *     no voyage or sub-voyage point at?
 *
 * Usage:
 *   node scripts/check-gallery-integrity.js
 *   node scripts/check-gallery-integrity.js --json
 *   node scripts/check-gallery-integrity.js --strict   # orphans become errors
 *
 * Exit codes:
 *   0  No errors
 *   1  Errors found
 *   2  Usage / environment problem (no manifest index yet)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIRS = ['_voyage', '_subvoyage'];

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  try {
    return yaml.load(match[1]) || {};
  } catch {
    return null;
  }
}

function walkMarkdown(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkMarkdown(full, out);
    else if (/\.(md|markdown)$/.test(e.name)) out.push(full);
  }
  return out;
}

/** Every gallery_name referenced by content, mapped to the files claiming it. */
function referencedGalleries() {
  const refs = new Map();
  for (const d of CONTENT_DIRS) {
    for (const f of walkMarkdown(path.join(ROOT, d))) {
      const fm = parseFrontMatter(fs.readFileSync(f, 'utf8'));
      const name = fm && fm.gallery_name;
      if (typeof name !== 'string' || !name) continue;
      const rel = path.relative(ROOT, f);
      if (!refs.has(name)) refs.set(name, []);
      refs.get(name).push(rel);
    }
  }
  return refs;
}

/**
 * The pipeline's view: gallery_name against the merged manifest index.
 * @param {object} index    parsed _data/photo_manifests/_index.json
 * @param {Map} refs        referencedGalleries()
 * @param {string[]} local  galleries under photos/ (orphan candidates)
 */
function auditManifests(index, refs = referencedGalleries(), local = []) {
  const findings = [];
  const add = (level, message) => findings.push({ level, message });
  const galleries = (index && index.galleries) || {};
  for (const [name, files] of refs) {
    const g = galleries[name];
    if (!g) add('error', `gallery_name "${name}" has no photo manifest — referenced by ${files.join(', ')}; run npm run photos:fetch, or push its photos`);
    else if (!g.processed) add('error', `"${name}" is not processed yet — ${files.join(', ')} will render an empty Photobook`);
    else if (!g.count) add('error', `"${name}" is processed but shows no photos (all hidden?) — ${files.join(', ')}`);
    else if (g.note) add('warn', `"${name}": ${g.note}`);
  }
  for (const name of local) {
    if (refs.has(name) || [...refs.keys()].some((r) => r.startsWith(`${name}/`))) continue;
    add('orphan', `photos/${name}/ is referenced by no voyage or sub-voyage`);
  }
  return findings;
}

function localPhotoGalleries(root = path.join(ROOT, 'photos')) {
  const out = [];
  const visit = (abs, rel) => {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && IMAGE_RE.test(e.name))) out.push(rel);
    for (const d of entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))) visit(path.join(abs, d.name), `${rel}/${d.name}`);
  };
  if (fs.existsSync(root)) for (const e of fs.readdirSync(root, { withFileTypes: true })) if (e.isDirectory() && !e.name.startsWith('.')) visit(path.join(root, e.name), e.name);
  return out;
}

function main(argv) {
  const args = argv.slice(2);
  const strict = args.includes('--strict');
  const file = path.join(ROOT, '_data', 'photo_manifests', '_index.json');
  if (!fs.existsSync(file)) { process.stderr.write(`no ${path.relative(ROOT, file)}: run npm run photos:fetch first\n`); return 2; }
  const findings = auditManifests(JSON.parse(fs.readFileSync(file, 'utf8')), referencedGalleries(), localPhotoGalleries());

  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n');
  } else if (!findings.length) {
    process.stdout.write('OK — every gallery_name has a processed photo manifest, and no orphan galleries under photos/.\n');
  } else {
    const order = { error: 0, warn: 1, orphan: 2 };
    for (const f of findings.sort((a, b) => order[a.level] - order[b.level])) {
      const tag = f.level === 'error' ? 'ERROR ' : f.level === 'warn' ? ' warn ' : 'orphan';
      process.stdout.write(`  ${tag}  ${f.message}\n`);
    }
    const n = (l) => findings.filter((f) => f.level === l).length;
    process.stdout.write(`\n${n('error')} error(s), ${n('warn')} warning(s), ${n('orphan')} orphan(s).\n`);
  }

  const failed = findings.some((f) => f.level === 'error' || (strict && f.level === 'orphan'));
  return failed ? 1 : 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { auditManifests, referencedGalleries, localPhotoGalleries, main };
