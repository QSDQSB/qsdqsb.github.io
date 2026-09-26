/**
 * QSD's Palette (_pages/palette.html). One page, a voyage to each anchor: without one, every
 * voyage's palette in a column; with one (#london, #prague/twilight), "QSD's Palette for London":
 * its signature (no black or white) and its colour line, then every frame as a card (the lab's
 * design): the print, its colours as blocks with the hex inside (text to select) and the share
 * beneath, its name and light, its palette as the specs panel draws it, and its own colour line. The frames lie in the book's sequence or by colour: the order worked out at build time
 * from their 24 dots (lib/book.mjs colourOf), dark to light, like hues together. A print opens in
 * its book; ?at=<slug> marks the frame the reader came from.
 *
 * Data: /assets/palettes.json (scripts/photos/lib/atlas.mjs palettesOf).
 */

import { tips } from '../photobook/tip.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } } };

const root = document.getElementById('palette-page');
const stage = root?.querySelector('.palette-page__stage');
const title = root?.querySelector('h1');
const kicker = root?.querySelector('.palette-page__home');

/** A palette as a wall label: the bar (a link when `href`), the hex codes beneath. Widths tempered. */
function strip(colours, { href = null, label = '', shares = false } = {}) {
  const bands = colours.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('');
  const bar = href ? `<a class="palette-strip__bar" href="${href}" aria-label="${esc(label)}">${bands}</a>` : `<div class="palette-strip__bar" aria-hidden="true">${bands}</div>`;
  const hex = colours.map(([h, pc, accent]) => `<span title="${Math.round(pc)}%${accent ? ', accent' : ''}"><i style="--c:${h}"></i>${h.slice(1).toUpperCase()}${shares ? `<b>${Math.round(pc)}%</b>` : ''}</span>`).join('');
  return `<div class="palette-strip">${bar}<p class="palette-strip__hex">${hex}</p></div>`;
}

const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
const ink = (h) => (lum(h) > 0.55 ? 'rgba(0,0,0,.72)' : 'rgba(255,255,255,.82)');
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function oklab(h) {
  const r = lin(parseInt(h.slice(1, 3), 16)), g = lin(parseInt(h.slice(3, 5), 16)), b = lin(parseInt(h.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** OKLab → an sRGB hex, clipped into gamut. */
function srgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const g = (v) => { const x = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0'); };
  return `#${g(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${g(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)}${g(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
}

// What the wheel shows, said once under the voyage's and on the pointer over each frame's.
const WHEEL_NOTE = 'Its colours on the wheel of hue: the further out, the more vivid; joined from dark to light.';

/** A palette as blocks: equal widths, the hex inside (text to select), the share beneath. */
const blocks = (cs) => `<div class="palette-blocks">${cs.map(([h, pc, accent]) => `<div class="${accent ? 'is-accent' : ''}"><i style="--c:${h};--on:${ink(h)}">${h.slice(1).toUpperCase()}</i><b>${Math.round(pc * 10) / 10}%</b></div>`).join('')}</div>`;

/** A palette as the specs panel draws it: a thin bar, widths tempered. */
const bar = (cs) => `<div class="palette-card__bar" aria-hidden="true">${cs.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('')}</div>`;

/** A palette's colour line: its colours on the wheel of hue (OKLab a–b), joined from dark to light. */
function line(cs, size = 88) {
  const c = size / 2, R = c - 6, k = R / 0.2;
  // The rim: each dot the hue that lies at its angle (lightness 0.72, chroma 0.1), so a colour sits
  // beside its own hue.
  const ring = Array.from({ length: 24 }, (_, i) => { const t = (i / 24) * 2 * Math.PI; return `<circle cx="${(c + R * Math.cos(t)).toFixed(1)}" cy="${(c - R * Math.sin(t)).toFixed(1)}" r="1.1" class="photobook-wheel__hue" fill="${srgb(0.72, 0.1 * Math.cos(t), 0.1 * Math.sin(t))}"/>`; }).join('');
  const pts = cs.map(([h, pc]) => { const [, a, b] = oklab(h), r = Math.hypot(a, b) * k, f = r > R ? R / r : 1; return [c + a * k * f, c - b * k * f, h, pc]; });
  return `<svg class="photobook-wheel palette-card__wheel" viewBox="0 0 ${size} ${size}" role="img" aria-label="${WHEEL_NOTE}" data-tip="${WHEEL_NOTE}"><circle cx="${c}" cy="${c}" r="${R}" class="photobook-wheel__rim"/>${ring}
    <polyline points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" class="photobook-wheel__line"/>
    ${pts.map(([x, y, h, pc]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.8 + Math.sqrt(pc) * 0.55).toFixed(1)}" fill="${h}" class="photobook-wheel__dot"/>`).join('')}</svg>`;
}

/** The colour line: the voyage's colours on the wheel of hue, joined from dark to light. */
function wheel(w) {
  if (!w) return '';
  return `<svg class="photobook-wheel palette-page__wheel" viewBox="0 0 ${w.size} ${w.size}" aria-hidden="true">
    <circle cx="${w.c}" cy="${w.c}" r="${w.R}" class="photobook-wheel__rim"/>
    ${w.ring.map((r) => `<circle cx="${r.x}" cy="${r.y}" r="1.1" fill="${r.hex}" class="photobook-wheel__hue"/>`).join('')}
    <polyline points="${w.line}" class="photobook-wheel__line"/>
    ${w.pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.hex}" class="photobook-wheel__dot"/>`).join('')}</svg>`;
}

async function main() {
  let data = null;
  try { data = await (await fetch(new URL('../../palettes.json', import.meta.url))).json(); } catch { /* shown below */ }
  const voyages = (data?.voyages || []).filter((v) => data.pages?.[v.g]);
  if (!voyages.length) { stage.innerHTML = '<p class="colour-empty">The colours are still being read from the photographs.</p>'; return; }
  const pages = data.pages;
  const nameOf = (v) => pages[v.g].title;
  const sig = (v) => v.palette.map((c) => [c.hex, c.pc, c.accent ? 1 : 0]);
  let order = store.get('palette-order') === 'colour' ? 'colour' : 'sequence';

  function index() {
    document.title = document.title.replace(/^[^·]*·/, "QSD's Palette ·");
    title.textContent = "QSD's Palette";
    kicker.textContent = 'From the voyages';
    stage.innerHTML = `<p class="colour-lede">The colours of every voyage: each one's own, pooled from its photographs, without the black and white that every journey has.</p>
      <ol class="palette-index">${voyages.map((v) => `<li><a href="#${v.g}" class="palette-index__name">${esc(nameOf(v))}</a>${strip(sig(v), { href: `#${v.g}`, label: `QSD's Palette for ${nameOf(v)}` })}</li>`).join('')}</ol>`;
  }

  function voyage(v, at) {
    const name = nameOf(v), page = pages[v.g];
    document.title = document.title.replace(/^[^·]*·/, `QSD's Palette for ${name} ·`);
    title.textContent = `QSD's Palette for ${name}`;
    kicker.textContent = "QSD's Palette";
    const seq = order === 'colour' && v.order?.length === v.photos.length ? v.order : v.photos.map((_, i) => i);
    stage.innerHTML = `<section class="palette-voyage">
        <div>${blocks(sig(v))}
          <p class="palette-voyage__links"><a href="${page.url}">Open the book <span aria-hidden="true">→</span></a><a href="#">Every palette <span aria-hidden="true">→</span></a></p></div>
        <figure class="palette-voyage__wheel">${wheel(v.wheel)}<figcaption>${WHEEL_NOTE}</figcaption></figure>
      </section>
      <div class="photobook-sheet__order palette-page__order" role="group" aria-label="Order">
        <button type="button" aria-pressed="${order === 'sequence'}" data-order="sequence">Sequence</button>
        <button type="button" aria-pressed="${order === 'colour'}" data-order="colour">Colour</button>
      </div>
      <div class="palette-cards">${seq.map((i) => { const p = v.photos[i]; return `<article class="palette-card${p.slug === at ? ' is-from' : ''}" id="f-${esc(p.slug)}" style="view-transition-name:palette-f${i}">
          <a class="palette-card__print" href="${page.url}#${encodeURIComponent(p.slug)}" aria-label="${esc(p.name || p.slug)}, in its book"><img src="${p.url}/${p.sizes.find((s) => s >= 960) || p.sizes[p.sizes.length - 1] || 480}.webp" alt="" loading="lazy" decoding="async"></a>
          ${p.sig?.length ? blocks(p.sig) : ''}
          <div class="palette-card__row"><div>
            <h3>${esc(p.name || '')}${p.light ? `<small>${esc(p.light)}</small>` : ''}</h3>
            ${p.sig?.length ? bar(p.sig) : ''}
          </div>${p.sig?.length ? line(p.sig) : ''}</div>
        </article>`; }).join('')}</div>`;
    stage.querySelector('.palette-page__order').onclick = (e) => {
      const b = e.target.closest('button[data-order]'); if (!b || b.dataset.order === order) return;
      order = b.dataset.order; store.set('palette-order', order);
      const redraw = () => voyage(v, null);
      if (still() || !document.startViewTransition) redraw(); else document.startViewTransition(redraw);
    };
    if (at) requestAnimationFrame(() => document.getElementById(`f-${at}`)?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }

  function route() {
    const g = decodeURIComponent(location.hash.slice(1));
    const v = voyages.find((x) => x.g === g);
    const at = new URLSearchParams(location.search).get('at');
    if (v) voyage(v, at); else index();
    if (!v || !at) scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', () => { if (location.search) history.replaceState(null, '', location.pathname + location.hash); route(); });
  route();
}

if (stage) { tips(); main(); }
