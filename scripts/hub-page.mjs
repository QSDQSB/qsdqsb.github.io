#!/usr/bin/env node
/**
 * The command centre: one page for the owner, built from `_plan/`.
 *
 * Where the site stands (the current stage and its progress), what is waiting on the owner (the
 * queue, each call answerable in one tap), the ideas (a box to say a new one, and each shaped one
 * with the lead's verdict, its for and against, what it changes, its questions as taps, and Pursue,
 * Park and Drop), the roadmap, what changed, what has been found, every
 * decision, the feature map, and the principles and architecture in full. It is generated, never
 * written by hand, so it cannot disagree with the plan it shows (_plan/decisions/0006).
 *
 *   node scripts/hub-page.mjs            # writes design/hub/hub.html (design/ is gitignored)
 *
 * Publish it with the Artifact tool to the address in `_plan/hub.json` (capabilities
 * { db: {}, user: {}, comments: {} }: the last lets the page tell a watching session that the owner
 * has answered). The owner's answers land in the page's `answers` collection, one document
 * per queue id, idea id (`I001`) or idea question (`I001-2`), and a new idea in `ideas`; a session reads them back with ArtifactData,
 * records the answers in QUEUE.md (`plan.mjs answer`), the owner's decision on an idea in its file
 * (`plan.mjs decide`), and files each new idea with `plan.mjs idea`.
 *
 * Exit codes: 0 written · 2 the plan could not be read
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { esc, inline, markdown } from './lib/plan-markdown.mjs';
import { OPTION } from './lib/plan-ideas.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// `PLAN_DIR` and `--out <file>` build the page from another plan, somewhere else (the tests do).
const PLAN = process.env.PLAN_DIR ? path.resolve(process.env.PLAN_DIR) : path.join(ROOT, '_plan');
const outAt = process.argv.indexOf('--out');
const OUT = outAt > 0 ? path.resolve(process.argv[outAt + 1]) : path.join(ROOT, 'design', 'hub', 'hub.html');
const read = (rel) => fs.readFileSync(path.join(PLAN, rel), 'utf8');

let state;
try {
  // Exit 1 means "broken", and the page should say so rather than not be built.
  const out = (() => { try { return execFileSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); } catch (e) { return e.stdout; } })();
  state = JSON.parse(out);
} catch (e) { console.error(`The plan could not be read: ${e.message}`); process.exit(2); }

const roadmapRows = read('ROADMAP.md').split('\n').map((l) => l.match(/^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/)).filter(Boolean)
  .map((m) => ({ n: Number(m[1]), name: m[2], gets: m[3].trim(), tier: m[5].trim() }));
const stageOf = (n) => state.stages.find((s) => s.n === n);
const pct = (s) => (s.done + s.open ? Math.round((100 * s.done) / (s.done + s.open)) : 0);
const inboxLines = (read('findings/inbox.md').split(/^## Taken/m)[0].match(/^- .+$/gm) || []).map((l) => l.slice(2));
// The owner's requests (decisions/0010): what they asked for, open and done, in their words.
const requestsBody = fs.existsSync(path.join(PLAN, 'requests.md')) ? read('requests.md') : '';
const requestsOf = (part) => { const at = requestsBody.indexOf(`## ${part}`); if (at < 0) return []; const rest = requestsBody.slice(at + part.length + 3); const next = rest.indexOf('\n## '); return (next < 0 ? rest : rest.slice(0, next)).split('\n').filter((l) => /^- \d{4}-\d{2}-\d{2} · R\d+ · /.test(l)).map((l) => l.slice(2)); };
const requestsOpen = requestsOf('Open'), requestsDone = requestsOf('Done');
const built = new Date().toISOString().slice(0, 10);
const now = state.now;
const choices = Object.entries(state.hub.choices || {});
const doc = (rel, title) => `<details class="doc"><summary>${esc(title)}</summary><div class="md">${markdown(read(rel))}</div></details>`;

// An idea comes back with four things, in the order the owner needs them: the verdict, what speaks
// for and against it, what it would change in the site as it stands, and how the sentence was read.
const VERDICT_TONE = { Pursue: 'ok', 'Pursue, turned': 'ok', Park: 'warn', Drop: 'bad' };
const VERDICT_TAP = { Pursue: 'pursue', 'Pursue, turned': 'pursue', Park: 'park', Drop: 'drop' };
const more = (title, body, hint = '') => (body ? `<details class="more"><summary>${esc(title)}${hint ? `<span>${esc(hint)}</span>` : ''}</summary><div class="md">${markdown(body, { skipTitle: false })}</div></details>` : '');
function ideaCard(i) {
  const head = `<h3><span class="id">${i.id}</span>${inline(i.title)} <span class="st ${i.status === 'shaped' ? 'designing' : i.status === 'staged' ? 'done' : ''}">${esc(i.status)}</span></h3>
      ${i.by === 'lead' ? '<p class="label" style="margin-top:10px">Proposed by the lead</p>' : ''}
      <p class="words">${inline(i.words)}</p>`;
  const count = (tally, order) => order.filter((k) => tally[k]).map((k) => `${tally[k]} ${k}`).join(', ');
  if (i.status === 'raw') return `<article class="call" id="${i.id}" data-answered="false">${head}<p class="muted" style="margin-top:10px">Kept. Not yet worked through: the next session makes it explicit, weighs it and brings it back with a verdict.</p></article>`;
  const sizes = ['large', 'medium', 'small'].filter((k) => i.sizes[k]).map((k) => `${i.sizes[k]} ${k}`).join(', ');
  // The questions stay for as long as the idea is live: one left untapped at Pursue is still open.
  const live = ['shaped', 'study'].includes(i.status), open = live && !i.owner;
  return `<article class="call" id="${i.id}" data-answered="false">${head}
      ${i.verdict ? `<div class="verdict"><p class="label">The lead's verdict</p><p><span class="chip ${VERDICT_TONE[i.verdict]}">${esc(i.verdict)}</span></p><div class="md">${markdown(i.verdictText, { skipTitle: false })}</div></div>` : ''}
      ${i.waitsOn ? `<p class="waits"><b>Waits on</b>${inline(i.waitsOn)}</p>` : ''}
      ${i.owner ? `<p class="decided"><span class="chip ok">You: ${esc(i.owner.decision)}</span> ${esc(i.owner.date)}${i.owner.note ? ` · ${inline(i.owner.note)}` : ''}</p>` : ''}
      ${i.pros.length || i.cons.length ? `<div class="weigh">
        <div><p class="label">For</p><ul>${i.pros.map((t) => `<li>${inline(t)}</li>`).join('')}</ul></div>
        <div><p class="label">Against</p><ul>${i.cons.map((t) => `<li>${inline(t)}</li>`).join('')}</ul></div>
      </div>` : ''}
      ${i.changes.length ? `<details class="more"><summary>What it changes in the site as it stands<span>${i.touched} part${i.touched === 1 ? '' : 's'} touched${sizes ? `: ${sizes}` : ''}</span></summary>
        <dl class="changes">${i.changes.map((r) => `<div><dt>${inline(r.part)}<span class="size ${esc(r.size.split(/[ ,]/)[0].toLowerCase())}">${inline(r.size)}</span></dt><dd><b>Today</b>${inline(r.today)}</dd><dd><b>With it</b>${inline(r.after)}</dd></div>`).join('')}</dl>
        ${i.changesNote ? `<div class="md">${markdown(i.changesNote, { skipTitle: false })}</div>` : ''}</details>` : ''}
      ${i.delivery.length ? `<details class="more"><summary>Can it be delivered<span>${esc(count(i.results, ['proved', 'failed', 'open']))}</span></summary>
        <dl class="changes">${i.delivery.map((r) => `<div><dt>${inline(r.claim)}<span class="size ${esc(r.is || '')}">${esc(r.is || '')}</span></dt><dd><b>Tried</b>${inline(r.tried)}</dd><dd><b>Result</b>${inline(r.result)}</dd></div>`).join('')}</dl>
        ${i.deliveryNote ? `<div class="md">${markdown(i.deliveryNote, { skipTitle: false })}</div>` : ''}</details>` : ''}
      ${i.objections.length ? `<details class="more"><summary>Argued against by ${esc(i.challengedBy.replace(/^the /, 'the '))}<span>${i.objections.length} objection${i.objections.length === 1 ? '' : 's'}: ${esc(count(i.outcomes, ['stands', 'changed', 'answered']))}</span></summary>
        <ul class="objections">${i.objections.map((o) => `<li><span class="size ${esc(o.is || '')}">${esc(o.is || '')}</span>${inline(o.text)}</li>`).join('')}</ul></details>` : ''}
      ${more('How the sentence was read', i.explicit)}
      ${more('The shapes it could take', i.shapes)}
      ${more('Does it fit the site', i.fit)}
      ${live && i.questions.length ? `<p class="label" style="margin-top:18px">Questions for you</p>${i.questions.map((q) => `<div class="ask">
        <h4>${q.n} · ${inline(q.title)}</h4>
        <div class="opts">${q.options.map((o) => `<button type="button" class="opt" data-q="${i.id}-${q.n}" data-o="${o.key}" aria-pressed="false"><b>${o.key}</b><span>${inline(o.text)}${o.recommended ? '<span class="rec">Recommended</span>' : ''}</span></button>`).join('')}</div>
        ${q.why ? `<p class="muted">${inline(q.why)}</p>` : ''}
      </div>`).join('')}` : ''}
      ${i.next ? `<p class="muted" style="margin-top:14px">Next: ${inline(i.next.replace(/\n+/g, ' '))}</p>` : ''}
      ${open ? `<p class="label" style="margin-top:18px">Your decision</p>
      <p class="muted" style="margin-top:6px">Pursue takes the next step above and nothing more. What a reader sees is a later call of yours.</p>
      <div class="opts row">${[['pursue', 'Pursue'], ['park', 'Park'], ['drop', 'Drop']].map(([k, t]) => `<button type="button" class="opt" data-q="${i.id}" data-o="${k}" aria-pressed="false"><span>${t}${VERDICT_TAP[i.verdict] === k ? '<span class="rec">The lead</span>' : ''}</span></button>`).join('')}</div>
      <input class="note" id="note-${i.id}" data-q="${i.id}" type="text" placeholder="A note: what to change, or why (optional)" aria-label="Note for ${i.id}">` : ''}
    </article>`;
}

// From the album (photos:harvest): the photographs the owner gathered in Apple Photos, each with
// where Claude would put it. Read from this machine's last look; the thumbnails are drawn into the
// page (no metadata, so no position), since the page is private. "Bring them in" is the owner's yes
// for exactly that set: it stores the destinations under the plan's hash, and a session records it
// with `photos:harvest -- go`, which refuses a hash the plan no longer has.
// A plan from elsewhere (PLAN_DIR, the tests) has no album on this machine: HARVEST_DIR names one.
const HARVEST = process.env.HARVEST_DIR ? path.resolve(process.env.HARVEST_DIR) : process.env.PLAN_DIR ? null : path.join(ROOT, '.photos-local', 'harvest');
const readLocal = (f) => { try { return HARVEST && JSON.parse(fs.readFileSync(path.join(HARVEST, f), 'utf8')); } catch { return null; } };
const harvest = readLocal('plan.json'), harvestLast = readLocal('last.json');
const harvestWaiting = (harvest?.items || []).filter((i) => i.status === 'waiting');
const thumbOf = async (id) => {
  const f = path.join(HARVEST, 'thumbs', `${id.replace(/[^A-Za-z0-9-]/g, '_')}.jpg`);
  if (!fs.existsSync(f)) return '';
  const { default: sharp } = await import('sharp');
  return `data:image/jpeg;base64,${(await sharp(f).resize(360, 360, { fit: 'inside' }).jpeg({ quality: 62 }).toBuffer()).toString('base64')}`;
};
const thumbs = Object.fromEntries(await Promise.all(harvestWaiting.map(async (i) => [i.id, await thumbOf(i.id)])));
const CONFIDENCE = { sure: ['ok', 'Sure'], likely: ['warn', 'Likely'], decided: ['ok', 'Judged'], open: ['bad', 'Open'] };
function albumCard(i) {
  const where = [i.place?.landmark, i.place?.city, i.place?.country].filter(Boolean).join(', ');
  const [tone, word] = CONFIDENCE[i.confidence] || ['', i.confidence];
  const options = [...new Set([...(harvest.voyages || []), ...(i.gallery && i.gallery !== 'hold' ? [i.gallery] : [])])].sort();
  return `<article class="shot">
      ${thumbs[i.id] ? `<img src="${thumbs[i.id]}" alt="${esc(i.frame)}${where ? `, ${esc(where)}` : ''}" loading="lazy">` : '<div class="nothumb"></div>'}
      <div>
        <h3><span class="id">${esc(i.frame)}</span>${esc(String(i.taken || '').slice(0, 10))}</h3>
        ${where ? `<p class="muted">${esc(where)}</p>` : ''}
        <label class="label" for="to-${esc(i.id)}" style="display:block;margin-top:12px">Goes to <span class="chip ${tone}">${esc(word)}</span></label>
        <select class="to" id="to-${esc(i.id)}" data-id="${esc(i.id)}" data-proposed="${esc(i.gallery || '')}">
          ${i.gallery ? '' : '<option value="" selected>Choose a voyage…</option>'}
          ${options.map((g) => `<option value="${esc(g)}"${g === i.gallery ? ' selected' : ''}>${esc(g)}${harvest.voyages.includes(g) ? '' : ' (new)'}</option>`).join('')}
          <option value="hold"${i.gallery === 'hold' ? ' selected' : ''}>Hold: leave it in the album</option>
        </select>
        <p class="muted" style="margin-top:8px">${esc(i.why || '')}</p>
      </div>
    </article>`;
}

// The page is built before the publish is recorded, so "the command centre is behind" would be baked
// into every copy of it (F053). That warning is for sessions, not for the page.
const pageWarnings = state.warnings.filter((w) => !/^The command centre is behind/.test(w));

const html = `<title>House of Wonders Command Centre</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,700;1,500&family=JetBrains+Mono:wght@400&display=swap">
<style>
/* A ledger, not a dashboard: one column to read top to bottom. What needs the owner comes first and
   is the only thing with filled controls; everything else is ruled text that opens when asked. */
:root {
  color-scheme: dark;
  --ground: #131313; --ground-2: #1b1b1c; --ground-3: #242426;
  --ink: #e6e3dc; --ink-2: #b3b0a8; --ink-3: #85827b; --rule: #343436;
  --brass: #c9a86a; --yes: #7fb7a4; --yes-bg: #17302a; --warn: #d2a85a; --warn-bg: #36290f; --bad: #d0705f; --bad-bg: #3a1f1c;
  --display: "Playfair Display", "Didot", Georgia, serif;
  --ui: "Barlow", "Helvetica Neue", Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { color-scheme: light; --ground: #f3f1ec; --ground-2: #eae7e0; --ground-3: #dedad1; --ink: #1d1c1a; --ink-2: #4a4843; --ink-3: #74716a; --rule: #cbc6ba; --brass: #7d6126; --yes: #256a55; --yes-bg: #d2e8e0; --warn: #7a5a12; --warn-bg: #f0e2bd; --bad: #9c3524; --bad-bg: #f1d9d3; } }
:root[data-theme="light"] { color-scheme: light; --ground: #f3f1ec; --ground-2: #eae7e0; --ground-3: #dedad1; --ink: #1d1c1a; --ink-2: #4a4843; --ink-3: #74716a; --rule: #cbc6ba; --brass: #7d6126; --yes: #256a55; --yes-bg: #d2e8e0; --warn: #7a5a12; --warn-bg: #f0e2bd; --bad: #9c3524; --bad-bg: #f1d9d3; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ground); color: var(--ink); font: 400 16px/1.55 var(--ui); -webkit-font-smoothing: antialiased; }
.sheet { --gutter: clamp(16px, 4vw, 40px); max-width: 980px; margin: 0 auto; padding-inline: var(--gutter); padding-block: 36px 96px; }
a { color: var(--brass); text-underline-offset: 3px; overflow-wrap: anywhere; }
code { font: 400 0.84em/1.5 var(--mono); background: var(--ground-3); padding: 0.06em 0.34em; border-radius: 3px; overflow-wrap: anywhere; }
pre { font: 400 0.78rem/1.5 var(--mono); background: var(--ground-2); border: 1px solid var(--rule); padding: 14px; overflow-x: auto; margin: 14px 0; }
p { margin: 0; }
:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
.label { margin: 0; font: 500 11px/1 var(--ui); letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
h1 { margin: 12px 0 0; font: 700 clamp(1.9rem, 4.4vw, 3rem)/1.06 var(--display); text-wrap: balance; }
h2 { margin: 0 0 4px; font: 700 clamp(1.3rem, 2.3vw, 1.7rem)/1.15 var(--display); text-wrap: balance; }
h3 { margin: 0; font: 600 1.04rem/1.35 var(--ui); }
section { margin-top: 56px; }
section > .label { margin-bottom: 10px; }
.sub { color: var(--ink-2); max-width: 66ch; margin-top: 6px; }
.health { display: flex; flex-wrap: wrap; gap: 8px 10px; margin-top: 18px; }
.chip { font: 600 10.5px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; padding: 5px 8px; border-radius: 3px; color: var(--ink-2); background: var(--ground-3); }
/* The way round the page: always in reach, one row that scrolls sideways on a phone. */
.jump { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; display: flex; gap: 8px; margin: 22px calc(-1 * var(--gutter, 20px)) 0; padding: 10px var(--gutter, 20px); overflow-x: auto; scrollbar-width: none; background: color-mix(in srgb, var(--ground) 94%, transparent); border-block: 1px solid var(--rule); }
.jump::-webkit-scrollbar { display: none; }
.jump .chip { flex: none; border: 0; cursor: pointer; padding: 9px 11px; white-space: nowrap; }
.jump .chip:hover { color: var(--ink); }
.jump .chip:focus-visible { outline: 1px solid var(--brass); outline-offset: 2px; }
.heard { margin: 10px 0 0; min-height: 1.3em; color: var(--ink-3); font-size: 0.86rem; }
.tell { margin-left: 6px; font: 600 0.8rem/1 var(--ui); color: var(--brass); background: none; border: 1px solid var(--brass); border-radius: 3px; padding: 6px 10px; cursor: pointer; }
.tell:hover { color: var(--ink); border-color: var(--ink-2); }
.jump .chip[aria-current="true"] { box-shadow: inset 0 -1px 0 var(--brass); color: var(--ink); }
h2, details.doc { scroll-margin-top: calc(env(safe-area-inset-top, 0px) + 64px); }
.chip.ok { color: var(--yes); background: var(--yes-bg); } .chip.warn { color: var(--warn); background: var(--warn-bg); } .chip.bad { color: var(--bad); background: var(--bad-bg); }
.notes { margin: 12px 0 0; padding-left: 1.1em; color: var(--ink-2); font-size: 0.92rem; }
.now { margin-top: 18px; padding: 18px 0; border-block: 1px solid var(--rule); display: grid; gap: 10px; }
.meter { height: 4px; background: var(--ground-3); } .meter i { display: block; height: 100%; background: var(--brass); }
.muted { color: var(--ink-3); font-size: 0.9rem; }
.call { padding: 20px 0 22px; border-bottom: 1px solid var(--rule); }
.call:first-of-type { border-top: 1px solid var(--rule); margin-top: 18px; }
.call[data-answered="true"] { box-shadow: inset 3px 0 0 var(--yes); padding-left: 14px; }
.call .id { font: 500 0.78rem/1 var(--mono); color: var(--ink-3); margin-right: 8px; }
.call .body { margin-top: 8px; color: var(--ink-2); max-width: 70ch; font-size: 0.96rem; }
.opts { display: grid; gap: 8px; margin-top: 14px; }
.opt { display: grid; grid-template-columns: 2rem minmax(0, 1fr); gap: 2px 10px; align-items: start; text-align: left; width: 100%; font: 400 0.95rem/1.45 var(--ui); color: var(--ink-2); background: none; border: 1px solid var(--rule); border-radius: 4px; padding: 11px 12px; cursor: pointer; }
.opt:hover { border-color: var(--ink-3); color: var(--ink); }
.opt b { font: 700 1.05rem/1.3 var(--display); color: var(--brass); }
.opts.row .opt { display: block; text-align: center; font-weight: 500; }
.opt .rec { display: inline-block; margin-left: 8px; font: 600 10px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--yes); }
.opt[aria-pressed="true"] { background: var(--yes-bg); border-color: var(--yes); color: var(--ink); }
.note { width: 100%; margin-top: 10px; font: 400 0.92rem/1.3 var(--ui); color: var(--ink); background: var(--ground-2); border: 1px solid var(--rule); border-radius: 4px; padding: 8px 10px; }
.note::placeholder { color: var(--ink-3); }
.status { color: var(--ink-3); font-size: 0.86rem; min-height: 1.3em; margin-top: 10px; }
.opts.row { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
.new { display: grid; gap: 10px; margin-top: 18px; padding: 18px 0; border-block: 1px solid var(--rule); }
.new label { font: 500 11px/1 var(--ui); letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
.new textarea { width: 100%; min-height: 5.2rem; resize: vertical; font: 400 1rem/1.5 var(--ui); color: var(--ink); background: var(--ground-2); border: 1px solid var(--rule); border-radius: 4px; padding: 10px 12px; }
.send { justify-self: start; font: 600 0.9rem/1 var(--ui); color: var(--ground); background: var(--ink); border: 0; border-radius: 4px; padding: 11px 18px; cursor: pointer; }
.send:disabled { opacity: 0.45; cursor: default; }
.sent { margin: 0; padding: 0; list-style: none; color: var(--ink-2); font-size: 0.92rem; display: grid; gap: 6px; }
.sent li::before { content: "Waiting to be filed · "; color: var(--ink-3); }
.words { margin: 10px 0 0; padding-left: 14px; border-left: 2px solid var(--brass); color: var(--ink); font: italic 500 1.05rem/1.45 var(--display); max-width: 60ch; }
.call .md { padding-bottom: 6px; }
.call details.more { margin-top: 2px; }
.call .weigh + details.more { margin-top: 12px; }
.call details.more > summary span { color: var(--ink-3); margin-left: 10px; }
.verdict { margin-top: 16px; }
.verdict .md { color: var(--ink); max-width: 64ch; margin-top: 8px; }
.waits { margin-top: 10px; color: var(--ink-2); font-size: 0.95rem; max-width: 64ch; }
.waits b, .changes dd b { display: inline-block; margin-right: 8px; font: 600 10.5px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--warn); }
.changes { margin: 10px 0 4px; }
.changes > div { padding: 10px 0; border-top: 1px solid var(--rule); }
.changes dt { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; color: var(--ink); font: 500 0.95rem/1.4 var(--ui); }
.changes dd { margin: 4px 0 0; color: var(--ink-2); font-size: 0.92rem; line-height: 1.5; max-width: 72ch; }
.changes dd b { color: var(--ink-3); min-width: 4.2rem; }
.size { font: 600 10.5px/1.3 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-3); text-align: right; }
.size.medium, .size.open, .size.changed { color: var(--warn); } .size.large, .size.failed, .size.stands { color: var(--bad); } .size.small, .size.answered { color: var(--ink-2); } .size.proved { color: var(--yes); }
.objections { list-style: none; margin: 10px 0 4px; padding: 0; }
.objections li { padding: 10px 0; border-top: 1px solid var(--rule); color: var(--ink-2); font-size: 0.92rem; line-height: 1.5; max-width: 72ch; }
.objections .size { display: block; margin-bottom: 6px; }
.decided { margin-top: 12px; color: var(--ink-2); font-size: 0.92rem; }
.weigh { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 6px 28px; margin-top: 16px; }
.weigh ul { margin: 8px 0 0; padding-left: 1.1em; color: var(--ink-2); font-size: 0.95rem; line-height: 1.5; }
.weigh li + li { margin-top: 6px; }
.weigh .label { margin-top: 10px; }
.ask { margin-top: 12px; }
.ask h4 { margin: 0; font: 500 1rem/1.4 var(--ui); color: var(--ink); }
.ask .opts { margin-top: 8px; }
.ask .muted { margin-top: 6px; }
.call details.more > summary { cursor: pointer; color: var(--brass); font: 500 0.86rem/1.3 var(--ui); list-style: none; padding: 10px 0; }
.call details.more > summary::-webkit-details-marker { display: none; }
.scroll { overflow-x: auto; margin-top: 16px; }
table { border-collapse: collapse; width: 100%; font-size: 0.92rem; min-width: 520px; }
th { text-align: left; font: 500 11px/1.2 var(--ui); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-3); padding: 0 14px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: bottom; }
td { padding: 10px 14px 10px 0; border-bottom: 1px solid var(--rule); vertical-align: top; color: var(--ink-2); }
td:first-child { color: var(--ink); }
td.num { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--ink-3); }
.st { font: 600 10.5px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; color: var(--ink-3); }
.st.done { color: var(--yes); } .st.building, .st.designing, .st.review { color: var(--brass); } .st.planned { color: var(--ink-2); }
.list { margin: 14px 0 0; padding: 0; list-style: none; border-top: 1px solid var(--rule); }
.list li { padding: 10px 0; border-bottom: 1px solid var(--rule); color: var(--ink-2); font-size: 0.94rem; }
.list li.done { opacity: 0.6; } .list li.done::after { content: " · done"; color: var(--yes); }
.list time { font: 400 0.78rem/1 var(--mono); color: var(--ink-3); margin-right: 10px; white-space: nowrap; }
.doc { border-bottom: 1px solid var(--rule); }
.doc:first-of-type { border-top: 1px solid var(--rule); margin-top: 16px; }
.doc > summary { cursor: pointer; padding: 13px 0; font: 500 1rem/1.3 var(--ui); list-style: none; display: flex; justify-content: space-between; gap: 12px; }
.doc > summary::-webkit-details-marker { display: none; }
.doc > summary::after { content: "+"; color: var(--brass); } .doc[open] > summary::after { content: "−"; }
.doc > summary span { color: var(--ink-3); font-size: 0.86rem; text-align: right; }
.md { padding: 4px 0 22px; color: var(--ink-2); max-width: 74ch; font-size: 0.95rem; }
.md h3, .md h4, .md h5 { color: var(--ink); margin: 22px 0 8px; font: 600 1rem/1.3 var(--ui); }
.md h3 { font: 700 1.2rem/1.2 var(--display); }
.md p { margin: 10px 0; } .md ul, .md ol { margin: 10px 0; padding-left: 1.2em; } .md li + li { margin-top: 5px; }
.md strong { color: var(--ink); font-weight: 600; } .md hr { border: 0; border-top: 1px solid var(--rule); margin: 18px 0; }
.md table { min-width: 460px; }
.md blockquote { margin: 14px 0; padding-left: 14px; border-left: 2px solid var(--brass); color: var(--ink); font: italic 500 1.05rem/1.45 var(--display); }
.tick { display: inline-block; width: 0.8em; height: 0.8em; margin-right: 0.5em; border: 1px solid var(--ink-3); vertical-align: -0.05em; }
.album { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 18px; margin-top: 18px; }
.shot { display: grid; gap: 12px; align-content: start; padding-bottom: 16px; border-bottom: 1px solid var(--rule); }
.shot img, .shot .nothumb { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 3px; background: var(--ground-3); display: block; }
.shot .id { font: 500 0.78rem/1 var(--mono); color: var(--ink-3); margin-right: 8px; }
.shot .chip { margin-left: 6px; letter-spacing: 0.1em; }
.to { width: 100%; margin-top: 8px; font: 400 0.95rem/1.3 var(--ui); color: var(--ink); background: var(--ground-2); border: 1px solid var(--rule); border-radius: 4px; padding: 9px 10px; }
.bring { margin-top: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.tick[data-done="true"] { background: var(--yes); border-color: var(--yes); }
</style>
<div class="sheet">
  <header>
    <p class="label">qsdqsb.com · built from the plan on ${built}</p>
    <h1>House of Wonders Command Centre</h1>
    <p class="sub">Where the site stands, what is waiting on you, and everything the plan holds. Generated from <code>_plan/</code>; it is rebuilt whenever the plan changes.</p>
    ${state.errors.length || pageWarnings.length ? `<ul class="notes">${[...state.errors, ...pageWarnings].map((w) => `<li>${inline(w)}</li>`).join('')}</ul>` : ''}
    <details class="doc" style="margin-top:22px">
      <summary>How to drive this</summary>
      <div class="md">
        <ul>
          <li><strong>Answer a call:</strong> tap an option under "Waiting on you". Add a note if the answer needs one.</li>
          <li><strong>Have an idea:</strong> write it in the box under "Ideas", as it occurs to you. It comes back made explicit, weighed against the site as it stands, with its for and against and a verdict; you tap Pursue, Park or Drop.</li>
          <li><strong>Choose between two ways:</strong> a choice arrives with its prototypes on a page of its own, linked from its call. Tap one there.</li>
          <li><strong>Notice something wrong:</strong> say it to any Claude session in the repo (<code>/finding</code>), or leave it as a note on a call.</li>
          <li><strong>Start work:</strong> in a session, <code>/hub</code> says where things stand and <code>/stage</code> builds the next thing that needs nobody.</li>
        </ul>
        <p>A tap is stored with this page at once. It is written into the plan by the next session, or by the daily run. The daily run may push a branch that touches only the plan; nothing reaches <code>master</code>, and no pull request is opened or merged, without you.</p>
      </div>
    </details>
  </header>

  <nav class="jump" aria-label="Jump to a part of this page">
    <button type="button" class="chip ${state.errors.length ? 'bad' : 'ok'}" data-to="h-now">${state.errors.length ? `Plan broken in ${state.errors.length}` : 'Plan sound'}</button>
    <button type="button" class="chip ${state.queue.length ? 'warn' : ''}" data-to="h-queue">${state.queue.length} waiting on you</button>
    <button type="button" class="chip ${state.ideas.some((i) => i.status === 'shaped') ? 'warn' : ''}" data-to="h-ideas">${state.ideas.length} ideas · ${state.ideas.filter((i) => i.status === 'shaped').length} shaped for you</button>
    ${harvest ? `<button type="button" class="chip ${harvestWaiting.length ? 'warn' : ''}" data-to="h-album">${harvestWaiting.length} in the album</button>` : ''}
    <button type="button" class="chip ${requestsOpen.length ? 'warn' : ''}" data-to="h-req">${requestsOpen.length} of your requests open</button>
    <button type="button" class="chip ${state.inbox > 25 ? 'warn' : ''}" data-to="h-find">${state.inbox} in the inbox</button>
    <button type="button" class="chip" data-to="doc-features">${state.features.length} features · ${state.features.filter((f) => f.journeys.length).length} walked by a journey</button>
    <button type="button" class="chip" data-to="h-dec">${state.decisions.length} decisions</button>
  </nav>
  <p class="heard" role="status"><span id="heard-text"></span> <button type="button" class="tell" id="tell" hidden>I've decided: tell Claude</button></p>

  <section aria-labelledby="h-now">
    <p class="label">Now</p>
    <h2 id="h-now">${now ? `Stage ${now.n} · ${esc(now.name)}` : 'No stage is under way'}</h2>
    ${now ? `<div class="now"><p class="sub" style="margin:0">${esc(roadmapRows.find((r) => r.n === now.n)?.gets || '')}</p>
      <div class="meter" aria-hidden="true"><i style="width:${pct(now)}%"></i></div>
      <p class="muted">${now.done} of ${now.done + now.open} tasks done · ${esc(now.status)}</p></div>` : ''}
  </section>

  <section aria-labelledby="h-queue">
    <p class="label">Waiting on you</p>
    <h2 id="h-queue">${state.queue.length ? `${state.queue.length} calls, each with a recommendation` : 'Nothing is waiting on you'}</h2>
    <p class="sub">Tap an answer; add a note if you want. Nothing is taken as a yes until you answer, and work carries on with whatever does not depend on it.</p>
    <p class="status" id="status" role="status"></p>
    ${state.queue.map((q) => `<article class="call" id="${q.id}" data-answered="false">
      <h3><span class="id">${q.id}</span>${inline(q.title)}</h3>
      <div class="body">${markdown(q.text.replace(OPTION, '').trim(), { skipTitle: false })}</div>
      <div class="opts">${q.options.map((o) => `<button type="button" class="opt" data-q="${q.id}" data-o="${o.key}" aria-pressed="false"><b>${o.key}</b><span>${inline(o.text)}${o.recommended ? '<span class="rec">Recommended</span>' : ''}</span></button>`).join('')}</div>
      <input class="note" id="note-${q.id}" data-q="${q.id}" type="text" placeholder="A note for Claude (optional)" aria-label="Note for ${q.id}">
    </article>`).join('\n')}
    ${choices.length ? `<p class="label" style="margin-top:28px">Choices with prototypes</p><ul class="list">${choices.map(([id, url]) => `<li><a href="${esc(url)}">${esc(id)}</a></li>`).join('')}</ul>` : ''}
  </section>

  ${harvest ? `<section aria-labelledby="h-album">
    <p class="label">From the album · ${esc(harvest.album)}</p>
    <h2 id="h-album">${harvestWaiting.length ? `${harvestWaiting.length} photograph${harvestWaiting.length === 1 ? '' : 's'} waiting to come in` : harvest.items.length ? 'Everything in the album is on the site' : 'The album is empty'}</h2>
    <p class="sub">${harvestWaiting.length
      ? 'Each sits where Claude would put it: beside the published photo taken nearest in time, or with the voyage of its city, and judged by eye where neither settles it. Change any of them; Hold leaves a photo in the album. <b>Bring them in</b> is your yes to publish exactly these: they are pulled into their voyages, pushed, and tagged in Photos with where they went.'
      : harvest.items.length ? 'Empty it in Photos when you like: open the album, ⌘A, then Delete (⌫) and Remove from Album. Not ⌘⌫, which deletes from the library.' : 'Put photographs you want on the site into it; the next look brings them here.'}</p>
    <p class="muted" style="margin-top:6px">Looked at ${esc(String(harvest.looked).slice(0, 16).replace('T', ' '))} UTC${harvestLast ? ` · last brought in ${esc(String(harvestLast.at).slice(0, 10))}: ${esc(harvestLast.done.map((d) => `${d.photos.length} to ${d.gallery}`).join(', ') || 'nothing')}` : ''}</p>
    ${harvestWaiting.length ? `<div class="album">${harvestWaiting.map(albumCard).join('\n')}</div>
    <div class="bring"><button type="button" class="send" id="bring" data-hash="${esc(harvest.hash)}">Bring them in</button><p class="status" id="bring-status" role="status"></p></div>` : ''}
  </section>` : ''}

  <section aria-labelledby="h-ideas">
    <p class="label">Ideas</p>
    <h2 id="h-ideas">Say an idea; it comes back weighed</h2>
    <p class="sub">Write it as it occurs to you. The next session keeps your words exactly and works the idea through: how the sentence can be read and which reading it took, the shapes it could take, what it would change in the site as it stands, what speaks for it and against it, and a verdict. It comes back here for you to pursue, park or drop. Before it reaches you it has been tried, not supposed (what must be true for it to be built, and what happened when that was tried), and argued against by a reviewer who did not shape it. The verdict is advice; the decision is yours. A question you leave untapped stays open: nothing is built on a guess at your answer.</p>
    <div class="new">
      <label for="idea-new">A new idea, in your own words</label>
      <textarea id="idea-new" placeholder="I want the palette to be shareable as an image"></textarea>
      <button type="button" class="send" id="idea-send">Send it to the workshop</button>
      <p class="status" id="idea-status" role="status"></p>
      <ul class="sent" id="idea-sent"></ul>
    </div>
    ${state.ideas.map(ideaCard).join('\n')}
  </section>

  <section aria-labelledby="h-road">
    <p class="label">Roadmap · last reviewed ${esc(state.reviewed || 'never')}</p>
    <h2 id="h-road">The stages, in order</h2>
    <div class="scroll"><table>
      <thead><tr><th>#</th><th>Stage</th><th>What a reader gets</th><th>Status</th><th>Tasks</th></tr></thead>
      <tbody>${roadmapRows.map((r) => { const s = stageOf(r.n); return `<tr><td class="num">${r.n}</td><td>${esc(r.name)}</td><td>${inline(r.gets)}</td><td><span class="st ${esc(s.status.replace('in review', 'review'))}">${esc(s.status)}</span></td><td class="num">${s.done + s.open ? `${s.done}/${s.done + s.open}` : '·'}</td></tr>`; }).join('')}</tbody>
    </table></div>
    ${state.stages.map((s) => doc(s.file, `Stage ${s.n} · ${s.name}`)).join('\n')}
  </section>

  <section aria-labelledby="h-log">
    <p class="label">Changelog</p>
    <h2 id="h-log">What changed for a reader</h2>
    <ul class="list">${state.changelog.map((c) => `<li><time>${c.date}</time>${inline(c.text)}</li>`).join('') || '<li>Nothing yet.</li>'}</ul>
  </section>

  <section aria-labelledby="h-req">
    <p class="label">Your requests</p>
    <h2 id="h-req">${requestsOpen.length ? `${requestsOpen.length} asked for, not yet done` : 'Everything you asked for is done or in a pull request'}</h2>
    <p class="sub">What you ask any session for is kept here in your words and taken before the roadmap: done on the spot when small, otherwise by the next morning's work run, and handed to you as a pull request.</p>
    <ul class="list">${requestsOpen.map((l) => { const m = l.match(/^(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/); return `<li>${m ? `<time>${m[1]}</time>${inline(m[2])}` : inline(l)}</li>`; }).join('')}${requestsDone.slice(0, 6).map((l) => { const m = l.match(/^(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/); return `<li class="done"><time>${m ? m[1] : ''}</time>${inline(m ? m[2] : l)}</li>`; }).join('') || (requestsOpen.length ? '' : '<li>Nothing asked yet.</li>')}</ul>
  </section>

  <section aria-labelledby="h-find">
    <p class="label">Findings</p>
    <h2 id="h-find">${state.inbox} waiting to be sorted</h2>
    <p class="sub">Anything anyone notices is filed here in one line, then sorted into a stage. The full audit of 1 October 2026 is on <a href="https://claude.ai/artifact/LUVt4jie4qHH9jwLYdVUP6">its own page</a>.</p>
    <ul class="list">${inboxLines.slice(0, 12).map((l) => { const m = l.match(/^(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/); return `<li>${m ? `<time>${m[1]}</time>${inline(m[2])}` : inline(l)}</li>`; }).join('')}</ul>
    ${inboxLines.length > 12 ? `<p class="muted" style="margin-top:10px">And ${inboxLines.length - 12} more in <code>_plan/findings/inbox.md</code>.</p>` : ''}
  </section>

  <section aria-labelledby="h-dec">
    <p class="label">Decisions</p>
    <h2 id="h-dec">What has been decided, and why</h2>
    ${state.decisions.map((d) => `<details class="doc"><summary>${String(d.n).padStart(4, '0')} · ${esc(d.title)}<span>${esc(d.status.split('.')[0].replace(/\*/g, ''))}</span></summary><div class="md">${markdown(read(d.file))}</div></details>`).join('\n')}
  </section>

  <section aria-labelledby="h-rules">
    <p class="label">Language, philosophy, workflows and architecture</p>
    <h2 id="h-rules">What the site is and how it is built</h2>
    ${doc('DESIGN-LANGUAGE.md', 'The QSD design language: the grammar and its signatures')}
    ${doc('PRINCIPLES.md', 'Principles: the identity and your standing calls')}
    ${doc('WORKFLOWS.md', 'Workflows: how a fault, a feature, a piece, a choice and a thought each move')}
    ${doc('ARCHITECTURE.md', 'Architecture: the shape, the layers, the rules for new work')}
    ${doc('FEATURES.md', `Features: ${state.features.length} of them, with their code and journeys`).replace('<details class="doc">', '<details class="doc" id="doc-features">')}
    ${doc('README.md', 'How the plan works')}
  </section>
</div>
<script>
(function () {
  var LS = "how-hub-answers", answers = {}, db = null, writing = {}, pending = {};
  try { answers = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) {}
  var say = function (t) { document.getElementById("status").textContent = t; };
  function draw() {
    // By each button's own id: an idea's questions sit inside its card and are answered apart from it.
    document.querySelectorAll(".opt").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.o === (answers[b.dataset.q] || {}).option)); });
    document.querySelectorAll(".call").forEach(function (c) {
      var a = answers[c.id] || {};
      c.dataset.answered = String(!!a.option);
      var n = document.getElementById("note-" + c.id);
      if (n && document.activeElement !== n) n.value = a.note || "";
    });
  }
  function save(id) {
    try { localStorage.setItem(LS, JSON.stringify(answers)); } catch (e) {}
    if (!db) { say("Saved in this browser only."); return; }
    if (writing[id]) { pending[id] = true; return; }
    writing[id] = true; say("Saving…");
    var a = answers[id] || {};
    var p = (a.option || a.note) ? db.doc("answers/" + id).set({ option: a.option || "", note: a.note || "", at: new Date().toISOString() }) : db.doc("answers/" + id).delete();
    p.then(function () { say("Saved. The next session reads your answers."); }, function () { say("Could not save here; kept in this browser."); })
      .then(function () { writing[id] = false; if (pending[id]) { pending[id] = false; save(id); } });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".opt"); if (!b) return;
    var id = b.dataset.q, cur = answers[id] || {};
    answers[id] = { option: cur.option === b.dataset.o ? "" : b.dataset.o, note: cur.note || "" };
    draw(); save(id); queueTell(id, answers[id].option || "cleared");
  });
  document.addEventListener("change", function (e) {
    if (!e.target.classList.contains("note")) return;
    var id = e.target.dataset.q, cur = answers[id] || {};
    answers[id] = { option: cur.option || "", note: e.target.value.trim() };
    save(id); queueTell(id, "note");
  });
  draw();
  // The row of chips at the top goes to each part, and marks the part being read.
  var jump = document.querySelector(".jump"), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  jump.addEventListener("click", function (e) {
    var b = e.target.closest("[data-to]"); if (!b) return;
    var to = document.getElementById(b.dataset.to); if (!to) return;
    if (to.tagName === "DETAILS") to.open = true;
    to.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  });
  if ("IntersectionObserver" in window) {
    var marks = [].slice.call(jump.querySelectorAll("[data-to]"));
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        marks.forEach(function (m) { m.setAttribute("aria-current", String(m.dataset.to === en.target.id)); });
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    marks.forEach(function (m) { var t = document.getElementById(m.dataset.to); if (t) seen.observe(t); });
  }
  // Telling Claude. A tap is stored with this page at once, but nothing wakes a session by itself.
  // The page can: it leaves a comment addressed to Claude, which reaches any session watching the
  // page. It does so when the owner says they have decided (the owner, 2026-10-03: "There should be
  // a button to indicate I have made the decisions"), not at every tap: one message for a sitting,
  // with what changed and what is still open. Ids and letters only, never the words of a note (the
  // session reads those from the store). With no session watching, it says so: the daily run, or
  // the next session, records the answers.
  var comments = null, can = "", toTell = {}, off = false, THREAD = LS + "-thread";
  var tellBtn = document.getElementById("tell"), heard = function (t) { document.getElementById("heard-text").textContent = t; };
  var KEPT = "Your taps are kept with this page. A session records them when it next reads the page, and so does the daily run.";
  var waiting = function () { return Object.keys(toTell).length; };
  function listening() {
    if (!comments || off) { tellBtn.hidden = true; if (!off) heard(KEPT); return; }
    comments.canSendToClaude().then(function (s) {
      can = s;
      heard(s === "available" ? (waiting() ? waiting() + " change" + (waiting() === 1 ? "" : "s") + " not yet told. When you have decided, press the button." : "A Claude session is listening. Tap your answers, then press the button when you have decided.")
        : s === "no_session" ? "No Claude session is listening just now. " + KEPT : KEPT);
      tellBtn.hidden = s !== "available";
    }, function () { tellBtn.hidden = true; heard(KEPT); });
  }
  function tellNow() {
    var ids = Object.keys(toTell); if (!comments || off) return;
    var open = [].filter.call(document.querySelectorAll(".call"), function (c) { return c.dataset.answered !== "true"; }).map(function (c) { return c.id; });
    var text = "The owner has decided. " + (ids.length ? "Changed since Claude was last told: " + ids.map(function (id) { return id + ": " + toTell[id]; }).join("; ") + ". " : "Nothing changed since Claude was last told. ")
      + (open.length ? "Still unanswered: " + open.join(", ") + ". " : "Every call on the page has an answer. ")
      + "Please read this page's store, record the answers in the plan, and carry on with the answered work.";
    // An anchor is asked for, then handed on: the runtime takes plain data, not a promise of it.
    var fresh = function () { return comments.anchorFor(document.getElementById("h-queue")).then(function (a) { return comments.sendToClaude({ anchor: a, text: text }); }); };
    var tid = null; try { tid = localStorage.getItem(THREAD); } catch (e) {}
    var sent = tid ? comments.sendToClaude({ threadId: tid, text: text }).catch(function (e) { if (e && e.code === "not_found") return fresh(); throw e; }) : fresh();
    toTell = {}; tellBtn.disabled = true;
    sent.then(function (r) {
      try { if (r && r.threadId) localStorage.setItem(THREAD, r.threadId); } catch (e) {}
      tellBtn.disabled = false;
      heard("Claude was told at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ". Its reply appears in this page's comments.");
    }, function (e) {
      var c = e && e.code;
      tellBtn.disabled = false;
      ids.forEach(function (id) { if (!(id in toTell)) toTell[id] = "changed"; });
      if (c === "forbidden" || c === "not_granted" || c === "capability_disabled" || c === "capability_removed") {
        // Permanent for this view: the button goes, and the page says why.
        off = true; tellBtn.hidden = true;
        heard("Telling Claude from this page is switched off here. " + KEPT);
        return;
      }
      tellBtn.hidden = false;
      heard(c === "consent_required" ? "Not told yet: allow this page to comment as you, then press the button again."
        : c === "claude_unavailable" ? "Claude could not be told just now (no session was listening). Press the button again later, or leave it: " + KEPT
        : c === "rate_limited" ? "Told too often just now. Press the button again in a moment."
        : "Claude could not be told. " + KEPT);
    });
  }
  // Called inside a tap or a typed change: the change waits for the button, and the line beside it
  // counts what is waiting.
  function queueTell(id, value) {
    toTell[id] = value;
    if (!comments || off) return;
    listening();
  }
  tellBtn.addEventListener("click", function () { tellNow(); });
  if (window.claude && window.claude.use) window.claude.use("comments").then(function (ns) { comments = ns; listening(); }, function () { heard(KEPT); }); else heard(KEPT);

  var send = document.getElementById("idea-send"), box = document.getElementById("idea-new");
  var tell = function (t) { document.getElementById("idea-status").textContent = t; };
  send.addEventListener("click", function () {
    var text = box.value.trim();
    if (!text) { tell("Write the idea first."); return; }
    if (!db) { tell("This view cannot store it. Say it to Claude in chat instead: /idea, then your words."); return; }
    send.disabled = true; tell("Sending…");
    db.collection("ideas").add({ text: text, at: new Date().toISOString() })
      .then(function () { box.value = ""; tell("Kept. The next session files it and brings it back shaped."); queueTell("a new idea", "added"); }, function () { tell("Could not store it here. Say it to Claude in chat instead."); })
      .then(function () { send.disabled = false; });
  });
  // Bring them in: the owner's yes for the album, as shown. Stored under the plan's hash, so a yes
  // given on one set is never read as a yes for another; then Claude is told, if a session listens.
  var bring = document.getElementById("bring"), bringSay = function (t) { var el = document.getElementById("bring-status"); if (el) el.textContent = t; };
  if (bring) bring.addEventListener("click", function () {
    var picks = {}, open = [];
    document.querySelectorAll("select.to").forEach(function (s) { if (!s.value) open.push(s.id.slice(3)); else picks[s.dataset.id] = s.value; });
    if (open.length) { bringSay("Choose a voyage (or Hold) for every photograph first."); return; }
    if (!db) { bringSay("This view cannot store it. Reload the command centre and tap again: nothing is pushed until a tap is stored."); return; }
    var hash = bring.dataset.hash, doc = { hash: hash, destinations: picks, at: new Date().toISOString() };
    bring.disabled = true; bringSay("Saving…");
    db.doc("harvest/" + hash).set(doc).then(function () {
      var n = Object.keys(picks).filter(function (k) { return picks[k] !== "hold"; }).length;
      var text = "The owner said bring in the album: plan " + hash + ", " + n + " photograph" + (n === 1 ? "" : "s") + ". Please read this page's harvest store and run /harvest to bring them in.";
      if (comments && !off && can === "available") {
        return comments.anchorFor(document.getElementById("h-album")).then(function (a) { return comments.sendToClaude({ anchor: a, text: text }); })
          .then(function () { bringSay("Yes recorded, and Claude was told. They come in once the session has pushed them."); }, function () { bringSay("Yes recorded. No session heard it just now: the next session brings them in."); });
      }
      bringSay("Yes recorded. The next session brings them in (or say /harvest in one).");
    }, function () { bring.disabled = false; bringSay("Could not save it. Reload the command centre and tap again: nothing is pushed until a tap is stored."); });
  });
  if (window.claude && window.claude.use) window.claude.use("db").then(function (ns) {
    if (!ns) return; db = ns;
    db.collection("ideas").onSnapshot(function (snap) {
      var ul = document.getElementById("idea-sent"); ul.textContent = "";
      snap.docs.forEach(function (d) { var li = document.createElement("li"); li.textContent = (d.data() || {}).text || ""; ul.appendChild(li); });
    }, function () {});
    db.collection("answers").onSnapshot(function (snap) {
      var remote = {};
      snap.docs.forEach(function (d) { var v = d.data() || {}; remote[d.id] = { option: v.option || "", note: v.note || "" }; });
      Object.keys(remote).forEach(function (id) { if (!writing[id] && !pending[id]) answers[id] = remote[id]; });
      if (!snap.metadata.fromCache) Object.keys(answers).forEach(function (id) { if (!remote[id] && !writing[id] && !pending[id]) delete answers[id]; });
      draw();
      if (!document.getElementById("status").textContent) say("Your answers are saved with this page.");
    }, function () { db = null; say("Saved in this browser only."); });
    if (bring) try { db.doc("harvest/" + bring.dataset.hash).onSnapshot(function (d) {
      var v = d && d.exists ? d.data() : null; if (!v) return;
      Object.keys(v.destinations || {}).forEach(function (id) { var s = document.getElementById("to-" + id); if (s) s.value = v.destinations[id]; });
      bring.disabled = true; bringSay("You said bring them in on " + String(v.at || "").slice(0, 16).replace("T", " ") + ". They come in with the next session.");
    }, function () {}); } catch (e) { /* a store without documents: the button still works */ }
  }, function () {});
})();
</script>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`${path.relative(ROOT, OUT)} · ${(html.length / 1024).toFixed(0)} KB · ${state.queue.length} calls, ${state.stages.length} stages, ${state.decisions.length} decisions`);
