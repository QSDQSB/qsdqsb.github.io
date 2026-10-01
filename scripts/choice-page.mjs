#!/usr/bin/env node
/**
 * A choice, ready for the owner: shoots each option's prototype at desktop and phone, and writes
 * one page that shows them side by side with a recommendation and a control to pick.
 *
 * The owner used to ask for a prototype whenever two ways of doing something were on the table,
 * then choose. This makes the prototypes arrive with the question (_plan/decisions/0005). The page
 * is published as a private Artifact; the pick is stored with it and read back by the next session.
 *
 *   node scripts/choice-page.mjs design/choices/<id>/choice.json
 *
 * choice.json:
 *   { "id": "title-wrap",                      // letters, digits, hyphens; the pick's key
 *     "question": "Should long post titles wrap on a phone?",
 *     "context": "One or two sentences: why this is being asked now.",
 *     "tests": ["What a good answer does, from _plan/PRINCIPLES.md", "…"],
 *     "options": [
 *       { "key": "a", "name": "As today", "summary": "What the reader gets.",
 *         "cost": "What it costs to build and to keep.",
 *         "url": "http://localhost:4000/posts/…",          // shot at 1440×900 and 390×844
 *         "shots": { "desktop": "a-desktop.png", "phone": "a-phone.png" } }   // or shots you made
 *     ],
 *     "recommend": { "key": "b", "why": "One or two sentences." } }
 *
 * An option gives `url` (shot here) or `shots` (paths beside choice.json), not both. `fullPage: true`
 * on an option shoots the whole page instead of the first screen. At most three options: the owner
 * wants an opinion, not a menu.
 *
 * Writes choice.html beside choice.json, images inlined (an Artifact loads nothing from elsewhere).
 * Publish it with capabilities { db: {}, user: {} }; the pick lands in the `picks` collection.
 *
 * Exit codes: 0 written · 2 the spec or the environment is wrong
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const specPath = process.argv[2];
const fail = (why) => { console.error(why); process.exit(2); };
if (!specPath || !fs.existsSync(specPath)) fail('Usage: node scripts/choice-page.mjs <path/to/choice.json>');
const dir = path.dirname(path.resolve(specPath));
let spec;
try { spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); } catch (e) { fail(`choice.json does not parse: ${e.message}`); }

if (!/^[a-z0-9-]{1,60}$/.test(spec.id || '')) fail('"id" must be lowercase letters, digits and hyphens.');
if (!spec.question) fail('"question" is missing.');
if (!Array.isArray(spec.options) || spec.options.length < 2 || spec.options.length > 3) fail('Give two or three options.');
for (const o of spec.options) {
  if (!/^[a-z0-9]{1,12}$/.test(o.key || '') || !o.name || !o.summary) fail('Every option needs "key", "name" and "summary".');
  if (!o.url === !o.shots) fail(`Option ${o.key}: give "url" or "shots", one of them.`);
}
if (spec.recommend && !spec.options.some((o) => o.key === spec.recommend.key)) fail('"recommend.key" names no option.');

const VIEWS = { desktop: { viewport: { width: 1440, height: 900 } }, phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const WIDTH = { desktop: 1440, phone: 780 };

/** A shot as a WebP data URI, no wider than it will be shown. */
async function inline(buffer, view) {
  const out = await sharp(buffer).resize({ width: WIDTH[view], withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return `data:image/webp;base64,${out.toString('base64')}`;
}

let browser = null;
const images = {};
for (const o of spec.options) {
  images[o.key] = {};
  for (const view of Object.keys(VIEWS)) {
    let buffer;
    if (o.shots) {
      const file = path.join(dir, o.shots[view] || '');
      if (!o.shots[view] || !fs.existsSync(file)) fail(`Option ${o.key}: no ${view} shot at ${file}`);
      buffer = fs.readFileSync(file);
    } else {
      if (!browser) {
        try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}); }
        catch { try { browser = await chromium.launch({ channel: 'chrome' }); } catch { fail('No Chromium to drive: npx playwright install chromium, or set CHROMIUM_PATH.'); } }
      }
      const context = await browser.newContext({ ...VIEWS[view], colorScheme: 'dark', locale: 'en-GB' });
      const page = await context.newPage();
      try { await page.goto(o.url, { waitUntil: 'networkidle', timeout: 45000 }); } catch { fail(`Option ${o.key}: ${o.url} did not load.`); }
      await page.waitForTimeout(1200);
      buffer = await page.screenshot({ fullPage: !!o.fullPage });
      await context.close();
    }
    images[o.key][view] = await inline(buffer, view);
  }
}
await browser?.close();

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const data = {
  id: spec.id, recommend: spec.recommend?.key || null,
  options: spec.options.map((o) => ({ key: o.key, name: o.name })),
};

const html = `<title>${esc(spec.title || `Choice: ${spec.id}`)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;1,500&display=swap">
<style>
/* One question, its options as they would really look, and a pick. Options sit side by side at
   desktop and stack on a phone; the picture is the content, the words stay short. */
:root {
  color-scheme: dark;
  --ground: #131313; --ground-2: #1b1b1c; --ground-3: #242426;
  --ink: #e6e3dc; --ink-2: #b3b0a8; --ink-3: #85827b; --rule: #343436;
  --brass: #c9a86a; --yes: #7fb7a4; --yes-bg: #17302a;
  --display: "Playfair Display", "Didot", Georgia, serif;
  --ui: "Barlow", "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { color-scheme: light; --ground: #f3f1ec; --ground-2: #eae7e0; --ground-3: #dedad1; --ink: #1d1c1a; --ink-2: #4a4843; --ink-3: #74716a; --rule: #cbc6ba; --brass: #7d6126; --yes: #256a55; --yes-bg: #d2e8e0; } }
:root[data-theme="light"] { color-scheme: light; --ground: #f3f1ec; --ground-2: #eae7e0; --ground-3: #dedad1; --ink: #1d1c1a; --ink-2: #4a4843; --ink-3: #74716a; --rule: #cbc6ba; --brass: #7d6126; --yes: #256a55; --yes-bg: #d2e8e0; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ground); color: var(--ink); font: 400 16px/1.55 var(--ui); -webkit-font-smoothing: antialiased; }
.sheet { max-width: 1320px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 44px); padding-block: 36px 80px; }
.label { margin: 0; font: 500 11px/1 var(--ui); letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
h1 { margin: 12px 0 0; font: 700 clamp(1.6rem, 3.6vw, 2.5rem)/1.12 var(--display); text-wrap: balance; max-width: 26ch; }
h2 { margin: 0; font: 600 1.1rem/1.3 var(--ui); }
p { margin: 0; }
.context { margin-top: 14px; color: var(--ink-2); max-width: 66ch; }
.tests { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 6px; color: var(--ink-2); max-width: 70ch; font-size: 0.95rem; }
.tests li { padding-left: 1.1em; text-indent: -1.1em; }
.tests li::before { content: "· "; color: var(--brass); }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--rule); }
.seg { display: inline-flex; border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; }
.seg button { font: 500 0.86rem/1 var(--ui); color: var(--ink-2); background: none; border: 0; border-right: 1px solid var(--rule); padding: 9px 14px; cursor: pointer; }
.seg button:last-child { border-right: 0; }
.seg button[aria-pressed="true"] { background: var(--ink); color: var(--ground); }
.status { color: var(--ink-3); font-size: 0.88rem; min-height: 1.3em; }
.options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 28px; margin-top: 24px; }
.option { min-width: 0; display: grid; grid-template-rows: auto auto 1fr auto; gap: 12px; }
.option[data-picked="true"] .frame { outline: 2px solid var(--yes); outline-offset: 3px; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 10px; }
.key { font: 700 1.5rem/1 var(--display); color: var(--brass); text-transform: uppercase; }
.rec { font: 600 10.5px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--yes); background: var(--yes-bg); padding: 4px 7px; border-radius: 3px; }
.frame { background: var(--ground-2); border: 1px solid var(--rule); overflow: hidden; }
.frame img { display: block; width: 100%; height: auto; }
.frame img[hidden] { display: none; }
.frame img[data-view="phone"] { max-width: 390px; margin: 0 auto; }
.words { color: var(--ink-2); font-size: 0.95rem; }
.words b { color: var(--ink); font-weight: 600; }
.words p + p { margin-top: 8px; }
.pick { justify-self: start; font: 600 0.9rem/1 var(--ui); color: var(--ink); background: none; border: 1px solid var(--ink-3); border-radius: 4px; padding: 11px 18px; cursor: pointer; }
.pick:hover { border-color: var(--ink); }
.pick[aria-pressed="true"] { background: var(--yes-bg); border-color: var(--yes); color: var(--yes); }
.why { margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--rule); color: var(--ink-2); max-width: 70ch; }
.why b { color: var(--ink); font-weight: 600; }
.foot { display: grid; gap: 10px; margin-top: 26px; max-width: 70ch; }
.foot label { font: 500 11px/1 var(--ui); letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
.note { width: 100%; font: 400 0.95rem/1.4 var(--ui); color: var(--ink); background: var(--ground-2); border: 1px solid var(--rule); border-radius: 4px; padding: 9px 11px; }
.neither { justify-self: start; font: 500 0.86rem/1 var(--ui); color: var(--ink-2); background: none; border: 1px solid var(--rule); border-radius: 4px; padding: 9px 14px; cursor: pointer; }
.neither[aria-pressed="true"] { background: var(--ground-3); color: var(--ink); border-color: var(--ink-3); }
:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
</style>
<div class="sheet">
  <p class="label">A choice for you · ${esc(spec.id)}</p>
  <h1>${esc(spec.question)}</h1>
  ${spec.context ? `<p class="context">${esc(spec.context)}</p>` : ''}
  ${spec.tests?.length ? `<ul class="tests">${spec.tests.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  <div class="bar">
    <div class="seg" role="group" aria-label="Screen">
      <button type="button" data-view="desktop" aria-pressed="true">Desktop</button>
      <button type="button" data-view="phone" aria-pressed="false">Phone</button>
    </div>
    <p class="status" id="status" role="status"></p>
  </div>
  <div class="options">
    ${spec.options.map((o) => `<article class="option" data-key="${esc(o.key)}">
      <div class="head"><span class="key">${esc(o.key)}</span><h2>${esc(o.name)}</h2>${spec.recommend?.key === o.key ? '<span class="rec">Recommended</span>' : ''}</div>
      <div class="frame">
        <img data-view="desktop" alt="${esc(o.name)}, desktop" src="${images[o.key].desktop}">
        <img data-view="phone" alt="${esc(o.name)}, phone" src="${images[o.key].phone}" hidden>
      </div>
      <div class="words"><p>${esc(o.summary)}</p>${o.cost ? `<p><b>Costs:</b> ${esc(o.cost)}</p>` : ''}</div>
      <button type="button" class="pick" data-pick="${esc(o.key)}" aria-pressed="false">Choose ${esc(o.key.toUpperCase())}</button>
    </article>`).join('\n    ')}
  </div>
  ${spec.recommend ? `<p class="why"><b>Why ${esc(spec.recommend.key.toUpperCase())}.</b> ${esc(spec.recommend.why)}</p>` : ''}
  <div class="foot">
    <button type="button" class="neither" data-pick="none" aria-pressed="false">None of these is good enough</button>
    <label for="note">A note for Claude</label>
    <input class="note" id="note" type="text" placeholder="Optional: what to change, or why">
  </div>
</div>
<script>
(function () {
  var C = ${JSON.stringify(data)};
  var LS = "choice-" + C.id, state = { option: "", note: "" }, db = null, busy = false, again = false;
  try { state = JSON.parse(localStorage.getItem(LS) || "null") || state; } catch (e) {}
  var $ = function (s) { return document.querySelectorAll(s); };
  var say = function (t) { document.getElementById("status").textContent = t; };
  function draw() {
    $("[data-pick]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.pick === state.option)); });
    $(".option").forEach(function (a) { a.dataset.picked = String(a.dataset.key === state.option); });
    var n = document.getElementById("note"); if (document.activeElement !== n) n.value = state.note || "";
  }
  function save() {
    try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {}
    if (!db) { say("Saved in this browser only."); return; }
    if (busy) { again = true; return; }
    busy = true; say("Saving…");
    db.doc("picks/" + C.id).set({ option: state.option, note: state.note || "", at: new Date().toISOString() })
      .then(function () { say(state.option ? "Saved. Claude will read your pick." : "Saved."); }, function () { say("Could not save here; kept in this browser."); })
      .then(function () { busy = false; if (again) { again = false; save(); } });
  }
  document.addEventListener("click", function (e) {
    var v = e.target.closest("[data-view]");
    if (v && v.tagName === "BUTTON") {
      $(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === v)); });
      $(".frame img").forEach(function (i) { i.hidden = i.dataset.view !== v.dataset.view; });
      return;
    }
    var p = e.target.closest("[data-pick]"); if (!p) return;
    state.option = state.option === p.dataset.pick ? "" : p.dataset.pick;
    draw(); save();
  });
  document.getElementById("note").addEventListener("change", function (e) { state.note = e.target.value.trim(); save(); });
  draw();
  if (window.claude && window.claude.use) window.claude.use("db").then(function (ns) {
    if (!ns) return; db = ns;
    db.doc("picks/" + C.id).onSnapshot(function (snap) {
      if (busy || again) return;
      var v = snap.exists ? snap.data() : null;
      if (v) { state = { option: v.option || "", note: v.note || "" }; draw(); }
      if (!document.getElementById("status").textContent) say(v && v.option ? "Your pick is saved with this page." : "Your pick will be saved with this page.");
    }, function () { db = null; });
  }, function () {});
})();
</script>
`;

const out = path.join(dir, 'choice.html');
fs.writeFileSync(out, html);
console.log(`${out} · ${spec.options.length} options · ${(html.length / 1024 / 1024).toFixed(1)} MB`);
if (html.length > 15 * 1024 * 1024) console.log('Over 15 MB: an Artifact takes 16 MB at most. Shoot the first screen, not the full page.');
