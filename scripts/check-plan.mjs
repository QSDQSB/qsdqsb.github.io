#!/usr/bin/env node
/**
 * Is the plan still true? `_plan/` is the site's command centre (roadmap, queue, principles,
 * decisions, stages, findings, features, changelog). A plan nobody checks rots within a month:
 * a stage file is renamed and the roadmap still points at the old one, a feature moves and its
 * row names a file that is gone, a session ships a change and writes nothing down.
 *
 * Two uses:
 *   node scripts/check-plan.mjs            # validate; exit 1 on a broken plan (run by scripts/gate.sh)
 *   node scripts/check-plan.mjs --brief    # the state of the plan in a few lines, for the start of
 *                                          #   every session (scripts/hooks/session-start-plan.sh)
 *   node scripts/check-plan.mjs --json     # the same state as data (scripts/hub-page.mjs)
 *   node scripts/check-plan.mjs --since origin/master   # judge the changelog rule over a range too
 *
 * What fails:
 *   - a required file missing; a roadmap row without its stage file, or a stage file off the roadmap
 *   - a status that is not one of the plan's
 *   - a decision out of sequence or with no Status line
 *   - a relative link in `_plan/` that leads nowhere
 *   - a feature row naming a file or a journey that does not exist
 *   - a change to what readers get (styles, layouts, includes, scripts, pages, navigation) with no
 *     line in `_plan/CHANGELOG.md` beside it
 * What only warns: a roadmap not reviewed in a month, a long queue, a full inbox. A warning that
 * failed the gate would be muted within a week.
 *
 * Exit codes: 0 sound (warnings allowed) · 1 broken · 2 not a plan
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = path.join(ROOT, '_plan');
const args = process.argv.slice(2);
const sinceAt = args.indexOf('--since');
const since = sinceAt >= 0 ? args[sinceAt + 1] : null;
const mode = args.includes('--brief') ? 'brief' : args.includes('--json') ? 'json' : 'check';

if (!fs.existsSync(PLAN)) { console.error('No _plan/ folder.'); process.exit(2); }

const STATUSES = ['idea', 'planned', 'designing', 'building', 'in review', 'done'];
const REQUIRED = ['README.md', 'ROADMAP.md', 'QUEUE.md', 'PRINCIPLES.md', 'ARCHITECTURE.md', 'FEATURES.md', 'CHANGELOG.md', 'findings/inbox.md'];
// What a reader gets. Posts, voyages and captions are content, and their own record.
const READER_FACING = [/^_sass\//, /^_layouts\//, /^_includes\//, /^assets\/js\//, /^assets\/css\//, /^_pages\//, /^_data\/navigation\.yml$/, /^_config\.yml$/];
const NOT_READER_FACING = [/^assets\/js\/vendor\//];

const errors = [], warnings = [];
const read = (rel) => fs.readFileSync(path.join(PLAN, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(PLAN, rel));
const daysSince = (iso) => Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86400000);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.name === 'private') return [];
  const full = path.join(dir, e.name);
  return e.isDirectory() ? walk(full) : full.endsWith('.md') ? [full] : [];
});
const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

for (const f of REQUIRED) if (!exists(f)) errors.push(`_plan/${f} is missing.`);
if (errors.length && mode === 'check') { errors.forEach((e) => console.log(`✗  ${e}`)); process.exit(1); }

/* ── roadmap and stages ─────────────────────────────────────────────────── */
const stages = [];
const roadmap = exists('ROADMAP.md') ? read('ROADMAP.md') : '';
for (const line of roadmap.split('\n')) {
  const m = line.match(/^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\((stages\/[^)]+)\)\s*\|[^|]*\|\s*([^|]+?)\s*\|/);
  if (!m) continue;
  const status = STATUSES.find((s) => m[4].replace(/\*/g, '').trim().toLowerCase().startsWith(s));
  if (!status) errors.push(`Roadmap stage ${m[1]}: "${m[4].trim()}" is not a status (${STATUSES.join(', ')}).`);
  let done = 0, open = 0;
  if (exists(m[3])) {
    const body = read(m[3]);
    done = (body.match(/^\s*- \[x\]/gim) || []).length;
    open = (body.match(/^\s*- \[ \]/gm) || []).length;
  } else errors.push(`Roadmap stage ${m[1]} points at _plan/${m[3]}, which does not exist.`);
  stages.push({ n: Number(m[1]), name: m[2], file: m[3], status: status || m[4].trim(), done, open });
}
if (!stages.length) errors.push('ROADMAP.md lists no stages.');
if (fs.existsSync(path.join(PLAN, 'stages'))) {
  for (const f of fs.readdirSync(path.join(PLAN, 'stages')).filter((x) => x.endsWith('.md'))) {
    if (!stages.some((s) => s.file === `stages/${f}`)) errors.push(`_plan/stages/${f} is not on the roadmap.`);
  }
}
const reviewed = roadmap.match(/Last reviewed:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
if (!reviewed) warnings.push('ROADMAP.md has no "Last reviewed: YYYY-MM-DD" line.');
else if (daysSince(reviewed) > 30) warnings.push(`The roadmap was last reviewed ${daysSince(reviewed)} days ago (${reviewed}).`);

/* ── decisions ──────────────────────────────────────────────────────────── */
const decisions = [];
if (fs.existsSync(path.join(PLAN, 'decisions'))) {
  const files = fs.readdirSync(path.join(PLAN, 'decisions')).filter((x) => /^\d{4}-.*\.md$/.test(x)).sort();
  files.forEach((f, i) => {
    const n = Number(f.slice(0, 4));
    if (n !== i + 1) errors.push(`Decision ${f} is out of sequence: expected ${String(i + 1).padStart(4, '0')}.`);
    const body = read(`decisions/${f}`);
    const status = body.match(/\*\*Status:\*\*\s*([^\n]+)/)?.[1];
    if (!status) errors.push(`_plan/decisions/${f} has no **Status:** line.`);
    decisions.push({ n, file: `decisions/${f}`, title: (body.match(/^#\s*(.+)$/m)?.[1] || f).replace(/^\d+\s*·\s*/, ''), status: status || '' });
  });
}

/* ── links ──────────────────────────────────────────────────────────────── */
for (const file of walk(PLAN)) {
  const body = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const m of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) errors.push(`${path.relative(ROOT, file)} links to ${m[1]}, which does not exist.`);
  }
}

/* ── the queue ──────────────────────────────────────────────────────────── */
const queue = [];
if (exists('QUEUE.md')) {
  const open = read('QUEUE.md').split(/^## Answered/m)[0];
  for (const block of open.split(/^### /m).slice(1)) {
    const head = block.split('\n')[0].match(/^(Q\d+)\s*·\s*(.+)$/);
    if (!head) { errors.push(`QUEUE.md: "${block.split('\n')[0]}" is not "### Qn · question".`); continue; }
    const asked = block.match(/Asked:\s*(\d{4}-\d{2}-\d{2})/)?.[1] || null;
    if (!asked) warnings.push(`${head[1]} has no "Asked: YYYY-MM-DD" line.`);
    const options = [...block.matchAll(/^- \*\*([A-Z])\b[^*]*\*\*:?\s*(.+)$/gm)].map((o) => ({ key: o[1], recommended: /recommended/i.test(o[0].split('**')[1]), text: o[2].trim() }));
    const text = block.split('\n').slice(1).join('\n').replace(/^Asked:.*$/m, '').replace(/^---\s*$/m, '').trim();
    queue.push({ id: head[1], title: head[2].trim(), asked, options, text });
  }
  if (queue.length > 8) warnings.push(`The queue has ${queue.length} open calls; it is meant to hold about seven.`);
  const oldest = queue.map((q) => q.asked).filter(Boolean).sort()[0];
  if (oldest && daysSince(oldest) > 21) warnings.push(`The oldest call in the queue has waited ${daysSince(oldest)} days.`);
}

/* ── features ───────────────────────────────────────────────────────────── */
const features = [];
if (exists('FEATURES.md')) {
  const journeysSrc = fs.existsSync(path.join(ROOT, 'scripts/check-journeys.mjs')) ? fs.readFileSync(path.join(ROOT, 'scripts/check-journeys.mjs'), 'utf8') : '';
  const journeys = new Set([...journeysSrc.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((m) => m[1]));
  for (const line of read('FEATURES.md').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 6 || !cells[1] || /^-+$/.test(cells[1]) || cells[1] === 'Feature') continue;
    const [, name, where, code, journey] = cells;
    for (const m of code.matchAll(/`([^`]+)`/g)) {
      const p = m[1].replace(/:\d+.*$/, '');
      if (/[*{]/.test(p)) continue;
      if (!fs.existsSync(path.join(ROOT, p))) errors.push(`FEATURES.md, "${name}": ${p} does not exist.`);
    }
    const ids = [...journey.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
    for (const id of ids) if (!journeys.has(id)) errors.push(`FEATURES.md, "${name}": no journey "${id}" in scripts/check-journeys.mjs.`);
    features.push({ name, where, journeys: ids });
  }
  const bare = features.filter((f) => !f.journeys.length).length;
  if (features.length && bare) warnings.push(`${bare} of ${features.length} features have no journey walking them.`);
}

/* ── inbox and changelog ────────────────────────────────────────────────── */
const inbox = exists('findings/inbox.md') ? (read('findings/inbox.md').split(/^## Taken/m)[0].match(/^- /gm) || []).length : 0;
if (inbox > 25) warnings.push(`The findings inbox holds ${inbox} items; sort it into stages.`);
const changelog = exists('CHANGELOG.md') ? [...read('CHANGELOG.md').matchAll(/^- (\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/gm)].map((m) => ({ date: m[1], text: m[2] })) : [];

const changed = new Set([
  ...git('diff', '--name-only', 'HEAD').split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
  ...(since ? git('diff', '--name-only', `${since}...HEAD`).split('\n') : []),
].filter(Boolean));
const seen = [...changed].filter((f) => READER_FACING.some((r) => r.test(f)) && !NOT_READER_FACING.some((r) => r.test(f)));
if (seen.length && !changed.has('_plan/CHANGELOG.md')) {
  errors.push(`${seen.length} file(s) that shape what a reader gets changed (${seen.slice(0, 3).join(', ')}${seen.length > 3 ? ', …' : ''}) with no line added to _plan/CHANGELOG.md.`);
}

/* ── out ────────────────────────────────────────────────────────────────── */
const now = stages.find((s) => ['building', 'in review'].includes(s.status)) || stages.find((s) => s.status === 'planned') || null;
const hub = fs.existsSync(path.join(PLAN, 'hub.json')) ? JSON.parse(read('hub.json')) : {};
const state = { reviewed, stages, now, queue, decisions, features, inbox, changelog: changelog.slice(0, 20), hub, errors, warnings };

if (mode === 'json') { console.log(JSON.stringify(state, null, 1)); process.exit(errors.length ? 1 : 0); }

if (mode === 'brief') {
  const out = ['THE PLAN — this repo is run from _plan/. Read _plan/ROADMAP.md before any design or architecture work.'];
  if (now) out.push(`Now: stage ${now.n}, ${now.name} (${now.status}), ${now.done} of ${now.done + now.open} tasks done → _plan/${now.file}`);
  const live = stages.filter((s) => s.status === 'designing');
  if (live.length) out.push(`In design: ${live.map((s) => `stage ${s.n}, ${s.name}`).join('; ')}`);
  out.push(`Owner's queue: ${queue.length} open${queue.length ? ` (${queue.map((q) => q.id).join(', ')})` : ''} → _plan/QUEUE.md. Never treat an unanswered call as a yes.`);
  if (hub.url) out.push(`The owner answers on the command centre: ${hub.url} — read new answers first (ArtifactData, action "list", collection "answers"), then record them in QUEUE.md.`);
  out.push(`Findings inbox: ${inbox} waiting → _plan/findings/inbox.md. File what you notice there, one line, dated.`);
  if (changelog.length) out.push(`Last changes: ${changelog.slice(0, 3).map((c) => `${c.date} ${c.text}`).join(' | ')}`);
  out.push('Rules: who decides → _plan/decisions/0001 · a choice between two ways → /choose (prototypes first) · before the owner sees work → npm run gate:full and the site-reviewer agent · a change readers get → a line in _plan/CHANGELOG.md.');
  if (errors.length) out.push(`The plan is broken (${errors.length}): ${errors[0]} Run node scripts/check-plan.mjs.`);
  if (warnings.length) out.push(`Upkeep: ${warnings.join(' ')}`);
  console.log(out.join('\n'));
  process.exit(0);
}

errors.forEach((e) => console.log(`✗  ${e}`));
warnings.forEach((w) => console.log(`!  ${w}`));
console.log(errors.length
  ? `The plan is broken in ${errors.length} place(s).`
  : `The plan is sound: ${stages.length} stages, ${decisions.length} decisions, ${queue.length} open calls, ${features.length} features, ${inbox} in the inbox.`);
process.exit(errors.length ? 1 : 0);
