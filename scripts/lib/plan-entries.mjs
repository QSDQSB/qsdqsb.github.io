/**
 * The plan's four running lists (the changelog, the feature map, the findings inbox, the owner's
 * requests) as folders of one small file per entry, and the documents they render to.
 *
 * Why: each list was one file every branch appended to, so any two branches collided on it, and an
 * id taken from a counter was handed out twice. A file an entry is its own, so two branches that
 * each add one never touch the same path. The documents (`CHANGELOG.md`, `FEATURES.md`,
 * `findings/inbox.md`, `requests.md`) are generated from the folders and are not committed; every
 * script that reads one renders first (`renderAll`), so they are never stale and never conflict.
 *
 * An entry is `---\nkey: value\n---\nbody`. Values are one line, kept as they stand. Each folder's
 * `_head.md` is the prose that opens its document (edited by hand, rarely).
 */
import fs from 'node:fs';
import path from 'node:path';

export const KINDS = {
  changelog: { dir: 'changelog', doc: 'CHANGELOG.md' },
  features: { dir: 'features', doc: 'FEATURES.md' },
  inbox: { dir: 'findings/inbox', doc: 'findings/inbox.md' },
  requests: { dir: 'requests', doc: 'requests.md' },
};

/** An old numeric id (F124, R032) or a new one: its date and its words. */
export const ID = '(?:[A-Z]\\d{3,}|\\d{4}-\\d{2}-\\d{2}-[a-z0-9-]+)';

export const slugOf = (s, max = 48) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, max).replace(/-$/, '') || 'entry';

export function parseEntry(text, name = '') {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const front = {};
  if (m) for (const l of m[1].split('\n')) { const kv = l.match(/^([a-z][a-z-]*): ?(.*)$/); if (kv) front[kv[1]] = kv[2].trim(); }
  return { name, ...front, body: (m ? m[2] : text).replace(/\n+$/, '') };
}

export function formatEntry({ body = '', name, ...front }) {
  const keys = Object.keys(front).filter((k) => front[k] !== undefined && front[k] !== '');
  return `---\n${keys.map((k) => `${k}: ${front[k]}`).join('\n')}\n---\n${body}\n`;
}

const byDateThenId = (a, b) => b.date.localeCompare(a.date) || String(b.id || b.name).localeCompare(String(a.id || a.name), 'en', { numeric: true });
const cell = (c) => (c ? ` ${c} ` : ' ');

/** The document for one kind, from its head text and its entries. */
export function renderDoc(kind, head, entries) {
  if (kind === 'changelog') {
    const line = (e) => `- ${e.date} · ${e.body}${e.ids ? ` (${e.ids})` : ''}${e.tier !== undefined ? ` · tier ${e.tier}` : ''}`;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    const years = [...new Set(sorted.map((e) => e.date.slice(0, 4)))];
    return head + years.map((y) => `## ${y}\n\n${sorted.filter((e) => e.date.startsWith(y)).map(line).join('\n')}\n`).join('\n');
  }
  if (kind === 'features') {
    const sorted = [...entries].sort((a, b) => (Number(a.order ?? 1e9) - Number(b.order ?? 1e9)) || a.name.localeCompare(b.name));
    const row = (e) => `|${[e.feature, e.where, e.code, e.journey, e.notes].map(cell).join('|')}|`;
    return `${head}| Feature | Where a reader meets it | Code | Journey | Standing calls and notes |\n|---|---|---|---|---|\n${sorted.map(row).join('\n')}\n`;
  }
  if (kind === 'inbox') {
    const line = (e) => `- ${e.date} · ${e.id} · ${e.body}${e.home ? ` → ${e.home}` : ''}`;
    const part = (status) => [...entries].filter((e) => (e.status || 'waiting') === status).sort(byDateThenId).map(line).join('\n');
    const w = part('waiting'), t = part('taken');
    return `${head}## Waiting\n\n${w ? `${w}\n` : ''}\n## Taken\n\nWhere each went is at the end of its line.\n\n${t ? `${t}\n` : ''}`;
  }
  if (kind === 'requests') {
    const line = (e) => `- ${e.date} · ${e.id} · ${e.body}${e.done ? ` → ${e.done}` : ''}`;
    const part = (status) => [...entries].filter((e) => (e.status || 'open') === status).sort(byDateThenId).map(line).join('\n');
    const o = part('open'), d = part('done');
    return `${head}## Open\n\n${o ? `${o}\n` : ''}\n## Done\n\n${d ? `${d}\n` : ''}`;
  }
  throw new Error(`no such kind: ${kind}`);
}

/** Read an old-format document into its head and entries (the migration, and tests that hold documents). */
export function docToEntries(kind, text) {
  const used = new Set();
  const unique = (base) => { let n = base, i = 2; while (used.has(n)) n = `${base}-${i++}`; used.add(n); return n; };
  const lines = text.split('\n');
  const first = (re) => { const i = lines.findIndex((l) => re.test(l)); return i < 0 ? lines.length : i; };
  if (kind === 'changelog') {
    const head = `${lines.slice(0, first(/^## \d{4}$/)).join('\n')}\n`;
    const entries = [];
    for (const l of lines) {
      const m = l.match(/^- (\d{4}-\d{2}-\d{2}) · (.+)$/);
      if (m) entries.push({ name: unique(`${m[1]}-${slugOf(m[2].split(/\s+/).slice(0, 8).join(' '))}`), date: m[1], body: m[2] });
    }
    return { head, entries };
  }
  if (kind === 'features') {
    const at = first(/^\| Feature \|/);
    const head = lines.slice(0, at).join('\n') + (at ? '\n' : '');
    const entries = [];
    let order = 10;
    for (const l of lines.slice(at + 2)) {
      if (!l.startsWith('|')) continue;
      const cells = l.slice(1, -1).split('|').map((c) => c.trim());
      if (cells.length < 5) continue;
      const [feature, where, code, journey, ...notes] = cells;
      entries.push({ name: unique(slugOf(feature)), feature, where, code, journey, notes: notes.join('|'), order: order += 10 });
    }
    return { head, entries };
  }
  const [waitKey, laterKey] = kind === 'inbox' ? ['## Waiting', '## Taken'] : ['## Open', '## Done'];
  const [open, closed] = kind === 'inbox' ? ['waiting', 'taken'] : ['open', 'done'];
  const at = first({ test: (l) => l === waitKey });
  const head = lines.slice(0, at).join('\n') + (at ? '\n' : '');
  const entries = [];
  let status = null;
  for (const l of lines.slice(at)) {
    if (l === waitKey) { status = open; continue; }
    if (l === laterKey) { status = closed; continue; }
    const m = l.match(/^- (\d{4}-\d{2}-\d{2}) · ([A-Z]\d{3,}|\d{4}-\d{2}-\d{2}-[a-z0-9-]+) · (.+)$/);
    if (!m || !status) continue;
    const [, date, id, rest] = m;
    const e = { name: unique(id), id, date, status, body: rest };
    if (status === 'taken') { const i = rest.lastIndexOf(' → '); if (i > 0) { e.body = rest.slice(0, i); e.home = rest.slice(i + 3); } }
    if (status === 'done') { const i = rest.indexOf(' → done'); if (i > 0) { e.body = rest.slice(0, i); e.done = rest.slice(i + 3); } }
    entries.push(e);
  }
  return { head, entries };
}

const HEAD = '_head.md';
const dirOf = (planDir, kind) => path.join(planDir, KINDS[kind].dir);

export function loadEntries(planDir, kind) {
  const dir = dirOf(planDir, kind);
  if (!fs.existsSync(dir)) return { head: '', entries: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  const head = files.includes(HEAD) ? fs.readFileSync(path.join(dir, HEAD), 'utf8') : '';
  const entries = files.filter((f) => f !== HEAD).map((f) => parseEntry(fs.readFileSync(path.join(dir, f), 'utf8'), f.slice(0, -3)));
  return { head, entries };
}

export function writeEntry(planDir, kind, name, entry) {
  const dir = dirOf(planDir, kind);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.md`);
  fs.writeFileSync(file, formatEntry(entry));
  return file;
}

/** A name no entry of this kind holds yet. */
export function freeName(planDir, kind, base) {
  const dir = dirOf(planDir, kind);
  let n = base, i = 2;
  while (fs.existsSync(path.join(dir, `${n}.md`))) n = `${base}-${i++}`;
  return n;
}

/** Write the four documents from their folders; a kind with no folder keeps the document it has. */
export function renderAll(planDir) {
  for (const [kind, { dir, doc }] of Object.entries(KINDS)) {
    if (!fs.existsSync(path.join(planDir, dir))) continue;
    const { head, entries } = loadEntries(planDir, kind);
    const out = renderDoc(kind, head, entries);
    const file = path.join(planDir, doc);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
  }
}
