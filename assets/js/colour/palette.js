/**
 * QSD's Palette (_pages/palette.html). One page, a voyage to each anchor: without one, every
 * voyage's palette in a column; with one (#london, #prague/twilight), "QSD's Palette for London":
 * its signature (no black or white) and its colour line, then every frame as a card (the lab's
 * design): the print, its colours as blocks with the hex inside (text to select) and the share
 * beneath, its name and light, its palette as the specs panel draws it, and its constellation: its
 * 24 dots on the wheel of hue. The voyage's own is every frame's, pooled into a nebula. The frames lie in the book's sequence or by colour: the order worked out at build time
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

/** A palette as blocks: equal widths, the hex inside (text to select), the share beneath. */
const blocks = (cs) => `<div class="palette-blocks">${cs.map(([h, pc, accent]) => `<div class="${accent ? 'is-accent' : ''}"><i style="--c:${h};--on:${ink(h)}">${h.slice(1).toUpperCase()}</i><b>${Math.round(pc * 10) / 10}%</b></div>`).join('')}</div>`;

/** A palette as the specs panel draws it: a thin bar, widths tempered. */
const bar = (cs) => `<div class="palette-card__bar" aria-hidden="true">${cs.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('')}</div>`;

/** A photograph's 24 dots (`rrggbbss` × 24): [hex, share]. */
const dotsOf = (str) => { const out = []; for (let i = 0; str && i + 8 <= str.length; i += 8) out.push([`#${str.slice(i, i + 6)}`, (parseInt(str.slice(i + 6, i + 8), 16) || 1) / 255]); return out; };

let skyId = 0;
/**
 * A constellation of colour: dots on the wheel of hue, each at its hue (the angle) and vividness
 * (the distance from the centre, square-rooted so the muted colours of most photographs still
 * spread), sized by its share and lit by a soft glow; the rim a thin, continuous ring of hue. A
 * frame's 24 dots, or a voyage's hundreds, pooled into a nebula.
 */
function constellation(dots, { size = 88, nebula = false, label = '' } = {}) {
  const c = size / 2, R = c - 3, id = `sky${skyId++}`;
  const rim = Array.from({ length: 72 }, (_, i) => {
    const t0 = (i / 72) * 2 * Math.PI, t1 = ((i + 1.15) / 72) * 2 * Math.PI, t = (t0 + t1) / 2;
    return `<path d="M${(c + R * Math.cos(t0)).toFixed(2)} ${(c - R * Math.sin(t0)).toFixed(2)}A${R} ${R} 0 0 0 ${(c + R * Math.cos(t1)).toFixed(2)} ${(c - R * Math.sin(t1)).toFixed(2)}" stroke="${srgb(0.7, 0.11 * Math.cos(t), 0.11 * Math.sin(t))}"/>`;
  }).join('');
  // Always coloured, as the palettes are: a dot that looks black would only be a hole in the sky.
  const stars = dots.filter(([h]) => { const [L, a, b] = oklab(h); return !(L < 0.25 && Math.hypot(a, b) < 0.05); }).map(([h, w]) => {
    const [, a, b] = oklab(h), C = Math.hypot(a, b), r = Math.min(1, Math.sqrt(C / 0.2)) * (R - 4), t = Math.atan2(b, a);
    const x = c + r * Math.cos(t), y = c - r * Math.sin(t);
    const rad = nebula ? 0.7 + Math.sqrt(w) * 5 : 1 + Math.sqrt(w * 24) * 1.9;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${h}"/>`;
  }).join('');
  return `<svg class="palette-sky" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">
    <defs><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${nebula ? 2.4 : 1.6}"/></filter></defs>
    <circle cx="${c}" cy="${c}" r="${R}" class="palette-sky__disc"/>
    <g class="palette-sky__rim" fill="none" stroke-width="${nebula ? 1.2 : 1}">${rim}</g>
    <g filter="url(#${id})" opacity="${nebula ? 0.55 : 0.7}">${stars}</g>
    <g opacity="${nebula ? 0.5 : 0.95}">${stars}</g>
  </svg>`;
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
        <div class="palette-voyage__sky">${constellation(v.photos.flatMap((p) => dotsOf(p.dots).map(([h, w]) => [h, w / v.photos.length])), { size: 180, nebula: true, label: `Every colour of ${name}, on the wheel of hue` })}</div>
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
          </div>${p.dots ? constellation(dotsOf(p.dots), { label: `The colours of ${p.name || 'this frame'}, on the wheel of hue` }) : ''}</div>
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
