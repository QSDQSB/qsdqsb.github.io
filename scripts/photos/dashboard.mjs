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
 * Usage: npm run photos:dashboard [-- --offline] [--no-fetch] [--out <file>] [--open]
 *   writes .photos-local/dashboard.html (gitignored) unless --out says otherwise
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PATHS, parseArgs } from './lib/config.mjs';
import { collect } from './status.mjs';
import { setupChecks } from './lib/setup-checks.mjs';

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
  const t = { galleries: rows.length, photos: 0, recollected: 0, live: 0, original: 0, compressed: 0, awaiting: 0, localOnly: 0, captioned: 0, pending: 0, problems: 0, galleriesLive: 0, galleriesDone: 0 };
  for (const r of rows) {
    const s = r.stages;
    const n = s.original + s.compressed + s.awaiting + s.localOnly;
    t.photos += n; t.original += s.original; t.compressed += s.compressed; t.awaiting += s.awaiting; t.localOnly += s.localOnly;
    // Re-collected: an original on this machine or live, whichever this machine can see more of.
    t.recollected += recollected(r);
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
export function renderDashboard(rows, { generated = new Date().toISOString(), bucketNote = null, unreachable = 0, base = 'https://img.qsdqsb.com', setup = [] } = {}) {
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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Photo migration</title>
<style>
:root{--bg:#0e0e10;--panel:#16161a;--line:#26262c;--ink:#ece6da;--dim:#8a8479;--original:#5f9384;--compressed:#b89a5a;--awaiting:#4f6a93;--localOnly:#5a5363;--bad:#a44848}
@media (prefers-color-scheme:light){:root{--bg:#f6f2ea;--panel:#fffdf8;--line:#e2dbcd;--ink:#1d1b18;--dim:#7a7368;--localOnly:#b8b0c2}}
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
<header><h1>Photo migration</h1><span class="meta">${esc(generated.slice(0, 16).replace('T', ' '))} UTC · ${esc(base)}${bucketNote ? ` · bucket not read: ${esc(bucketNote)}` : ''}${unreachable ? ` · ${unreachable} manifest(s) unreachable` : ''}</span></header>
${pipeline}
<section class="kpis">
${kpi('originals re-collected', t.recollected, t.photos)}
${kpi('originals live', t.original, t.photos)}
${kpi('photos live', t.live, t.photos)}
${kpi('galleries live', t.galleriesLive, t.galleries)}
${kpi('galleries complete', t.galleriesDone, t.galleries)}
${kpi('captioned', t.captioned, t.live)}
${kpi('awaiting render', t.awaiting, null)}
${kpi('not pushed', bucketNote ? '–' : t.pending, null)}
${kpi('problems', t.problems, null, t.problems ? 'bad' : '')}
</section>
<div class="overall">${STAGES.map(([k]) => overall[k] ? `<i class="s-${k}" style="flex:${overall[k]}" title="${overall[k]} ${STAGES.find(s => s[0] === k)[1]}"></i>` : '').join('')}</div>
<div class="legend">${STAGES.map(([k, label]) => `<span style="--c:var(--${k})">${label} <b>${overall[k]}</b></span>`).join('')}</div>
<div class="wrap"><table>
<thead><tr><th>gallery</th><th>stages</th><th class="num">photos</th><th class="num">originals</th><th class="num">captioned</th><th class="num">unpushed</th><th class="num">last render</th><th class="num">!</th></tr></thead>
<tbody>
${body}
</tbody></table></div>
${problemList ? `<details${t.problems <= 12 ? ' open' : ''}><summary>${t.problems} problem(s) in ${rows.filter(r => r.problems.length).length} galler${rows.filter(r => r.problems.length).length === 1 ? 'y' : 'ies'}</summary><ul>${problemList}</ul></details>` : ''}
</main></body></html>
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { env } = await import('./lib/config.mjs');
  const [{ rows, bucketNote, unreachable }, setup] = await Promise.all([
    collect({ offline: !!args.offline, fetch: !args['no-fetch'] }),
    setupChecks({ offline: !!args.offline }),
  ]);
  const out = path.resolve(typeof args.out === 'string' ? args.out : path.join(PATHS.localStore, 'dashboard.html'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderDashboard(rows, { bucketNote, unreachable, base: env.publicBase, setup }));
  const t = totals(rows);
  console.log(`${path.relative(process.cwd(), out)}: ${t.recollected}/${t.photos} originals re-collected, ${t.original} live, ${t.problems} problem(s)`);
  console.log(`pipeline: ${setup.map(c => `${c.state === 'ok' ? '✓' : c.state === 'fail' ? '✗' : '·'} ${c.id}`).join('  ')}`);
  if (args.open) spawnSync('open', [out]);
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().then(c => process.exit(c), e => { console.error(e); process.exit(2); });
