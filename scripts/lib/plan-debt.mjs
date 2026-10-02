/**
 * Debt the gate cannot see, found by a program so the daily run has nothing to improvise:
 * a stylesheet partial or a script under `_sass/` or `assets/js/` that nothing imports or loads.
 * It prints candidates with what was searched; whoever reads them decides (`plan.mjs debt`).
 * A file the inbox already names is left out, so the same line is not offered twice.
 */
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['vendor', 'node_modules', '_site', '.sass-cache', '.git', '.claude', 'for_agents', 'design', 'trash', 'photos']);
// Where a file can be named from: templates, pages, styles, scripts, and the build's own lists.
const HAYSTACK = ['_includes', '_layouts', '_pages', '_posts', '_drafts', '_voyage', '_subvoyage', '_portfolio', '_sass', '_data', 'assets/js', 'assets/css', 'scripts', 'workers', 'functions'];
const HAY_FILES = ['package.json', '_config.yml', '_config_dev.yml', 'Rakefile'];
const TEXT = /\.(html|md|scss|css|js|mjs|cjs|json|yml|yaml|rb|sh|liquid|xml|txt)$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); } else if (e.isFile()) out.push(path.join(dir, e.name));
  }
  return out;
}

export function debt(root, inbox = '') {
  const rel = (f) => path.relative(root, f).split(path.sep).join('/');
  // A page at the root (index.html, 404.md) can load a script too.
  const rootPages = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isFile() && /\.(html|md)$/.test(e.name)).map((e) => path.join(root, e.name));
  const hay = [...HAYSTACK.flatMap((d) => walk(path.join(root, d))), ...rootPages, ...HAY_FILES.map((f) => path.join(root, f)).filter((f) => fs.existsSync(f))]
    .filter((f) => TEXT.test(f) && !/\.min\.js$/.test(f))
    .map((f) => ({ file: rel(f), text: fs.readFileSync(f, 'utf8') }));
  const namedElsewhere = (self, re) => hay.some((h) => h.file !== self && re.test(h.text));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = [];

  // A partial is imported by its name without the underscore or the extension: @import "colour";
  for (const f of walk(path.join(root, '_sass')).filter((x) => x.endsWith('.scss'))) {
    const self = rel(f), name = path.basename(f, '.scss').replace(/^_/, '');
    if (!namedElsewhere(self, new RegExp(`@(import|use|forward)[^;]*["'/]_?${esc(name)}(\\.scss)?["']`))) found.push({ file: self, why: `no stylesheet imports ${name}` });
  }
  // A script is loaded by its file name: a script tag, an import, a line of the bundle's list.
  for (const f of walk(path.join(root, 'assets/js')).filter((x) => x.endsWith('.js') && !/\.min\.js$/.test(x))) {
    const self = rel(f), name = path.basename(f);
    if (!namedElsewhere(self, new RegExp(`(^|[^\\w.-])${esc(name)}\\b`, 'm'))) found.push({ file: self, why: `no template, page, script or build list names ${name}` });
  }
  return { searched: hay.length, found: found.filter((x) => !inbox.includes(x.file)) };
}
