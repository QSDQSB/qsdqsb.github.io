/**
 * QSD's Palette (_pages/palette.html). One page, a voyage to each anchor: without one, every
 * voyage's palette in a column; with one (#london, #prague/twilight), "QSD's Palette for London":
 * its signature (no black or white) and its colour line, then every frame as a card (the lab's
 * design): the print, its colours as blocks with the hex inside (text to select) and the share
 * beneath, its name and light, and its palette as the specs panel draws it. Beside the voyage's
 * blocks, its dye vat (./vat.js): the same colours run together, each as much as its share. The
 * frames lie in the book's sequence or by colour: the order worked out at build time
 * from their 24 dots (lib/book.mjs colourOf), dark to light, like hues together. A print opens in
 * its book; ?at=<slug> marks the frame the reader came from.
 *
 * Data: /assets/palettes.json (scripts/photos/lib/atlas.mjs palettesOf).
 */

import { tips } from '../photobook/tip.js';
import { vat, seedOf } from './vat.js';

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
/** A palette as blocks: equal widths, the hex inside (text to select), the share beneath. */
const blocks = (cs) => `<div class="palette-blocks">${cs.map(([h, pc, accent]) => `<div class="${accent ? 'is-accent' : ''}"><i style="--c:${h};--on:${ink(h)}">${h.slice(1).toUpperCase()}</i><b>${Math.round(pc * 10) / 10}%</b></div>`).join('')}</div>`;

/** A palette as the specs panel draws it: a thin bar, widths tempered. */
const bar = (cs) => `<div class="palette-card__bar" aria-hidden="true">${cs.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('')}</div>`;

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
        <div class="palette-voyage__vat"></div>
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
          </div></div>
        </article>`; }).join('')}</div>`;
    stage.querySelector('.palette-voyage__vat').append(vat(v.palette, { size: 176, seed: seedOf(v.g), label: `The colours of ${name}, run together as in a dye vat` }));
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
