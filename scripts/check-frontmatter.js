#!/usr/bin/env node
/**
 * Validate Jekyll frontmatter against this site's collection contracts.
 *
 * Jekyll does not refuse to render a page with a missing `header` or a
 * `gallery_name` pointing nowhere — it produces an empty shell. The failure is
 * invisible in CI and surfaces only when a reader hits a broken page. That
 * makes this exactly the wrong thing to enforce by prose instruction: the
 * check is fully deterministic, so it belongs in code where it cannot be
 * forgotten, misremembered, or half-applied.
 *
 * The `frontmatter-contract-enforcer` skill interprets and remediates what
 * this reports; this script decides what is true.
 *
 * Usage:
 *   node scripts/check-frontmatter.js              # all collections
 *   node scripts/check-frontmatter.js --changed    # only files changed vs HEAD
 *   node scripts/check-frontmatter.js <path>...    # specific files
 *   node scripts/check-frontmatter.js --json       # machine-readable
 *
 * Exit codes:
 *   0  No errors (warnings allowed)
 *   1  One or more errors
 *   2  Usage / environment problem
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');

const COLLECTIONS = {
  _posts: { required: ['title', 'date'] },
  _pages: { required: ['title'] },
  _voyage: { required: ['title', 'date', 'header'] },
  _subvoyage: { required: ['title', 'date', 'header'] },
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  try {
    return yaml.load(match[1]) || {};
  } catch (err) {
    return { __parseError: err.message };
  }
}

function collectionOf(rel) {
  const top = rel.split(path.sep)[0];
  return COLLECTIONS[top] ? top : null;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|markdown|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function changedFiles() {
  let out = '';
  try {
    out = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return null;
  }
  return out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim())
    .filter((p) => collectionOf(p) && /\.(md|markdown|html)$/.test(p))
    .map((p) => path.join(ROOT, p))
    .filter((p) => fs.existsSync(p));
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** `gallery_name` must resolve to BOTH the full-image and thumbnail dirs. */
function checkGalleryName(fm, add) {
  const name = fm.gallery_name;
  if (!name) return;
  if (typeof name !== 'string') {
    add('error', `gallery_name must be a string, got ${typeof name}`);
    return;
  }
  const full = path.join(ROOT, 'gallery', name);
  const thumbs = path.join(ROOT, 'images', 'thumbnails', 'gallery', name);
  if (!fs.existsSync(full)) {
    add('error', `gallery_name "${name}" → missing gallery/${name}/`);
  }
  if (!fs.existsSync(thumbs)) {
    // Thumbnails are gitignored and regenerated, so a local miss is a warning,
    // not an error — it means "run the generator", not "the content is wrong".
    add('warn', `gallery_name "${name}" → missing images/thumbnails/gallery/${name}/ (run \`npm run generate:gallery\`)`);
  }
}

/** A voyage is either a gallery or an enumerator — never both, never neither. */
function checkVoyageMode(fm, add) {
  const hasGallery = Boolean(fm.gallery_name);
  const hasSubs = fm.subgalleries === true;
  if (hasGallery && hasSubs) {
    add('error', 'both gallery_name and subgalleries:true — these modes are mutually exclusive');
  } else if (!hasGallery && !hasSubs) {
    add('error', 'needs exactly one of gallery_name or subgalleries:true');
  }
}

/** Parent basename must equal the _subvoyage/<basename>/ folder name. */
function checkEnumeratorChildren(fm, rel, add) {
  if (fm.subgalleries !== true) return;
  const basename = path.basename(rel).replace(/\.(md|markdown|html)$/, '');
  const childDir = path.join(ROOT, '_subvoyage', basename);
  if (!fs.existsSync(childDir)) {
    add('error', `subgalleries:true but no _subvoyage/${basename}/ — enumerator will render empty`);
    return;
  }
  const children = fs.readdirSync(childDir).filter((f) => /\.(md|markdown)$/.test(f));
  if (children.length === 0) {
    add('warn', `_subvoyage/${basename}/ exists but contains no markdown children`);
  }
  const geojson = path.join(ROOT, 'assets', 'maps', `voyage-${basename}.geojson`);
  if (!fs.existsSync(geojson)) {
    add('warn', `no assets/maps/voyage-${basename}.geojson — run \`npm run geocode\` or the map renders empty`);
  }
}

/** map: shape differs by collection; a parent block without subgalleries is inert. */
function checkMap(fm, collection, add) {
  const m = fm.map;
  if (m === undefined) return;
  if (typeof m !== 'object' || m === null || Array.isArray(m)) {
    add('error', 'map: must be a mapping');
    return;
  }

  if (collection === '_voyage') {
    // A voyage-level `map:` block has TWO independent roles, and conflating
    // them is easy: `geocode-maps.js` → resolveVoyageCoords() reads
    // lat/lng/query to place this voyage on the GLOBAL atlas — valid for any
    // voyage, with or without subgalleries. Only the viewport keys are
    // subgalleries-specific, because only an enumerator renders its own map.
    const hasLat = m.lat !== undefined;
    const hasLng = m.lng !== undefined;
    if (hasLat !== hasLng) {
      add('error', 'map.lat and map.lng must be given together (geocode-maps.js throws otherwise)');
    }
    if (hasLat && hasLng && (!isNum(m.lat) || !isNum(m.lng))) {
      add('error', 'map.lat / map.lng must be numbers');
    }
    if (m.query !== undefined && typeof m.query !== 'string') {
      add('error', 'map.query must be a string');
    }

    if (m.center !== undefined) {
      if (!Array.isArray(m.center) || m.center.length !== 2 || !m.center.every(isNum)) {
        add('error', 'map.center must be [lat, lng] numbers');
      }
    }
    for (const k of ['zoom', 'minZoom', 'maxZoom']) {
      if (m[k] !== undefined && !isNum(m[k])) add('error', `map.${k} must be a number`);
    }

    const viewportKeys = ['center', 'zoom', 'minZoom', 'maxZoom'].filter((k) => m[k] !== undefined);
    if (viewportKeys.length && fm.subgalleries !== true) {
      add('warn', `map.${viewportKeys.join('/')} sets a viewport, but only a subgalleries:true voyage renders its own map — these keys are inert here (lat/lng/query still apply to the global atlas)`);
    }
    return;
  }

  if (collection === '_subvoyage') {
    const hasLat = m.lat !== undefined;
    const hasLng = m.lng !== undefined;
    if (hasLat !== hasLng) {
      add('error', 'map.lat and map.lng must be given together');
    }
    if (hasLat && (!isNum(m.lat) || !isNum(m.lng))) {
      add('error', 'map.lat / map.lng must be numbers');
    }
    if (m.query !== undefined && typeof m.query !== 'string') {
      add('error', 'map.query must be a string');
    }
    if (m.exclude !== undefined && typeof m.exclude !== 'boolean') {
      add('error', 'map.exclude must be a boolean');
    }
  }
}

/** Sub-voyage must sit under _subvoyage/<parent>/, and that parent must exist. */
function checkSubvoyagePlacement(rel, add) {
  const parts = rel.split(path.sep);
  if (parts.length < 3) {
    add('error', 'sub-voyage sits in _subvoyage/ root — must be _subvoyage/<parent-basename>/ or it is invisible to the enumerator');
    return null;
  }
  const parentSlug = parts[1];
  const candidates = ['md', 'markdown', 'html'].map((e) =>
    path.join(ROOT, '_voyage', `${parentSlug}.${e}`));
  if (!candidates.some((p) => fs.existsSync(p))) {
    add('error', `no parent voyage _voyage/${parentSlug}.md — folder name must equal the parent's basename`);
  }
  return parentSlug;
}

/** Nested gallery_name's first segment must match the parent, or siblings de-link. */
function checkNestedGalleryPrefix(fm, parentSlug, add) {
  if (!parentSlug || typeof fm.gallery_name !== 'string') return;
  if (!fm.gallery_name.includes('/')) return;
  const first = fm.gallery_name.split('/')[0];
  if (first !== parentSlug) {
    add('warn', `gallery_name starts with "${first}" but parent folder is "${parentSlug}" — related-panel siblings won't link`);
  }
}

/** Tags without a colour still render, just without their accent. */
function checkTags(fm, palettes, collection, add) {
  if (!Array.isArray(fm.tags) || !palettes) return;
  // The palette is collection-specific: _data/tag_colours.yml keeps voyage and
  // post tags in separate maps, and a voyage tag is not expected to appear in
  // the post palette or vice versa.
  const key = collection === '_posts' ? 'post_tag_colours' : 'voyage_tag_colours';
  const palette = palettes[key];
  if (!palette) return;
  for (const t of fm.tags) {
    if (typeof t !== 'string') continue;
    if (!(t in palette)) {
      add('warn', `tag "${t}" has no entry in _data/tag_colours.yml → ${key} — renders without accent colour`);
    }
  }
}

function loadTagColours() {
  const f = path.join(ROOT, '_data', 'tag_colours.yml');
  if (!fs.existsSync(f)) return null;
  try {
    // Returns the whole file: it holds `voyage_tag_colours` and
    // `post_tag_colours` as separate maps, chosen per collection.
    return yaml.load(fs.readFileSync(f, 'utf8')) || {};
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

function checkFile(absPath, tagColours) {
  const rel = path.relative(ROOT, absPath);
  const collection = collectionOf(rel);
  const findings = [];
  const add = (level, message) => findings.push({ level, message });

  if (!collection) return { rel, findings, skipped: true };

  const fm = parseFrontMatter(fs.readFileSync(absPath, 'utf8'));
  if (fm === null) {
    // _pages holds raw .html with no frontmatter; that's legitimate.
    if (collection === '_pages') return { rel, findings, skipped: true };
    add('error', 'no YAML frontmatter block');
    return { rel, findings };
  }
  if (fm.__parseError) {
    add('error', `frontmatter YAML failed to parse: ${fm.__parseError}`);
    return { rel, findings };
  }

  const filenameHasDate = /^\d{4}-\d{2}-\d{2}-/.test(path.basename(rel));
  for (const key of COLLECTIONS[collection].required) {
    if (fm[key] !== undefined && fm[key] !== null && fm[key] !== '') continue;
    // Jekyll derives a post's date from its `YYYY-MM-DD-` filename prefix, so
    // an explicit `date:` key is genuinely optional there.
    if (key === 'date' && collection === '_posts' && filenameHasDate) continue;
    // A voyage without `date` still renders; it only loses date display and
    // sort position. Real content relies on this, so it is not an error.
    if (key === 'date' && (collection === '_voyage' || collection === '_subvoyage')) {
      add('warn', 'no date — the entry renders but loses its date display and sort position');
      continue;
    }
    add('error', `missing required key: ${key}`);
  }

  checkGalleryName(fm, add);
  checkTags(fm, tagColours, collection, add);
  checkMap(fm, collection, add);

  if (collection === '_voyage') {
    checkVoyageMode(fm, add);
    checkEnumeratorChildren(fm, rel, add);
  }

  if (collection === '_subvoyage') {
    const parentSlug = checkSubvoyagePlacement(rel, add);
    checkNestedGalleryPrefix(fm, parentSlug, add);
    if (!fm.gallery_name) {
      add('warn', 'no gallery_name — sub-voyage will render without a gallery');
    }
  }

  return { rel, findings };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const changedOnly = args.includes('--changed');
  const explicit = args.filter((a) => !a.startsWith('--'));

  let files;
  if (explicit.length) {
    files = explicit.map((p) => path.resolve(ROOT, p));
  } else if (changedOnly) {
    files = changedFiles();
    if (files === null) {
      process.stderr.write('Not a git repo; --changed needs git.\n');
      return 2;
    }
  } else {
    files = Object.keys(COLLECTIONS).flatMap((c) => walk(path.join(ROOT, c)));
  }

  const tagColours = loadTagColours();
  const results = files
    .map((f) => checkFile(f, tagColours))
    .filter((r) => !r.skipped && r.findings.length);

  const errors = results.reduce(
    (n, r) => n + r.findings.filter((f) => f.level === 'error').length, 0);
  const warns = results.reduce(
    (n, r) => n + r.findings.filter((f) => f.level === 'warn').length, 0);

  if (json) {
    process.stdout.write(JSON.stringify({ checked: files.length, errors, warns, results }, null, 2) + '\n');
    return errors ? 1 : 0;
  }

  if (!results.length) {
    process.stdout.write(`OK — ${files.length} file(s) satisfy their collection contract.\n`);
    return 0;
  }

  for (const r of results) {
    process.stdout.write(`\n  ${r.rel}\n`);
    for (const f of r.findings) {
      process.stdout.write(`    ${f.level === 'error' ? 'ERROR' : ' warn'}  ${f.message}\n`);
    }
  }
  process.stdout.write(`\n${errors} error(s), ${warns} warning(s) across ${results.length} file(s) (${files.length} checked).\n`);
  return errors ? 1 : 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { parseFrontMatter, checkFile, collectionOf, main };
