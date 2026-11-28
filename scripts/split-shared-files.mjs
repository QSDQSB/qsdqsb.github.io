#!/usr/bin/env node
/**
 * Carries a branch over to the split layout, so it stops colliding with every other branch on
 * the same shared files (_plan/decisions/0014-one-file-per-entry.md).
 *
 *   node scripts/split-shared-files.mjs journeys <old check-journeys.mjs> [<merge-base copy>]
 *     Writes each journey of the old array to tests/journeys/<id>.mjs. With the merge-base copy,
 *     only the journeys the branch added or changed since then (the rest are master's already).
 *   node scripts/split-shared-files.mjs baseline <old baseline.json> [<merge-base copy>]
 *     Writes each picture's hash to tests/visual/hashes/<name>.sha, likewise only what the
 *     branch re-captured when a merge-base copy is given.
 *
 *   node scripts/split-shared-files.mjs <changelog|features|inbox|requests> <old document> [<merge-base copy>]
 *     Writes each line of the old plan document to its own file in _plan/changelog/, features/,
 *     findings/inbox/ or requests/ (with `--head`, the folder's `_head.md` too). With the merge-base
 *     copy, only the lines the branch added or changed.
 *
 * A journey or a picture the branch removed is not carried: delete its file by hand.
 * Run from the repository's root. Existing files are replaced only where the branch changed them.
 * `git show <ref>:scripts/check-journeys.mjs > /tmp/old.mjs` gets an old copy of either file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeIndex } from './lib/visual-store.mjs';
import { KINDS, docToEntries, writeEntry } from './lib/plan-entries.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const JOURNEY_DIR = path.join(ROOT, 'tests', 'journeys');

/** The old array's blocks: { id, text } where text is the journey object, as it stood, dedented. */
export function journeyBlocks(source) {
  const lines = source.split('\n');
  const from = lines.findIndex((l) => l === 'const JOURNEYS = [');
  if (from < 0) throw new Error('no `const JOURNEYS = [` in that file: it is not the old layout');
  const blocks = [];
  let i = from + 1;
  for (; i < lines.length && lines[i] !== '];'; i++) {
    if (lines[i].trim() === '') continue;
    const head = lines[i].match(/^ {2}\{ id: '([^']+)'/);
    if (!head) throw new Error(`line ${i + 1}: expected a journey, found ${lines[i].slice(0, 60)}`);
    let to = i;
    while (lines[to] !== '  } },') {
      to++;
      if (to >= lines.length) throw new Error(`${head[1]}: its closing line is missing`);
    }
    const text = lines.slice(i, to + 1).map((l) => l.replace(/^ {2}/, '')).join('\n').replace(/ ?,$/, '');
    blocks.push({ id: head[1], text });
    i = to;
  }
  if (!blocks.length) throw new Error('no journeys found');
  return blocks;
}

/** The module for one journey. `base` was a name in the old file's scope: it is now passed in. */
export function journeyModule({ text }) {
  let body = text;
  if (/\bbase\b/.test(body) && !/async run\(\{[^}]*\bbase\b/.test(body)) {
    body = body.replace(/async run\((?:\{ ([^}]*) \})?\)/, (_, args) => `async run({ ${args ? `${args}, ` : ''}base })`);
  }
  // Names the old file imported for every journey: a journey that uses one imports it itself.
  const playwright = ['chromium', 'webkit', 'devices'].filter((n) => new RegExp(`\\b${n}\\b`).test(body));
  const imports = (playwright.length ? `import { ${playwright.join(', ')} } from 'playwright-core';\n` : '')
    + (/\bmust\(/.test(body) ? "import { must } from './_lib.mjs';\n" : '');
  return `${imports ? `${imports}\n` : ''}export default ${body};\n`;
}

function journeys(oldFile, baseFile) {
  const known = baseFile ? new Map(journeyBlocks(fs.readFileSync(baseFile, 'utf8')).map((b) => [b.id, b.text])) : null;
  fs.mkdirSync(JOURNEY_DIR, { recursive: true });
  let written = 0;
  for (const b of journeyBlocks(fs.readFileSync(oldFile, 'utf8'))) {
    if (known && known.get(b.id) === b.text) continue;
    fs.writeFileSync(path.join(JOURNEY_DIR, `${b.id}.mjs`), journeyModule(b));
    written++;
  }
  console.log(`${written} journey file(s) written to tests/journeys/`);
}

function baseline(oldFile, baseFile) {
  const mine = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
  const theirs = baseFile ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : {};
  const changed = Object.fromEntries(Object.entries(mine).filter(([name, hash]) => theirs[name] !== hash));
  writeIndex(changed);
  console.log(`${Object.keys(changed).length} hash file(s) written to tests/visual/hashes/`);
}

const PLAN = path.join(ROOT, '_plan');
const same = (a, b) => JSON.stringify({ ...a, name: 0, order: 0 }) === JSON.stringify({ ...b, name: 0, order: 0 });

/** The plan's running lists: one file an entry, from an old document (and the head when asked). */
export function planDocument(kind, oldFile, baseFile, { head = false, planDir = PLAN } = {}) {
  const mine = docToEntries(kind, fs.readFileSync(oldFile, 'utf8'));
  const theirs = baseFile ? docToEntries(kind, fs.readFileSync(baseFile, 'utf8')).entries : [];
  const fresh = mine.entries.filter((e) => !theirs.some((t) => same(t, e)));
  const dir = path.join(planDir, KINDS[kind].dir);
  fs.mkdirSync(dir, { recursive: true });
  if (head) fs.writeFileSync(path.join(dir, '_head.md'), mine.head);
  for (const { name, ...entry } of fresh) writeEntry(planDir, kind, name, entry);
  return fresh.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), head = argv.includes('--head');
  const [kind, oldFile, baseFile] = argv.filter((a) => a !== '--head');
  if (KINDS[kind] && oldFile) {
    console.log(`${planDocument(kind, oldFile, baseFile, { head })} entr(ies) written to _plan/${KINDS[kind].dir}/`);
  } else if (['journeys', 'baseline'].includes(kind) && oldFile) {
    (kind === 'journeys' ? journeys : baseline)(oldFile, baseFile);
  } else {
    console.error('Usage: split-shared-files.mjs <journeys|baseline|changelog|features|inbox|requests> <old file> [<merge-base copy of it>] [--head]');
    process.exit(2);
  }
}
