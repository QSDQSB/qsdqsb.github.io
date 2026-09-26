/**
 * Drift (_pages/drift.html): one photograph at a time, each followed by the nearest in colour from
 * another voyage. The next frame is the first of this one's kindred (scripts/photos/lib/atlas.mjs)
 * not yet seen and not from any of the last three voyages, so the way keeps travelling; when every
 * kindred frame is spent, any frame not yet seen. The room takes each frame's colours; the way so
 * far gathers at the foot, a sliver a frame, and a sliver goes back to its frame.
 *
 * It opens on an overture: the room takes the first frame's colours while the title stands alone,
 * and only then does the frame itself develop, so the colour arrives before the picture. Nothing is
 * ever drawn over a print.
 *
 * On its own it drifts every few seconds; Space pauses, → and ← step, a tap on either half does the
 * same. Starts at ?from=<gallery>/<slug>, else anywhere.
 *
 * Data: /assets/colour-atlas.json.
 */

import { tips } from '../photobook/tip.js';

const DWELL = 7000;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const deg = (d) => `${d < 0 ? '−' : ''}${Math.abs(d)}°`;
const GROUND = [16, 16, 18];
/** A colour taken most of the way back to the dark ground, as the Photobook's glow does. */
const soften = (h, k = 0.42) => { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]; return `rgb(${c.map((v, i) => Math.round(GROUND[i] + (v - GROUND[i]) * k)).join(',')})`; };

const root = document.getElementById('colour-drift');

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

  const from = new URLSearchParams(location.search).get('from');
  let at = from ? all.findIndex((p) => `${p.g}/${p.slug}` === from) : -1;
  if (at < 0) at = Math.floor(Math.random() * all.length);

  const way = [];            // indices, in the order drifted
  const seen = new Set();
  let pos = -1, playing = !still(), timer = 0, washOn = 0, current = null;

  function nextOf(i) {
    const recent = new Set(way.slice(-3).map((k) => all[k].v));
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
  const preload = (i) => { if (i != null) { const im = new Image(); im.src = srcOf(all[i]); } };

  function show(i, { push = true } = {}) {
    const p = all[i];
    if (push) { way.push(i); pos = way.length - 1; seen.add(i); addSliver(i, pos); }
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
    preload(nextOf(i));
    schedule();
  }

  // The words, the way and the address change with the picture, not before it.
  function dress(p) {
    const page = pages[p.g];
    caption.innerHTML = `<p class="colour-drift__name">${esc(p.name)}</p>
      <p class="colour-drift__meta">${esc([p.city, page?.title].filter((v, k, arr) => v && arr.indexOf(v) === k).join(' · '))}${p.light ? `<span>${esc(p.light)}${p.alt != null ? ` · ${deg(p.alt)}` : ''}</span>` : ''}</p>`;
    openEl.href = page ? `${page.url}#${p.slug}` : '#';
    for (const s of thread.children) s.classList.toggle('is-on', Number(s.dataset.k) === pos);
    thread.querySelector('.is-on')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still() ? 'instant' : 'smooth' });
    history.replaceState(null, '', `?from=${encodeURIComponent(`${p.g}/${p.slug}`)}`);
  }

  // The room: three of the frame's colours, softened, crossfading from the last.
  let washed = null;
  function wash(p) {
    if (washed === p) return;
    washed = p;
    const w = washes[washOn = 1 - washOn];
    const [a, b, c] = [p.sw[0], p.sw[1] || p.sw[0], p.sw[2] || p.sw[0]];
    w.style.background = `radial-gradient(60% 70% at 20% 20%, ${soften(a)}, transparent 70%), radial-gradient(60% 70% at 80% 30%, ${soften(b)}, transparent 70%), radial-gradient(80% 60% at 50% 100%, ${soften(c, 0.3)}, transparent 70%)`;
    w.classList.add('is-on'); washes[1 - washOn].classList.remove('is-on');
  }

  function addSliver(i, k) {
    const p = all[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.k = k;
    b.style.cssText = `--t:${p.strip[0]};--m:${p.strip[1]};--b:${p.strip[2]}`;
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
  if (still()) { root.classList.add('is-under-way'); setPlaying(playing); show(at); return; }
  root.classList.add('is-overture');
  wash(all[at]);
  preload(at);
  setTimeout(() => {
    root.classList.add('is-under-way');
    setTimeout(() => { root.classList.remove('is-overture'); setPlaying(playing); show(at); }, 900);
  }, 2600);
}

if (root) main();
