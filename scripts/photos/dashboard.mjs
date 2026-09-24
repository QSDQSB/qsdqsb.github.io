#!/usr/bin/env node
/**
 * The migration at a glance: one self-contained HTML page built from the
 * same rows as photos:status. Every photograph sits in exactly one stage:
 *
 *   original     live on img.qsdqsb.com from the camera original
 *   compressed   live, but still the bootstrap's compressed copy
 *   awaiting     in the originals bucket, not rendered yet
 *   local        only on this machine
 *
 * "Re-collected" counts an original as soon as it is in photos/, before it
 * is pushed; the bar still shows where each photograph is on its way live.
 *
 * Above the numbers, a strip of pipeline checks (lib/setup-checks.mjs) shows
 * which links of the Cloudflare chain are wired up: rclone remote, bucket,
 * custom domain, GitHub secrets, Worker, last processing run.
 *
 * Bars are drawn to one scale across galleries, so a long bar is a big
 * voyage. Problems are the same ones photos:status fails on.
 *
 * Transitional, like the `compressed` column it visualises: retire it with
 * the rest of the re-collection scaffolding.
 *
 * A Desktop inbox panel shows the staging folder (PHOTOS_INBOX) as
 * photos:import sees it: verified files waiting, files already imported,
 * and every non-match with its reason and the discard command, so nothing
 * leaves the Desktop without the owner seeing why.
 *
 * Usage: npm run photos:dashboard [-- --offline] [--no-fetch] [--out <file>] [--open]
 *        npm run photos:dashboard -- --serve [--port 4460]     live, rebuilt on change
 *        npm run photos:dashboard -- --artifact <file>          the page as an Artifact body, for claude.ai
 *   writes .photos-local/dashboard.html (gitignored) unless --out says otherwise
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PATHS, env, parseArgs } from './lib/config.mjs';
import { collect } from './status.mjs';
import http from 'node:http';
import os from 'node:os';
import { setupChecks } from './lib/setup-checks.mjs';
import { planImport, NON_MATCH } from './import.mjs';

const STAGES = [
  ['original', 'original, live'],
  ['compressed', 'compressed copy, live'],
  ['awaiting', 'pushed, awaiting render'],
  ['localOnly', 'local only'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (n, d) => d ? Math.round((n / d) * 100) : 0;

const recollected = (r) => Math.max(r.localOriginals || 0, r.stages.original);

export function totals(rows) {
  const t = { galleries: rows.length, photos: 0, recollected: 0, live: 0, original: 0, compressed: 0, awaiting: 0, localOnly: 0, captioned: 0, located: 0, pending: 0, problems: 0, galleriesLive: 0, galleriesDone: 0 };
  for (const r of rows) {
    const s = r.stages;
    const n = s.original + s.compressed + s.awaiting + s.localOnly;
    t.photos += n; t.original += s.original; t.compressed += s.compressed; t.awaiting += s.awaiting; t.localOnly += s.localOnly;
    // Re-collected: an original on this machine or live, whichever this machine can see more of.
    t.recollected += recollected(r);
    t.located += (r.located?.gps || 0) + (r.located?.visual || 0);
    t.live += r.processed; t.captioned += r.captioned; t.pending += r.pending.length; t.problems += r.problems.length;
    if (r.processed) t.galleriesLive++;
    if (n && recollected(r) === n) t.galleriesDone++;
  }
  return t;
}

function bar(stages, scale) {
  const segs = STAGES.map(([k]) => [k, stages[k]]).filter(([, n]) => n);
  return `<div class="bar" style="width:${scale}%">${segs.map(([k, n]) => `<i class="s-${k}" style="flex:${n}" title="${n} ${STAGES.find(s => s[0] === k)[1]}"></i>`).join('')}</div>`;
}

/** Pure: rows + context → HTML. */
/**
 * The Desktop staging folder, as photos:import would treat it right now:
 * verified files waiting, files already imported, and the files that match
 * nothing, with why.
 */
export async function inboxSnapshot(dir) {
  const abs = path.resolve(String(dir).replace(/^~(?=$|\/)/, os.homedir()));
  if (!fs.existsSync(abs)) return { dir: abs, exists: false, files: [] };
  const plan = await planImport(abs);
  return { dir: abs, exists: true, files: plan.map(s => ({ rel: s.rel, action: s.action, gallery: s.gallery, why: s.why || null, placed: s.placed || null })) };
}

/** The Apple Photos collector, from its log and lock: running or idle, and its last lines. */
export function collectorStatus(dir = path.join(PATHS.localStore, 'collect')) {
  let running = false, lines = [];
  try { const pid = Number(fs.readFileSync(path.join(dir, 'lock'), 'utf8')); process.kill(pid, 0); running = true; } catch { /* idle */ }
  try { lines = fs.readFileSync(path.join(dir, 'log.txt'), 'utf8').trim().split('\n').slice(-4); } catch { /* never run */ }
  return { running, lines };
}

function collectorSection(c) {
  if (!c || (!c.running && !c.lines.length)) return '';
  return `<section class="collector"><h2>Apple Photos collector <span class="${c.running ? 'live' : 'dim'}">${c.running ? '● running' : 'idle'}</span></h2>
<pre>${c.lines.map(esc).join('\n')}</pre></section>`;
}

function inboxSection(inbox) {
  if (!inbox) return '';
  if (!inbox.exists) return `<section class="inbox"><h2>Desktop inbox</h2><p class="dim">${esc(inbox.dir)} does not exist.</p></section>`;
  const f = inbox.files;
  const waiting = f.filter(x => x.action === 'add' || x.action === 'replace');
  const done = f.filter(x => x.action === 'same');
  const bad = f.filter(x => NON_MATCH.has(x.action));
  const verdict = (x) => ({ refuse: 'refused', unplaced: 'no match', duplicate: 'duplicate' }[x.action]);
  const rows = bad.map(x => `<li><b title="${esc(x.rel)}">${esc(x.rel)}</b><span class="verdict">${esc(verdict(x))}</span><small>${esc(x.why)}</small></li>`).join('');
  return `<section class="inbox"><h2>Desktop inbox <span class="dim">${esc(inbox.dir)}</span></h2>
<div class="kpis">
<div class="kpi"><b>${waiting.length}</b><small>verified, waiting to import</small></div>
<div class="kpi"><b>${done.length}</b><small>already in photos/, can move</small></div>
<div class="kpi ${bad.length ? 'bad' : ''}"><b>${bad.length}</b><small>non-matches to decide</small></div>
</div>
${waiting.length ? `<p class="dim">Import: <code>npm run photos:import -- --move</code> (${[...new Set(waiting.map(x => x.gallery))].join(', ')})</p>` : ''}
${bad.length ? `<ul class="nonmatch">${rows}</ul>
<p class="dim note">Nothing here leaves the Desktop until you decide. To add one to a voyage anyway, move it into that voyage's folder in the inbox. To discard one: <code>npm run photos:import -- --discard "&lt;file&gt;"</code>, which moves it to the Trash.</p>` : ''}
</section>`;
}

export function renderDashboard(rows, { generated = new Date().toISOString(), bucketNote = null, unreachable = 0, base = 'https://img.qsdqsb.com', setup = [], inbox = null, collector = null, live = false } = {}) {
  const t = totals(rows);
  const max = Math.max(1, ...rows.map(r => Object.values(r.stages).reduce((a, b) => a + b, 0)));
  const kpi = (label, value, of, cls = '') => `<div class="kpi ${cls}"><b>${value}</b>${of != null ? `<span class="of">/${of}</span>` : ''}<small>${label}</small></div>`;

  const body = rows.map(r => {
    const n = Object.values(r.stages).reduce((a, b) => a + b, 0);
    const [parent, child] = r.gallery.includes('/') ? [r.gallery.slice(0, r.gallery.lastIndexOf('/') + 1), r.gallery.slice(r.gallery.lastIndexOf('/') + 1)] : ['', r.gallery];
    const state = r.problems.length ? 'bad' : n && recollected(r) === n ? 'done' : '';
    return `<tr class="${state}">
      <th scope="row"><span class="parent">${esc(parent)}</span>${esc(child)}${r.referenced ? '' : ' <em title="no voyage names this gallery">unlinked</em>'}</th>
      <td class="bars">${bar(r.stages, Math.max(2, (n / max) * 100))}</td>
      <td class="num">${n}</td>
      <td class="num">${recollected(r)}<span class="dim"> · ${pct(recollected(r), n)}%</span></td>
      <td class="num">${r.captioned}<span class="dim">/${r.processed}</span></td>
      <td class="num" title="${r.located.gps} from GPS, ${r.located.visual} visual guess, ${r.located.pending} to guess, ${r.located.awaiting} awaiting original">${r.located.gps + r.located.visual}${r.located.pending ? `<span class="prob"> +${r.located.pending}?</span>` : ''}<span class="dim">/${n}</span></td>
      <td class="num">${r.bucket == null ? '<span class="dim">–</span>' : r.pending.length || '<span class="dim">0</span>'}</td>
      <td class="when">${r.lastProcessed ? esc(r.lastProcessed.slice(0, 16).replace('T', ' ')) : '<span class="dim">never</span>'}</td>
      <td class="num prob" title="${esc(r.problems.join('\n'))}">${r.problems.length || ''}</td>
    </tr>`;
  }).join('\n');

  const problemList = rows.filter(r => r.problems.length).map(r =>
    `<li><b>${esc(r.gallery)}</b> ${r.problems.map(esc).join(' · ')}</li>`).join('');

  const pipeline = setup.length ? `<section class="pipeline" aria-label="pipeline readiness">${setup.map(c =>
    `<span class="chk ${c.state}" title="${esc(c.detail)}"><i></i>${esc(c.label)}<small>${esc(c.detail)}</small></span>`).join('')}</section>` : '';

  const overall = { original: t.original, compressed: t.compressed, awaiting: t.awaiting, localOnly: t.localOnly };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${live ? `
<script>
// Live mode: ask the local server which snapshot it holds; reload when it changes.
const shown = ${JSON.stringify(generated)};
setInterval(() => fetch('/version', { cache: 'no-store' }).then(r => r.text()).then(v => { if (v && v !== shown) location.reload(); }).catch(() => {}), 5000);
</script>` : ''}
<title>Photo migration</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Playfair+Display:wght@600&display=swap">
<style>
:root{color-scheme:dark;--bg:#0e0e10;--panel:#16161a;--line:#26262c;--ink:#ece6da;--dim:#8a8479;--original:#5f9384;--compressed:#b89a5a;--awaiting:#4f6a93;--localOnly:#5a5363;--bad:#a44848}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){color-scheme:light;--bg:#f6f2ea;--panel:#fffdf8;--line:#e2dbcd;--ink:#1d1b18;--dim:#6f685e;--original:#3f7466;--compressed:#94763a;--awaiting:#3e5a86;--localOnly:#b8b0c2;--bad:#9a3a3a}}
:root[data-theme="light"]{color-scheme:light;--bg:#f6f2ea;--panel:#fffdf8;--line:#e2dbcd;--ink:#1d1b18;--dim:#6f685e;--original:#3f7466;--compressed:#94763a;--awaiting:#3e5a86;--localOnly:#b8b0c2;--bad:#9a3a3a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.35 "Barlow",-apple-system,system-ui,sans-serif;font-variant-numeric:tabular-nums}
main{max-width:1180px;margin:0 auto;padding:20px 16px 40px}
header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:12px}
h1{font:600 22px/1 "Playfair Display",Didot,Georgia,serif;margin:0;letter-spacing:.01em}
.meta{color:var(--dim);font-size:12px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:10px}
.kpi{background:var(--panel);padding:8px 10px}.kpi b{font-size:20px;font-weight:600}.kpi .of{color:var(--dim)}.kpi small{display:block;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;font-size:10px;margin-top:2px}
.kpi.bad b{color:var(--bad)}
.pipeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:10px}
.chk{background:var(--panel);padding:6px 10px;font-size:12px}.chk i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:var(--localOnly)}
.chk small{display:block;color:var(--dim);font-size:10px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.inbox{margin:0 0 14px}.inbox h2{font:600 13px/1 "Barlow",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px}.inbox h2 .dim{text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px}
.inbox .kpis{margin-bottom:8px}.nonmatch{list-style:none;margin:0;padding:0;border:1px solid var(--line);background:var(--panel)}
.nonmatch li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 14px;padding:5px 10px;border-bottom:1px solid var(--line);font-size:12px}
.nonmatch li:last-child{border-bottom:0}.nonmatch b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nonmatch .verdict{color:var(--bad)}.nonmatch small{grid-column:1/-1;color:var(--dim);font-size:11px}.note{font-size:12px;margin:6px 0 0}.nonmatch code,.inbox code{font-size:11px;color:var(--ink)}
.live{color:var(--original)}
.collector{margin:0 0 14px}.collector h2{font:600 13px/1 "Barlow",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px}.collector h2 span{text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px}
.collector pre{margin:0;padding:8px 10px;background:var(--panel);border:1px solid var(--line);font-size:11px;white-space:pre-wrap;color:var(--dim)}
.chk.ok i{background:var(--original)}.chk.fail i{background:var(--bad)}.chk.fail small{color:var(--bad)}
.overall{display:flex;height:10px;margin:0 0 6px}.overall i,.bar i{display:block;min-width:2px}
.legend{display:flex;gap:14px;flex-wrap:wrap;color:var(--dim);font-size:11px;margin-bottom:14px}.legend span::before{content:"";display:inline-block;width:9px;height:9px;margin-right:5px;vertical-align:-1px;background:var(--c)}
.s-original{background:var(--original)}.s-compressed{background:var(--compressed)}.s-awaiting{background:var(--awaiting)}.s-localOnly{background:var(--localOnly)}
.wrap{overflow-x:auto;border:1px solid var(--line)}
table{border-collapse:collapse;width:100%;min-width:720px;background:var(--panel)}
th,td{padding:3px 8px;border-bottom:1px solid var(--line);white-space:nowrap;text-align:left}
thead th{position:sticky;top:0;background:var(--panel);color:var(--dim);font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-size:10px}
tbody th{font-weight:500}.parent{color:var(--dim)}em{color:var(--dim);font-size:10px;font-style:normal;border:1px solid var(--line);padding:0 4px}
td.bars{width:44%}.bar{display:flex;height:9px}
.num,.when{text-align:right}.dim{color:var(--dim)}.prob{color:var(--bad);font-weight:600;cursor:help}
tr.bad th::before{content:"";display:inline-block;width:3px;height:11px;background:var(--bad);margin:0 6px -1px -8px}
tr.done th::after{content:" ✓";color:var(--original)}
details{margin-top:14px}summary{cursor:pointer;color:var(--dim);font-size:12px}ul{margin:8px 0 0;padding-left:18px;color:var(--dim)}li b{color:var(--ink);font-weight:500}
</style></head><body><main>
<header><h1>Photo migration</h1><span class="meta">${live ? '<span class="live">● live</span> · ' : ''}${esc(generated.slice(0, 16).replace('T', ' '))} UTC · ${esc(base)}${bucketNote ? ` · bucket not read: ${esc(bucketNote)}` : ''}${unreachable ? ` · ${unreachable} manifest(s) unreachable` : ''}</span></header>
${pipeline}
${collectorSection(collector)}
${inboxSection(inbox)}
<section class="kpis">
${kpi('originals re-collected', t.recollected, t.photos)}
${kpi('originals live', t.original, t.photos)}
${kpi('photos live', t.live, t.photos)}
${kpi('galleries live', t.galleriesLive, t.galleries)}
${kpi('galleries complete', t.galleriesDone, t.galleries)}
${kpi('captioned', t.captioned, t.live)}
${kpi('located', t.located, t.photos)}
${kpi('awaiting render', t.awaiting, null)}
${kpi('not pushed', bucketNote ? '–' : t.pending, null)}
${kpi('problems', t.problems, null, t.problems ? 'bad' : '')}
</section>
<div class="overall">${STAGES.map(([k]) => overall[k] ? `<i class="s-${k}" style="flex:${overall[k]}" title="${overall[k]} ${STAGES.find(s => s[0] === k)[1]}"></i>` : '').join('')}</div>
<div class="legend">${STAGES.map(([k, label]) => `<span style="--c:var(--${k})">${label} <b>${overall[k]}</b></span>`).join('')}</div>
<div class="wrap"><table>
<thead><tr><th>gallery</th><th>stages</th><th class="num">photos</th><th class="num">originals</th><th class="num">captioned</th><th class="num" title="place names: from GPS · by a visual guess · to guess · awaiting the original">located</th><th class="num">unpushed</th><th class="num">last render</th><th class="num">!</th></tr></thead>
<tbody>
${body}
</tbody></table></div>
${problemList ? `<details${t.problems <= 12 ? ' open' : ''}><summary>${t.problems} problem(s) in ${rows.filter(r => r.problems.length).length} galler${rows.filter(r => r.problems.length).length === 1 ? 'y' : 'ies'}</summary><ul>${problemList}</ul></details>` : ''}
</main></body></html>
`;
}

/** Everything the page shows, read fresh. */
async function snapshot(args) {
  const [{ rows, bucketNote, unreachable }, setup, inbox] = await Promise.all([
    collect({ offline: !!args.offline, fetch: !args['no-fetch'] }),
    setupChecks({ offline: !!args.offline }),
    inboxSnapshot(env.inbox),
  ]);
  return { rows, bucketNote, unreachable, setup, inbox, collector: collectorStatus(), generated: new Date().toISOString() };
}

/**
 * Live mode: a local server that rebuilds the snapshot when the Desktop
 * inbox, photos/ or the authored YAML change (debounced), and every minute
 * for what changes elsewhere (the bucket, the workflow, img.qsdqsb.com).
 * The page polls /version and reloads when a newer snapshot exists.
 */
/**
 * One snapshot in a short-lived child process: sharp, the fingerprint index
 * and the manifests are freed with it, so a server rebuilding every minute
 * for weeks keeps a flat footprint (in-process rebuilds grew past 2 GB).
 */
function snapshotInChild(args) {
  const extra = [args.offline ? '--offline' : null, args['no-fetch'] ? '--no-fetch' : null].filter(Boolean);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--emit-snapshot', ...extra], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    const kill = setTimeout(() => child.kill('SIGKILL'), 10 * 60 * 1000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => {
      clearTimeout(kill);
      if (code !== 0) return reject(new Error((err || `snapshot exited ${code}`).trim().split('\n').pop()));
      try { resolve(JSON.parse(out)); } catch (e) { reject(e); }
    });
  });
}

async function serve(args, out) {
  const port = Number(args.port) || 4460;
  let snap = await snapshotInChild(args), html = '', building = null, again = false;
  const render = () => { html = renderDashboard(snap.rows, { ...snap, base: env.publicBase, live: true }); fs.writeFileSync(out, renderDashboard(snap.rows, { ...snap, base: env.publicBase })); };
  render();
  const rebuild = async (why) => {
    if (building) { again = true; return; }
    building = (async () => { try { snap = await snapshotInChild(args); render(); console.log(`${snap.generated.slice(11, 19)} rebuilt (${why})`); } catch (e) { console.error(`rebuild failed: ${e.message}`); } })();
    await building; building = null;
    if (again) { again = false; rebuild('changes during the last rebuild'); }
  };
  let timer = null;
  const soon = (why) => { clearTimeout(timer); timer = setTimeout(() => rebuild(why), 2000); };
  const watch = (dir, label) => { try { if (fs.existsSync(dir)) fs.watch(dir, { recursive: true }, () => soon(`${label} changed`)); } catch { /* not watchable: the minute timer still covers it */ } };
  watch(inboxSnapshotDir(), 'Desktop inbox');
  watch(PATHS.photosDir, 'photos/');
  watch(PATHS.authoredDir, '_data/photos');
  setInterval(() => rebuild('minute'), 60000);

  http.createServer((req, res) => {
    if (req.url === '/version') { res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); return res.end(snap.generated); }
    if (req.url === '/snapshot.json') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(JSON.stringify(snap)); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(html);
  }).listen(port, '127.0.0.1', () => console.log(`photo dashboard live at http://127.0.0.1:${port} (Ctrl-C to stop)`));
}
const inboxSnapshotDir = () => path.resolve(String(env.inbox).replace(/^~(?=$|\/)/, os.homedir()));

/**
 * The same page as an Artifact body: the publish skeleton supplies doctype,
 * head and body, so only the title, styles and content are kept.
 */
export function artifactFragment(html) {
  return html.replace(/^<!doctype html>\s*<html[^>]*><head>/i, '').replace(/<meta [^>]*>/gi, '')
    .replace(/<\/head><body>/i, '').replace(/<\/body><\/html>\s*$/i, '');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.artifact) {
    // Prefer the live server's latest snapshot: instant, and exactly what the local page shows.
    let snap = null;
    try { snap = await (await fetch(`http://127.0.0.1:${Number(args.port) || 4460}/snapshot.json`, { signal: AbortSignal.timeout(5000) })).json(); } catch { snap = await snapshot(args); }
    const file = path.resolve(String(args.artifact));
    fs.writeFileSync(file, artifactFragment(renderDashboard(snap.rows, { ...snap, base: env.publicBase })));
    console.log(`${file}: snapshot of ${snap.generated}`);
    return 0;
  }
  const out = path.resolve(typeof args.out === 'string' ? args.out : path.join(PATHS.localStore, 'dashboard.html'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (args['emit-snapshot']) { process.stdout.write(JSON.stringify(await snapshot(args))); return 0; }
  if (args.serve) { await serve(args, out); return null; }

  const snap = await snapshot(args);
  fs.writeFileSync(out, renderDashboard(snap.rows, { ...snap, base: env.publicBase }));
  const t = totals(snap.rows);
  const bad = snap.inbox.files.filter(x => NON_MATCH.has(x.action)).length;
  console.log(`${path.relative(process.cwd(), out)}: ${t.recollected}/${t.photos} originals re-collected, ${t.original} live, ${t.problems} problem(s)`);
  console.log(`pipeline: ${snap.setup.map(c => `${c.state === 'ok' ? '✓' : c.state === 'fail' ? '✗' : '·'} ${c.id}`).join('  ')}`);
  console.log(`inbox: ${snap.inbox.files.length} file(s) on the Desktop, ${bad} non-match(es) to decide`);
  if (args.open) spawnSync('open', [out]);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => { if (c !== null) process.exit(c); }, e => { console.error(e); process.exit(2); });
