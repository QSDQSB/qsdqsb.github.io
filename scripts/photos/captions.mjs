#!/usr/bin/env node
/**
 * Scaffold the authored YAML for a gallery, so captioning is filling in
 * blanks rather than typing frame numbers.
 *
 * Every slug the gallery has (local originals in photos/<gallery>/, plus
 * anything the processor has already rendered) that the YAML does not
 * mention gets an entry with an empty `caption:` line, in capture-time
 * order. Existing entries, comments, and key order are never touched: the
 * new entries are appended as text to the end of the `photos:` block, and
 * the result is re-parsed and checked before it is written.
 *
 * Usage: npm run photos:captions -- --gallery <name> [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { PATHS, parseArgs } from './lib/config.mjs';
import { sortPhotos, validateAuthored } from './lib/manifest.mjs';
import { cleanGallery, localGallery, readAuthored, readMerged, readHeadExif } from './lib/inventory.mjs';

/**
 * Insert `slugs` as `<slug>:\n  caption:` entries at the end of the
 * `photos:` block of `text`, keeping everything else byte for byte.
 * Returns the new text; throws when the block is written in a shape this
 * cannot extend safely (a non-empty flow mapping).
 */
export function appendEntries(text, slugs, header = '') {
  if (!slugs.length) return text;
  if (text == null || !text.trim()) text = header;
  const lines = text.replace(/\n$/, '').split('\n');
  if (lines.length === 1 && lines[0] === '') lines.length = 0;
  const at = lines.findIndex(l => /^photos:/.test(l));

  if (at < 0) return [...lines, 'photos:', ...entryLines(slugs, '  ')].join('\n') + '\n';

  const rest = lines[at].slice('photos:'.length).replace(/\s+#.*$/, '').trim();
  if (rest === '{}' || rest === '~' || rest === 'null' || rest === '') {
    if (rest) lines[at] = 'photos:';
  } else throw new Error(`"photos:" is written inline (${rest.slice(0, 40)}); rewrite it as a block mapping first`);

  // The block runs until the next line that starts at column 0 (a top-level key).
  let end = at + 1;
  while (end < lines.length && !/^[^\s#]/.test(lines[end])) end++;
  // Keep trailing blank lines and top-level comments below the new entries.
  while (end > at + 1 && /^\s*(#.*)?$/.test(lines[end - 1]) && !/^\s+#/.test(lines[end - 1])) end--;

  const first = lines.slice(at + 1, end).find(l => /^\s+[^\s#]/.test(l));
  const indent = first ? first.match(/^\s+/)[0] : '  ';
  lines.splice(end, 0, ...entryLines(slugs, indent));
  return lines.join('\n') + '\n';
}
const entryLines = (slugs, indent) => slugs.flatMap(s => [`${indent}${s}:`, `${indent}${indent}caption:`]);

/**
 * Work out the scaffold for one gallery without writing it.
 * @returns {{file, before, after, added:string[], total:number, problems:string[]}}
 */
export async function scaffold(gallery, { photosDir = PATHS.photosDir, authoredDir = PATHS.authoredDir, mergedDir = PATHS.mergedDir } = {}) {
  const { file, text, doc, problems } = readAuthored(gallery, authoredDir);
  if (problems.length) return { file, before: text, after: text, added: [], total: 0, problems };

  // Capture time: the local file's own EXIF first, else what the processor recorded.
  const known = new Map();
  for (const p of (readMerged(gallery, mergedDir)?.inventory || [])) known.set(p.slug, { slug: p.slug, taken: p.taken });
  for (const f of localGallery(gallery, photosDir).files) {
    const exif = await readHeadExif(f.abs).catch(() => null);
    known.set(f.slug, { slug: f.slug, taken: exif?.taken || known.get(f.slug)?.taken || null });
  }
  const existing = new Set(Object.keys((doc && doc.photos) || {}).map(s => s.toLowerCase()));
  const added = sortPhotos([...known.values()]).map(p => p.slug).filter(s => !existing.has(s));

  const header = `# Authored layer for gallery/${gallery} — captions, order, stories.\n# Slugs are camera frame numbers; see _docs/photos-pipeline.md.\n`;
  let after;
  try { after = appendEntries(text, added, header); }
  catch (e) { return { file, before: text, after: text, added: [], total: known.size, problems: [`_data/photos/${gallery}.yml: ${e.message}`] }; }

  // Prove the edit: it parses, it validates, every old entry is unchanged, every new slug is present.
  const next = yaml.load(after) || {};
  const check = validateAuthored(next, `_data/photos/${gallery}.yml`);
  for (const [slug, entry] of Object.entries((doc && doc.photos) || {})) {
    if (JSON.stringify(next.photos?.[slug]) !== JSON.stringify(entry)) check.push(`scaffold would change the existing entry "${slug}"`);
  }
  for (const k of Object.keys(doc || {})) if (k !== 'photos' && JSON.stringify(next[k]) !== JSON.stringify(doc[k])) check.push(`scaffold would change "${k}"`);
  for (const s of added) if (!next.photos || !(s in next.photos)) check.push(`scaffold lost "${s}"`);
  return { file, before: text, after: check.length ? text : after, added: check.length ? [] : added, total: known.size, problems: check };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gallery = cleanGallery(args.gallery);
  if (!gallery) { console.error('usage: npm run photos:captions -- --gallery <name> [--dry-run]'); return 2; }

  const r = await scaffold(gallery);
  const rel = path.relative(process.cwd(), r.file);
  if (r.problems.length) { for (const p of r.problems) console.error(`  ✗ ${p}`); console.error(`\n${rel} left as it was.`); return 1; }
  if (!r.total) { console.error(`${gallery}: no photos in photos/${gallery}/ and none processed; nothing to scaffold.`); return 1; }
  if (!r.added.length) { console.log(`${rel}: all ${r.total} photos already have an entry.`); return 0; }

  console.log(`${rel}: ${r.added.length} new entr${r.added.length === 1 ? 'y' : 'ies'}, in capture-time order:`);
  for (const s of r.added) console.log(`  + ${s}`);
  if (args['dry-run']) { console.log('\nDry run; nothing written.'); return 0; }
  fs.mkdirSync(path.dirname(r.file), { recursive: true });
  fs.writeFileSync(r.file, r.after);
  console.log(`\nWritten. Fill in the empty caption: lines; an entry left blank shows the photo uncaptioned.`);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
