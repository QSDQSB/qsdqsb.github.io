#!/usr/bin/env node
/**
 * The command centre: one page for the owner, built from `_plan/`.
 *
 * Where the site stands (the current stage and its progress), what is waiting on the owner (the
 * queue, each call answerable in one tap), the roadmap, what changed, what has been found, every
 * decision, the feature map, and the principles and architecture in full. It is generated, never
 * written by hand, so it cannot disagree with the plan it shows (_plan/decisions/0006).
 *
 *   node scripts/hub-page.mjs            # writes design/hub/hub.html (design/ is gitignored)
 *
 * Publish it with the Artifact tool to the address in `_plan/hub.json` (capabilities
 * { db: {}, user: {} }). The owner's answers land in the page's `answers` collection, one document
 * per queue id; a session reads them back with ArtifactData and records them in QUEUE.md.
 *
 * Exit codes: 0 written · 2 the plan could not be read
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = path.join(ROOT, '_plan');
const read = (rel) => fs.readFileSync(path.join(PLAN, rel), 'utf8');

let state;
try {
  // Exit 1 means "broken", and the page should say so rather than not be built.
  const out = (() => { try { return execFileSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { return e.stdout; } })();
  state = JSON.parse(out);
} catch (e) { console.error(`The plan could not be read: ${e.message}`); process.exit(2); }

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** Inline Markdown: code, bold, emphasis, links. A link into the plan becomes its path; the page cannot open a file. */
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
  .replace(/(^|\s)(https?:\/\/[^\s<]+[^\s<.,;:])/g, '$1<a href="$2">$2</a>');

/** Block Markdown, as much of it as the plan uses: headings, paragraphs, lists, tables, fences, rules. */
function markdown(src, { skipTitle = true } = {}) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0, titled = !skipTitle;
  const isBlockStart = (l) => /^(#{1,6} |```|\||- |\d+\. |---\s*$|> )/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; out.push(`<pre>${esc(buf.join('\n'))}</pre>`); continue;
    }
    const h = l.match(/^(#{1,6}) (.+)$/);
    if (h) { i++; if (h[1].length === 1 && !titled) { titled = true; continue; } out.push(`<h${Math.min(6, h[1].length + 2)}>${inline(h[2])}</h${Math.min(6, h[1].length + 2)}>`); continue; }
    if (/^---\s*$/.test(l)) { i++; out.push('<hr>'); continue; }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r, n) => !(n === 1 && /^[\s|:-]+$/.test(r)));
      out.push(`<div class="scroll"><table><thead><tr>${cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^(- |\d+\. )/.test(l)) {
      const ordered = /^\d+\. /.test(l), items = [];
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^(- |\d+\. )/.test(lines[i])) items.push(lines[i].replace(/^(- |\d+\. )/, ''));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const item = (t) => t.replace(/^\[( |x)\] /i, (m, c) => `<span class="tick" data-done="${c !== ' '}"></span>`);
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${item(inline(t))}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

const roadmapRows = read('ROADMAP.md').split('\n').map((l) => l.match(/^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/)).filter(Boolean)
  .map((m) => ({ n: Number(m[1]), name: m[2], gets: m[3].trim(), tier: m[5].trim() }));
const stageOf = (n) => state.stages.find((s) => s.n === n);
const pct = (s) => (s.done + s.open ? Math.round((100 * s.done) / (s.done + s.open)) : 0);
const inboxLines = (read('findings/inbox.md').split(/^## Taken/m)[0].match(/^- .+$/gm) || []).map((l) => l.slice(2));
const built = new Date().toISOString().slice(0, 10);
const now = state.now;
const choices = Object.entries(state.hub.choices || {});
const doc = (rel, title) => `<details class="doc"><summary>${esc(title)}</summary><div class="md">${markdown(read(rel))}</div></details>`;

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
.sheet { max-width: 980px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 40px); padding-block: 36px 96px; }
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
.opt .rec { display: inline-block; margin-left: 8px; font: 600 10px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--yes); }
.opt[aria-pressed="true"] { background: var(--yes-bg); border-color: var(--yes); color: var(--ink); }
.note { width: 100%; margin-top: 10px; font: 400 0.92rem/1.3 var(--ui); color: var(--ink); background: var(--ground-2); border: 1px solid var(--rule); border-radius: 4px; padding: 8px 10px; }
.note::placeholder { color: var(--ink-3); }
.status { color: var(--ink-3); font-size: 0.86rem; min-height: 1.3em; margin-top: 10px; }
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
.tick { display: inline-block; width: 0.8em; height: 0.8em; margin-right: 0.5em; border: 1px solid var(--ink-3); vertical-align: -0.05em; }
.tick[data-done="true"] { background: var(--yes); border-color: var(--yes); }
</style>
<div class="sheet">
  <header>
    <p class="label">qsdqsb.com · built from the plan on ${built}</p>
    <h1>House of Wonders Command Centre</h1>
    <p class="sub">Where the site stands, what is waiting on you, and everything the plan holds. Generated from <code>_plan/</code>; it is rebuilt whenever the plan changes.</p>
    <div class="health">
      <span class="chip ${state.errors.length ? 'bad' : 'ok'}">${state.errors.length ? `Plan broken in ${state.errors.length}` : 'Plan sound'}</span>
      <span class="chip ${state.queue.length > 8 ? 'warn' : ''}">${state.queue.length} waiting on you</span>
      <span class="chip ${state.inbox > 25 ? 'warn' : ''}">${state.inbox} in the inbox</span>
      <span class="chip">${state.features.length} features · ${state.features.filter((f) => f.journeys.length).length} walked by a journey</span>
      <span class="chip">${state.decisions.length} decisions</span>
    </div>
    ${state.errors.length || state.warnings.length ? `<ul class="notes">${[...state.errors, ...state.warnings].map((w) => `<li>${inline(w)}</li>`).join('')}</ul>` : ''}
  </header>

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
      <div class="body">${markdown(q.text.replace(/^- \*\*[A-Z]\b.*$/gm, '').trim(), { skipTitle: false })}</div>
      <div class="opts">${q.options.map((o) => `<button type="button" class="opt" data-q="${q.id}" data-o="${o.key}" aria-pressed="false"><b>${o.key}</b><span>${inline(o.text)}${o.recommended ? '<span class="rec">Recommended</span>' : ''}</span></button>`).join('')}</div>
      <input class="note" id="note-${q.id}" data-q="${q.id}" type="text" placeholder="A note for Claude (optional)" aria-label="Note for ${q.id}">
    </article>`).join('\n')}
    ${choices.length ? `<p class="label" style="margin-top:28px">Choices with prototypes</p><ul class="list">${choices.map(([id, url]) => `<li><a href="${esc(url)}">${esc(id)}</a></li>`).join('')}</ul>` : ''}
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
    <p class="label">Philosophy, rules and architecture</p>
    <h2 id="h-rules">What the site is and how it is built</h2>
    ${doc('PRINCIPLES.md', 'Principles: the identity and your standing calls')}
    ${doc('ARCHITECTURE.md', 'Architecture: the shape, the layers, the rules for new work')}
    ${doc('FEATURES.md', `Features: ${state.features.length} of them, with their code and journeys`)}
    ${doc('README.md', 'How the plan works')}
  </section>
</div>
<script>
(function () {
  var LS = "how-hub-answers", answers = {}, db = null, writing = {}, pending = {};
  try { answers = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) {}
  var say = function (t) { document.getElementById("status").textContent = t; };
  function draw() {
    document.querySelectorAll(".call").forEach(function (c) {
      var a = answers[c.id] || {};
      c.dataset.answered = String(!!a.option);
      c.querySelectorAll(".opt").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.o === a.option)); });
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
    draw(); save(id);
  });
  document.addEventListener("change", function (e) {
    if (!e.target.classList.contains("note")) return;
    var id = e.target.dataset.q, cur = answers[id] || {};
    answers[id] = { option: cur.option || "", note: e.target.value.trim() };
    save(id);
  });
  draw();
  if (window.claude && window.claude.use) window.claude.use("db").then(function (ns) {
    if (!ns) return; db = ns;
    db.collection("answers").onSnapshot(function (snap) {
      var remote = {};
      snap.docs.forEach(function (d) { var v = d.data() || {}; remote[d.id] = { option: v.option || "", note: v.note || "" }; });
      Object.keys(remote).forEach(function (id) { if (!writing[id] && !pending[id]) answers[id] = remote[id]; });
      if (!snap.metadata.fromCache) Object.keys(answers).forEach(function (id) { if (!remote[id] && !writing[id] && !pending[id]) delete answers[id]; });
      draw();
      if (!document.getElementById("status").textContent) say("Your answers are saved with this page.");
    }, function () { db = null; say("Saved in this browser only."); });
  }, function () {});
})();
</script>
`;

const outDir = path.join(ROOT, 'design', 'hub');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'hub.html'), html);
console.log(`design/hub/hub.html · ${(html.length / 1024).toFixed(0)} KB · ${state.queue.length} calls, ${state.stages.length} stages, ${state.decisions.length} decisions`);
