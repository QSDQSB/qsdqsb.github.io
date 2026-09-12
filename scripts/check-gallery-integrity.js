#!/usr/bin/env node
/**
 * Audit the gallery tree against the content that references it.
 *
 * `check-frontmatter.js` answers "does this page's gallery_name resolve?".
 * This answers the set-level questions that only show up when you look at
 * both sides at once:
 *
 *   - Which gallery directories exist that no voyage or sub-voyage points at?
 *     (dead weight — shipped to Cloudflare on every deploy for nothing)
 *   - Which referenced directories are empty, or hold no usable images?
 *   - Where do thumbnails and full images disagree on filenames? The viewer
 *     builds thumbnail URLs by substituting the path prefix, so a name that
 *     differs by even an extension renders a broken tile.
 *
 * Thumbnails are gitignored and regenerated, so their absence is reported as
 * "run the generator", never as a content error.
 *
 * Usage:
 *   node scripts/check-gallery-integrity.js
 *   node scripts/check-gallery-integrity.js --json
 *   node scripts/check-gallery-integrity.js --strict   # orphans become errors
 *
 * Exit codes:
 *   0  No errors
 *   1  Errors found
 *   2  Usage / environment problem
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const GALLERY_DIR = path.join(ROOT, 'gallery');
const THUMB_DIR = path.join(ROOT, 'images', 'thumbnails', 'gallery');
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
 * Directories under gallery/ that actually hold images.
 *
 * A nested gallery is `parent/child`, so a directory containing only
 * subdirectories is a container, not a gallery, and is not reported as an
 * orphan in its own right.
 */
function actualGalleries() {
  const found = new Map();
  if (!fs.existsSync(GALLERY_DIR)) return found;

  const visit = (abs, rel) => {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    const images = entries.filter((e) => e.isFile() && IMAGE_RE.test(e.name)).map((e) => e.name);
    const dirs = entries.filter((e) => e.isDirectory());
    if (images.length || !dirs.length) found.set(rel, images);
    for (const d of dirs) visit(path.join(abs, d.name), rel ? `${rel}/${d.name}` : d.name);
  };

  for (const e of fs.readdirSync(GALLERY_DIR, { withFileTypes: true })) {
    if (e.isDirectory()) visit(path.join(GALLERY_DIR, e.name), e.name);
  }
  return found;
}

/** Thumbnails carry size/format suffixes, so compare on the base stem. */
function stems(names) {
  return new Set(names.map((n) => n.replace(IMAGE_RE, '').replace(/@2x$/, '')));
}

function audit() {
  const refs = referencedGalleries();
  const actual = actualGalleries();
  const findings = [];
  const add = (level, message) => findings.push({ level, message });

  for (const [name, files] of refs) {
    const images = actual.get(name);
    if (images === undefined) {
      add('error', `gallery_name "${name}" has no gallery/${name}/ — referenced by ${files.join(', ')}`);
      continue;
    }
    if (images.length === 0) {
      add('error', `gallery/${name}/ holds no images — ${files.join(', ')} will render an empty grid`);
      continue;
    }

    const thumbs = path.join(THUMB_DIR, name);
    if (!fs.existsSync(thumbs)) {
      add('warn', `no thumbnails for "${name}" — run \`npm run generate:gallery\` (${images.length} source image(s))`);
      continue;
    }
    const thumbNames = fs.readdirSync(thumbs).filter((f) => IMAGE_RE.test(f));
    const missing = [...stems(images)].filter((s) => !stems(thumbNames).has(s));
    if (missing.length) {
      add('warn', `"${name}": ${missing.length} image(s) without a matching thumbnail (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}) — regenerate`);
    }
  }

  for (const [name, images] of actual) {
    if (refs.has(name)) continue;
    // A parent of a referenced nested gallery is legitimately unreferenced.
    const isParentOfReferenced = [...refs.keys()].some((r) => r.startsWith(`${name}/`));
    if (isParentOfReferenced) continue;
    add('orphan', `gallery/${name}/ (${images.length} image(s)) is referenced by no voyage or sub-voyage`);
  }

  return findings;
}

function main(argv) {
  const args = argv.slice(2);
  const strict = args.includes('--strict');
  const findings = audit();

  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n');
  } else if (!findings.length) {
    process.stdout.write('OK — every gallery_name resolves and no orphan gallery directories.\n');
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

module.exports = { audit, referencedGalleries, actualGalleries, main };
