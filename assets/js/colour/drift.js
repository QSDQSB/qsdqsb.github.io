/**
 * Drift (_pages/drift.html): one photograph at a time, each followed by the nearest in colour from
 * another voyage. The next frame is the first of this one's kindred (scripts/photos/lib/atlas.mjs)
 * not yet seen and not from any of the last three voyages, so the way keeps travelling; when every
 * kindred frame is spent, any frame not yet seen. The room takes each frame's colours; the way so
 * far gathers at the foot, a frame's dye vat for each (./vat.js), and a vat goes back to its frame.
 *
 * It opens on an overture: the room takes the first frame's colours while the title stands alone,
 * and only then does the frame itself develop, so the colour arrives before the picture. Nothing is
 * ever drawn over a print.
 *
 * On its own it drifts every few seconds; Space pauses, → and ← step, a tap on either half does the
 * same. Starts at ?from=<gallery>/<slug>, else anywhere. With &c=<hex> (Reverie's "Drift in this
 * colour"), the way is laid first through every photograph that holds that colour (./cards.js holding),
 * the most of it first, and only then wanders on; the masthead's ‹ (and Esc) go back to the colour.
 * In a colour the way begins with the colour itself, its dye full screen as Reverie opens on it (&src,
 * the photograph it was found in, lends its colours), then that photograph, then the others; it opens
 * on the colour, and with &open on a photograph chosen there, held until moved on.
 *
 * Data: /assets/colour-atlas.json.
 */

import { tips } from '../photobook/tip.js';
import { vat, seedOf } from './vat.js';
import { holding, varied, SHOWN, focus, shadeFor } from './cards.js';

const DWELL = 7000;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const deg = (d) => `${d < 0 ? '−' : ''}${Math.abs(d)}°`;
const GROUND = [16, 16, 18];
/** A colour taken most of the way back to the dark ground, as the Photobook's glow does. */
const soften = (h, k = 0.58) => { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]; return `rgb(${c.map((v, i) => Math.round(GROUND[i] + (v - GROUND[i]) * k)).join(',')})`; };

const root = document.getElementById('colour-drift');
const REVERIE = new URL('../../../reverie/', import.meta.url).pathname;

async function main() {
  tips();
  let data = null;
  try { data = await (await fetch(new URL('../../colour-atlas.json', import.meta.url))).json(); } catch { /* shown below */ }
  const all = data?.photos || [];
  const stage = root.querySelector('.colour-drift__stage');
  if (!all.length) {
    stage.insertAdjacentHTML('beforeend', '<p class="colour-empty">The colours are still being read from the photographs.</p>');
    root.querySelector('.colour-drift__foot').hidden = true;
    return;
  }
  const pages = data.pages || {};
  const caption = root.querySelector('.colour-drift__caption');
  const thread = root.querySelector('.colour-drift__thread');
  const openEl = root.querySelector('.colour-drift__open');
  const playEl = root.querySelector('[data-act="play"]');
  const washes = [...root.querySelectorAll('.colour-drift__wash i')];

  const q = new URLSearchParams(location.search), from = q.get('from'), opened = q.has('open'), src = q.get('src') || from;
  const colour = /^[0-9a-f]{6}$/i.test(q.get('c') || '') ? `#${q.get('c').toLowerCase()}` : null;
  // In a colour: the colour itself first (COLOUR), then the photograph it was found in, then the others
  // that hold it, the most of it first: Reverie's order, walked before anything else.
  const COLOUR = -1, indexOf = (key) => (key ? all.findIndex((p) => `${p.g}/${p.slug}` === key) : -1);
  const source = colour ? indexOf(src) : -1;
  const inColour = colour ? [...(source >= 0 ? [source] : []), ...varied(holding(all.filter((p) => p.dots), colour, { not: all[source] }), { most: SHOWN - (source >= 0 ? 1 : 0) }).map(({ f }) => all.indexOf(f))] : [];
  const dye = colour && source >= 0 && all[source].sig?.length ? focus(all[source].sig, colour) : colour ? [[colour, 100]] : null;
  // Opening on the colour itself, or on a photograph: as asked, else the colour's first, else any.
  const onColour = !!colour && !opened;
  let at = onColour ? COLOUR : indexOf(from);
  if (!onColour && at < 0) at = inColour[0] ?? Math.floor(Math.random() * all.length);
  if (colour) {
    root.querySelector('.colour-drift__head .colour-kicker').textContent = `In ${colour.toUpperCase()}`;
    // The way back is to the colour: the Reverie the reader came from, as they left it, when they came
    // from one; else the colour's own.
    const back = document.querySelector('.masthead__back'), reverie = REVERIE;
    const came = document.referrer && new URL(document.referrer).origin === location.origin && new URL(document.referrer).pathname === reverie;
    if (back) {
      back.href = came ? document.referrer : `${reverie}?c=${colour.slice(1)}${src ? `&from=${encodeURIComponent(src)}` : ''}`;
      back.setAttribute('aria-label', `Back to ${colour.toUpperCase()}`); back.dataset.tip = `Back to ${colour.toUpperCase()}`;
      back.setAttribute('data-own-links', ''); // left to this page (../view-transitions.js), so it can step back
      back.addEventListener('click', (e) => { if (came && history.length > 1) { e.preventDefault(); history.back(); } });
      addEventListener('keydown', (e) => { if (e.key === 'Escape') back.click(); });
    }
  }

  const way = [];            // indices, in the order drifted
  const seen = new Set();
  let pos = -1, playing = !still() && !opened, timer = 0, washOn = 0, current = null;
  // In a colour, the way is laid through its photographs at once (their vats along the foot), so ← and
  // → step through them in order from the one chosen; past the last, the drift goes on as ever.
  if (colour) {
    if (at !== COLOUR && !inColour.includes(at)) inColour.unshift(at);
    [COLOUR, ...inColour].forEach((i, k) => { way.push(i); seen.add(i); addStep(i, k); });
    pos = way.indexOf(at);
  }
  const first = { push: !way.length };

  function nextOf(i) {
    if (i === COLOUR) return inColour[0] ?? null;
    const held = inColour.find((j) => !seen.has(j));
    if (held != null) return held;
    const recent = new Set(way.slice(-3).filter((k) => k !== COLOUR).map((k) => all[k].v));
    const k = all[i].k || [];
    return k.find((j) => !seen.has(j) && !recent.has(all[j].v))
      ?? k.find((j) => !seen.has(j))
      ?? (() => { const left = all.map((_, j) => j).filter((j) => !seen.has(j)); return left.length ? left[Math.floor(Math.random() * left.length)] : null; })();
  }

  // The smallest rendition that fills the stage at this screen's density (named by the long edge).
  const srcOf = (p) => {
    const r = p.r || 1.5, box = stage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const need = Math.max(box.width * dpr * Math.max(1, 1 / r), box.height * dpr * Math.max(1, r));
    const s = p.sizes.filter((w) => w <= 2560);
    return `${p.url}/${s.find((w) => w >= need) || s[s.length - 1] || 480}.webp`;
  };
  const preload = (i) => { if (i != null && i !== COLOUR) { const im = new Image(); im.src = srcOf(all[i]); } };

  // The colour, full screen: its dye (the rectangular vat, drawn small and spread) and its hex upon it.
  function colourFrame() {
    const box = stage.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'colour-drift__print colour-drift__colour';
    el.style.setProperty('--shade', shadeFor(colour));
    const field = vat(dye, { shape: 'rect', width: Math.max(1, Math.round(box.width / 8)), height: Math.max(1, Math.round(box.height / 8)), seed: seedOf(src || colour), soon: true });
    el.append(field);
    el.insertAdjacentHTML('beforeend', `<p class="reverie__hex colour-drift__hex" style="--c:${colour}">${colour.toUpperCase()}</p>`);
    el.ready = field.ready.then(() => el);
    return el;
  }

  function show(i, { push = true } = {}) {
    if (i === COLOUR) return showColour();
    const p = all[i];
    if (push) { way.push(i); pos = way.length - 1; seen.add(i); addStep(i, pos); }
    const img = new Image();
    img.className = 'colour-drift__print';
    img.alt = p.name || '';
    img.src = srcOf(p);
    img.style.setProperty('--r', p.r || 1.5);
    const put = () => {
      if (way[pos] !== i) return; // stepped on before this one arrived
      stage.appendChild(img);
      dress(p);
      const old = current; current = img;
      if (still()) { old?.remove(); img.classList.add('is-on'); }
      else {
        requestAnimationFrame(() => img.classList.add('is-on'));
        if (old) { old.classList.remove('is-on'); setTimeout(() => old.remove(), 1400); }
      }
    };
    if (img.complete) put(); else { img.onload = put; img.onerror = put; }
    wash(p);
    preload(way[pos + 1] ?? nextOf(i));
    schedule();
  }

  function showColour() {
    const el = colourFrame();
    el.ready.then(() => {
      if (way[pos] !== COLOUR) return;
      stage.appendChild(el);
      caption.innerHTML = `<p class="colour-drift__meta">In ${inColour.length} photograph${inColour.length === 1 ? '' : 's'}</p>`; // the hex is on the dye itself
      openEl.href = `${REVERIE}?c=${colour.slice(1)}${src ? `&from=${encodeURIComponent(src)}` : ''}`;
      openEl.setAttribute('aria-label', 'Open in Reverie'); openEl.dataset.tip = 'Open in Reverie';
      for (const s of thread.children) s.classList.toggle('is-on', Number(s.dataset.k) === pos);
      const old = current; current = el;
      if (still()) { old?.remove(); el.classList.add('is-on'); }
      else { requestAnimationFrame(() => el.classList.add('is-on')); if (old) { old.classList.remove('is-on'); setTimeout(() => old.remove(), 1400); } }
    });
    wash({ sw: dye.map(([h]) => h) });
    preload(way[pos + 1]);
    schedule();
  }

  // The words, the way and the address change with the picture, not before it.
  function dress(p) {
    const page = pages[p.g];
    caption.innerHTML = `<p class="colour-drift__name">${esc(p.name)}</p>
      <p class="colour-drift__meta">${esc([p.city, page?.title].filter((v, k, arr) => v && arr.indexOf(v) === k).join(' · '))}${p.light ? `<span>${esc(p.light)}${p.alt != null ? ` · ${deg(p.alt)}` : ''}</span>` : ''}</p>`;
    openEl.href = page ? `${page.url}#${p.slug}` : '#';
    openEl.setAttribute('aria-label', 'Open in its book'); openEl.dataset.tip = 'Open in its book';
    for (const s of thread.children) s.classList.toggle('is-on', Number(s.dataset.k) === pos);
    thread.querySelector('.is-on')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still() ? 'instant' : 'smooth' });
    history.replaceState(null, '', `?from=${encodeURIComponent(`${p.g}/${p.slug}`)}${colour ? `&c=${colour.slice(1)}${src ? `&src=${encodeURIComponent(src)}` : ''}&open` : ''}`);
  }

  // The room: three of the frame's colours, softened, crossfading from the last.
  let washed = null;
  function wash(p) {
    if (washed === p) return;
    washed = p;
    const w = washes[washOn = 1 - washOn];
    const [a, b, c] = [p.sw[0], p.sw[1] || p.sw[0], p.sw[2] || p.sw[0]];
    w.style.background = `radial-gradient(60% 70% at 20% 20%, ${soften(a)}, transparent 70%), radial-gradient(60% 70% at 80% 30%, ${soften(b)}, transparent 70%), radial-gradient(80% 60% at 50% 100%, ${soften(c, 0.42)}, transparent 70%)`;
    w.classList.add('is-on'); washes[1 - washOn].classList.remove('is-on');
  }

  // Each frame on the way as its dye vat, the same one its card pours on the palette page; a frame
  // whose palette is still to be read keeps its three-band sliver of colour, drawn round.
  function addStep(i, k) {
    if (i === COLOUR) {
      const c = document.createElement('button');
      c.type = 'button'; c.dataset.k = k; c.className = 'is-colour';
      c.append(vat(dye, { size: 20, seed: seedOf(src || colour) }));
      c.setAttribute('aria-label', `${k + 1}: ${colour.toUpperCase()}`); c.dataset.tip = colour.toUpperCase();
      thread.appendChild(c);
      return;
    }
    const p = all[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.k = k;
    if (p.sig?.length) b.append(vat(p.sig, { size: 20, seed: seedOf(`${p.g}/${p.slug}`) }));
    else b.style.cssText = `--t:${p.strip[0]};--m:${p.strip[1]};--b:${p.strip[2]}`;
    b.setAttribute('aria-label', `${k + 1}: ${p.name || ''}`);
    b.dataset.tip = p.name || '';
    thread.appendChild(b);
  }

  const next = () => {
    if (pos < way.length - 1) { pos++; return show(way[pos], { push: false }); }
    const n = nextOf(way[pos]);
    if (n != null) show(n);
  };
  const back = () => { if (pos > 0) { pos--; show(way[pos], { push: false }); } };
  function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(next, DWELL); }
  function setPlaying(v) { playing = v; playEl.setAttribute('aria-pressed', String(v)); playEl.dataset.tip = v ? 'Pause · Space' : 'Drift · Space'; schedule(); }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b?.dataset.act === 'next') { next(); }
    else if (b?.dataset.act === 'back') { back(); }
    else if (b?.dataset.act === 'play') { setPlaying(!playing); }
    const s = e.target.closest('.colour-drift__thread button');
    if (s) { pos = Number(s.dataset.k); show(way[pos], { push: false }); }
  });
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
  });
  // A hidden tab does not drift on unseen.
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else schedule(); });

  // The overture: the title alone in the first frame's colours; then it gives way and the frame develops.
  // In a colour, the colour is its own overture.
  if (still() || colour) { root.classList.add('is-under-way'); setPlaying(playing); show(at, first); return; }
  root.classList.add('is-overture');
  wash(all[at]);
  preload(at);
  setTimeout(() => {
    root.classList.add('is-under-way');
    setTimeout(() => { root.classList.remove('is-overture'); setPlaying(playing); show(at, first); }, 900);
  }, 2600);
}

if (root) main();
