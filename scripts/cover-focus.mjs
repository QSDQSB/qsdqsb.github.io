#!/usr/bin/env node
/**
 * The cover focus picker: a page on this machine for choosing each voyage's cover photo and where
 * its subject sits. Never part of the site.
 *
 *   npm run covers:focus            → http://localhost:4400
 *   npm run covers:focus -- --port 4500
 *
 * Every shape the cover is cut to (card, Photobook, hero, link preview, tablet, phone) is drawn
 * over the photo; a click or drag moves the focus, and the previews beneath are cut the way the
 * pages cut them (the same scripts/photos/lib/cover.mjs, served to the page). Save writes the
 * `cover:` block into _data/photos/<gallery>.yml (a voyage in parts: _data/photos/<parent>.yml,
 * photo part/slug), keeping any `crops:`; nothing else is touched. Then `npm run photos:fetch`
 * (or a rebuild) carries it to the site.
 *
 * Reads the merged manifests (photos:fetch first) and the authored YAML; writes only on Save.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { validateCover } from './photos/lib/cover.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORED = path.join(ROOT, '_data', 'photos');
const MERGED = path.join(ROOT, '_data', 'photo_manifests');
const COVER_LIB = path.join(ROOT, 'scripts', 'photos', 'lib', 'cover.mjs');

/**
 * `text` (a YAML file) with its top-level `cover:` set to photo and focus. Comments, the rest of
 * the file and any `crops:` under the old block are kept; a file without one gets the block before
 * `photos:`, else at the end.
 */
export function writeCover(text, { photo, focus }) {
  const head = `cover:\n  photo: ${photo}\n  focus: [${focus.map((v) => +v.toFixed(3)).join(', ')}]\n`;
  const lines = text.split('\n');
  const at = lines.findIndex((l) => /^cover:\s*$/.test(l));
  if (at < 0) {
    const block = `# The cover: the frame the voyage opens on, and where its subject sits (x, y from the top-left).\n${head}`;
    return /^photos:/m.test(text) ? text.replace(/^photos:/m, `${block}photos:`) : `${text.replace(/\n*$/, '\n')}${block}`;
  }
  let end = at + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  // Keep `crops:` and whatever is indented under it.
  const kept = []; let inCrops = false;
  for (const l of lines.slice(at + 1, end)) {
    if (/^  crops:/.test(l)) inCrops = true;
    else if (/^  \S/.test(l)) inCrops = false;
    if (inCrops) kept.push(l);
  }
  return [...lines.slice(0, at), ...head.trimEnd().split('\n'), ...kept, ...lines.slice(end)].join('\n');
}

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const readYaml = (f) => { try { return yaml.load(fs.readFileSync(f, 'utf8')) || {}; } catch { return {}; } };
const galleryKey = (g) => g.replace(/\//g, '_');

/** Every voyage page that can have a cover: each gallery, and each voyage in parts, with its photographs. */
function voyages() {
  const index = readJson(path.join(MERGED, '_index.json'));
  if (!index) throw new Error('no merged manifests: run npm run photos:fetch first');
  const photosOf = (g, part = null) => (readJson(path.join(MERGED, `${galleryKey(g)}.json`))?.photos || [])
    .map((p) => ({ id: part ? `${part}/${p.slug}` : p.slug, slug: p.slug, url: p.url, w: p.w, h: p.h, name: p.name || '' }));
  const out = [];
  const galleries = Object.keys(index.galleries).filter((g) => index.galleries[g].count > 0);
  for (const g of galleries) {
    const file = path.join(AUTHORED, `${g}.yml`);
    out.push({ key: galleryKey(g), label: g, file: path.relative(ROOT, file), cover: readYaml(file).cover || null, photos: photosOf(g) });
  }
  const parents = [...new Set(galleries.filter((g) => g.includes('/')).map((g) => g.split('/')[0]))];
  for (const p of parents) {
    const file = path.join(AUTHORED, `${p}.yml`);
    const photos = galleries.filter((g) => g.startsWith(`${p}/`)).flatMap((g) => photosOf(g, g.split('/')[1]));
    out.push({ key: p, label: `${p} (the voyage in parts)`, file: path.relative(ROOT, file), parent: true, cover: readYaml(file).cover || null, photos });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function save({ key, photo, focus }) {
  const v = voyages().find((x) => x.key === key);
  if (!v) throw new Error(`no voyage "${key}"`);
  if (!v.photos.some((p) => p.id === photo)) throw new Error(`"${photo}" is not a photo of ${v.label}`);
  const problems = validateCover({ photo, focus }, v.file);
  if (problems.length) throw new Error(problems.join('; '));
  const file = path.join(ROOT, v.file);
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `# Authored layer for ${v.parent ? `the voyage ${key}, in parts` : `gallery/${v.label}`}.\n`;
  fs.writeFileSync(file, writeCover(before, { photo, focus }));
  return { file: v.file };
}

const PAGE = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cover Focus</title><style>
:root{--bg:#0d0d0f;--panel:#16161a;--line:#2a2a30;--ink:#ece6da;--mute:#9a948a;--verd:#6f9c8c;--lapis:#6b7fae;--ox:#a04848;--violet:#8e7fa6;--ivory:#f4efe4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 -apple-system,"Helvetica Neue",sans-serif;display:grid;grid-template-columns:15rem 1fr;height:100vh}
aside{border-right:1px solid var(--line);overflow-y:auto;padding:12px}aside input{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--ink);padding:7px 9px;border-radius:6px;margin-bottom:8px}
aside button{display:block;width:100%;text-align:left;background:none;border:0;color:var(--mute);padding:5px 8px;border-radius:5px;cursor:pointer;font:inherit}
aside button:hover{color:var(--ink)}aside button.on{background:var(--panel);color:var(--ink)}aside button .dot{color:var(--verd)}
main{overflow-y:auto;padding:16px 20px 60px}h1{font:400 26px/1.2 Didot,"Playfair Display",Georgia,serif;margin:0 0 4px}
.sub{color:var(--mute);margin:0 0 14px}.stage{position:relative;display:inline-block;max-width:100%;cursor:crosshair;user-select:none}
.stage img{display:block;max-width:100%;max-height:62vh}.stage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}.bar button{background:var(--panel);border:1px solid var(--line);color:var(--ink);padding:7px 14px;border-radius:6px;cursor:pointer;font:inherit}
.bar button.primary{border-color:var(--verd)}.bar button:disabled{opacity:.4;cursor:default}.bar code{color:var(--mute)}.msg{color:var(--mute)}
.shapes{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;margin:6px 0 18px}.shape{margin:0}.shape div{background-size:cover;background-repeat:no-repeat;border-radius:3px;outline:1px solid var(--line)}
.shape figcaption{font-size:12px;color:var(--mute);margin-top:4px}.strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px}
.strip button{padding:0;border:2px solid transparent;border-radius:4px;background:none;cursor:pointer}.strip button.on{border-color:var(--ivory)}.strip img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:2px}
h2.sub{font:500 13px/1.4 inherit;letter-spacing:.06em;text-transform:uppercase}pre{background:#0a0a0c;border:1px solid var(--line);padding:10px 12px;border-radius:6px;display:inline-block;margin:0}
@media (max-width:760px){body{grid-template-columns:1fr;height:auto}aside{max-height:30vh;border-right:0;border-bottom:1px solid var(--line)}}
</style></head><body>
<aside><input id="q" placeholder="Filter voyages" autocomplete="off"><div id="list"></div></aside>
<main id="main"><p class="sub">Choose a voyage.</p></main>
<script type="module">
import { SHAPES, positionFor, cropRect } from '/cover.mjs';
const COLOURS = { card: 'var(--verd)', wide: 'var(--ivory)', hero: 'var(--lapis)', og: 'var(--ox)', screen: 'var(--violet)', tall: '#b89a6a', portrait: '#7d9a6a' };
const LABEL = { card: 'Card 3.5:1', wide: 'Photobook 3:1', hero: 'Hero 2.4:1', og: 'Link preview 1.91:1', screen: 'Tablet 16:9', tall: 'Phone hero 4:3', portrait: 'Phone cover 0.85:1' };
let voyages = [], cur = null, state = null;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function load(keep) { voyages = await (await fetch('/api/voyages')).json(); list(); if (keep) open(keep); }
function list() {
  const q = $('#q').value.toLowerCase();
  $('#list').innerHTML = voyages.filter((v) => v.label.toLowerCase().includes(q)).map((v) =>
    '<button data-k="' + esc(v.key) + '"' + (cur && cur.key === v.key ? ' class="on"' : '') + '>' + (v.cover ? '<span class="dot">● </span>' : '○ ') + esc(v.label) + '</button>').join('');
}
$('#q').oninput = list;
$('#list').onclick = (e) => { const b = e.target.closest('button'); if (b) open(b.dataset.k); };
function open(key) {
  cur = voyages.find((v) => v.key === key); list();
  const saved = cur.cover && cur.photos.some((p) => p.id === cur.cover.photo) ? cur.cover : null;
  state = { photo: saved ? saved.photo : cur.photos[0].id, focus: saved && saved.focus ? [...saved.focus] : [0.5, 0.5], saved };
  render();
}
const photo = () => cur.photos.find((p) => p.id === state.photo);
const dirty = () => !state.saved || state.saved.photo !== state.photo || !state.saved.focus || state.saved.focus.some((v, i) => Math.abs(v - state.focus[i]) > 1e-4);
const yamlOf = () => 'cover:\n  photo: ' + state.photo + '\n  focus: [' + state.focus.map((v) => +v.toFixed(3)).join(', ') + ']';
function render() {
  const p = photo();
  $('#main').innerHTML =
    '<h1>' + esc(cur.label) + '</h1><p class="sub">' + esc(cur.file) + ' · ' + esc(p.id) + (p.name ? ' · ' + esc(p.name) : '') + '</p>' +
    '<div class="stage" id="stage"><img id="ph" src="' + p.url + '/1920.webp" alt="" draggable="false"><svg id="ov" viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg></div>' +
    '<div class="bar"><button class="primary" id="save">Save to ' + esc(cur.file) + '</button><button id="reset">Back to saved</button><button id="centre">Centre</button><span class="msg" id="msg"></span></div>' +
    '<pre id="yaml"></pre><h2 class="sub" style="margin-top:18px">As the pages cut it</h2><div class="shapes" id="shapes"></div>' +
    '<h2 class="sub">The voyage\'s photographs</h2><div class="strip" id="strip">' +
    cur.photos.map((q) => '<button data-id="' + esc(q.id) + '"' + (q.id === state.photo ? ' class="on"' : '') + ' title="' + esc(q.id) + '"><img loading="lazy" src="' + q.url + '/480.webp" alt=""></button>').join('') + '</div>';
  const stage = $('#stage');
  const set = (e) => { const r = $('#ph').getBoundingClientRect(); state.focus = [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; draw(); };
  let held = false;
  stage.onpointerdown = (e) => { held = true; stage.setPointerCapture(e.pointerId); set(e); };
  stage.onpointermove = (e) => { if (held) set(e); };
  stage.onpointerup = () => { held = false; };
  $('#strip').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; state.photo = b.dataset.id; state.focus = [0.5, 0.5]; render(); };
  $('#reset').onclick = () => open(cur.key);
  $('#centre').onclick = () => { state.focus = [0.5, 0.5]; draw(); };
  $('#save').onclick = async () => {
    const r = await fetch('/api/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: cur.key, photo: state.photo, focus: state.focus.map((v) => +v.toFixed(3)) }) });
    const j = await r.json();
    $('#msg').textContent = r.ok ? 'Saved to ' + j.file + '. Run npm run photos:fetch (or rebuild) to see it on the site.' : 'Not saved: ' + j.error;
    if (r.ok) await load(cur.key);
  };
  draw();
}
function draw() {
  const p = photo(), r = p.w / p.h, f = state.focus;
  let svg = '';
  for (const [name, box] of Object.entries(SHAPES)) {
    const c = cropRect(f, p.w, p.h, box);
    svg += '<rect x="' + c.left / p.w * 1000 + '" y="' + c.top / p.h * 1000 + '" width="' + c.width / p.w * 1000 + '" height="' + c.height / p.h * 1000 + '" fill="none" stroke="' + COLOURS[name] + '" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity=".85"/>';
  }
  svg += '<g stroke="var(--ivory)" stroke-width="1.5" vector-effect="non-scaling-stroke"><line x1="' + (f[0] * 1000 - 18) + '" y1="' + f[1] * 1000 + '" x2="' + (f[0] * 1000 + 18) + '" y2="' + f[1] * 1000 + '"/><line x1="' + f[0] * 1000 + '" y1="' + (f[1] * 1000 - 18) + '" x2="' + f[0] * 1000 + '" y2="' + (f[1] * 1000 + 18) + '"/></g>';
  $('#ov').innerHTML = svg;
  $('#shapes').innerHTML = Object.entries(SHAPES).map(([name, box]) => {
    const h = name === 'portrait' || name === 'tall' ? 150 : 110, w = Math.round(h * box);
    return '<figure class="shape"><div style="width:' + w + 'px;height:' + h + 'px;background-image:url(' + p.url + '/960.webp);background-position:' + positionFor(f, r, box) + '"></div><figcaption><span style="color:' + COLOURS[name] + '">■</span> ' + LABEL[name] + '</figcaption></figure>';
  }).join('');
  $('#yaml').textContent = yamlOf();
  $('#save').disabled = !dirty();
}
document.onkeydown = (e) => {
  if (!state || e.target.tagName === 'INPUT') return;
  const d = e.shiftKey ? 0.02 : 0.005, k = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
  if (!k) return; e.preventDefault();
  state.focus = state.focus.map((v, i) => Math.min(1, Math.max(0, v + k[i]))); draw();
};
load().catch((e) => { $('#main').innerHTML = '<p class="sub">' + esc(e.message) + '</p>'; });
</script></body></html>`;

function serve(port) {
  const server = http.createServer((req, res) => {
    const send = (code, type, body) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
    try {
      if (req.method === 'GET' && req.url === '/') return send(200, 'text/html; charset=utf-8', PAGE);
      if (req.url === '/favicon.ico') return send(204, 'text/plain', '');
      if (req.method === 'GET' && req.url === '/cover.mjs') return send(200, 'text/javascript', fs.readFileSync(COVER_LIB));
      if (req.method === 'GET' && req.url === '/api/voyages') return send(200, 'application/json', JSON.stringify(voyages()));
      if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > 1e4) req.destroy(); });
        req.on('end', () => {
          try { send(200, 'application/json', JSON.stringify(save(JSON.parse(body)))); }
          catch (e) { send(400, 'application/json', JSON.stringify({ error: e.message })); }
        });
        return;
      }
      send(404, 'text/plain', 'not found');
    } catch (e) { send(500, 'application/json', JSON.stringify({ error: e.message })); }
  });
  // This machine only: the page writes into the repo.
  server.listen(port, '127.0.0.1', () => console.log(`cover focus: http://localhost:${port}  (Ctrl-C to stop)`));
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const i = process.argv.indexOf('--port');
  serve(i > 0 ? Number(process.argv[i + 1]) : 4400);
}
