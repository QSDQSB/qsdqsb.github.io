#!/usr/bin/env node
/**
 * Does the build serve only the site? Jekyll copies every file and folder at the repository's root
 * into `_site/` unless `exclude:` in `_config.yml` names it, so a file added for the people (or the
 * agents) who work on the site becomes a page a reader can open: `CLAUDE.md` was live at /CLAUDE.md
 * until 2026-10-02, with the contribution notes and two lockfiles beside it.
 *
 * Every entry at the root is either meant for readers (MEANT, below) or must be absent from the
 * build. Adding a root file for readers is one line here, on purpose; anything else that shows up
 * in the build fails, with the line to add to `exclude:`.
 *
 *   node scripts/check-served-files.mjs               # the built site in _site/
 *   node scripts/check-served-files.mjs --site DIR
 *
 * Exit codes: 0 nothing stray is served · 1 something is · 2 no built site
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = process.argv.indexOf('--site');
const SITE = path.resolve(ROOT, at >= 0 ? process.argv[at + 1] : '_site');

// What a reader (or a crawler) is meant to fetch from the root as it stands in the repository.
const MEANT = new Set(['assets', 'images', 'files', 'favicon.ico', 'robots.txt', 'llms.txt', 'sitemap.xml']);
// Ownership files a search engine asks for, named by the engine: a root .html, or 32 hex digits .txt.
const meant = (name) => MEANT.has(name) || /^google[0-9a-f]+\.html$/.test(name) || /^[0-9a-f]{32}\.txt$/.test(name);
// Jekyll never reads these, whatever `exclude:` says.
const unread = (name) => /^[._#~]/.test(name);

if (!fs.existsSync(path.join(SITE, 'index.html'))) {
  console.error(`No built site at ${SITE}: run npm run build first, or pass --site.`);
  process.exit(2);
}

const stray = [];
for (const name of fs.readdirSync(ROOT)) {
  if (unread(name) || meant(name)) continue;
  const stem = name.replace(/\.(md|markdown|html)$/i, '');
  // As a copied file or folder, or (a Markdown or HTML file) as the page Jekyll would make of it.
  const served = [name, ...(stem !== name ? [`${stem}.html`, path.join(stem, 'index.html')] : [])]
    .filter((p) => fs.existsSync(path.join(SITE, p)));
  // A folder of the same name can be the site's own (a page's permalink): only a copy counts, one
  // that holds the source's own first entry.
  if (!served.length) continue;
  const src = path.join(ROOT, name);
  if (fs.statSync(src).isDirectory()) {
    const first = fs.readdirSync(src).find((f) => !unread(f));
    if (!first || !fs.existsSync(path.join(SITE, name, first))) continue;
  }
  stray.push({ name, served });
}

if (stray.length) {
  console.error('Served, and not meant for readers. Add each to `exclude:` in _config.yml:');
  for (const s of stray) console.error(`  - ${s.name}    (in the build as ${s.served.join(', ')})`);
  console.error('A root file that is meant for readers goes in MEANT, scripts/check-served-files.mjs.');
  process.exit(1);
}
console.log('Nothing at the root is served that is not meant for readers.');
