/**
 * QSD's Palette (_pages/palette.html). One page, a voyage to each anchor: without one, every
 * voyage's palette in a column; with one (#london, #prague/twilight), "QSD's Palette for London":
 * its signature (no black or white) and its colour line, then every frame as a card (the lab's
 * design): the print, its colours as blocks with the hex inside (text to select) and the share
 * beneath, its name and light, and its palette as the specs panel draws it. Beside the voyage's
 * blocks, its dye vat (./vat.js): the same colours run together, each as much as its share; and
 * beside each frame's name and bar, the frame's own, poured as its card nears the screen. The frames lie in the book's sequence or by colour: the order worked out at build time
 * from their 24 dots (lib/book.mjs colourOf), dark to light, like hues together. A print opens in
 * its book; ?at=<slug> marks the frame the reader came from.
 *
 * Data: /assets/palettes.json (scripts/photos/lib/atlas.mjs palettesOf).
 */

import { tips } from '../photobook/tip.js';
import { vat, seedOf } from './vat.js';
import { crossfade } from '../photobook/wash.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } } };

const root = document.getElementById('palette-page');
const stage = root?.querySelector('.palette-page__stage');
const title = root?.querySelector('h1');
const kicker = root?.querySelector('.palette-page__home');
const railNav = root?.querySelector('.palette-rail');

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
  // The rail: every voyage as a small vat, by colour (dark to light, like with like), so the way
  // from one voyage's palette to the next is a step to its neighbour.
  const railed = voyages.every((v) => Number.isFinite(v.rank)) ? [...voyages].sort((a, b) => a.rank - b.rank) : voyages;

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
    // The voyage's name is the way back to its book, to the frame the reader came from when there was one.
    title.innerHTML = `QSD's Palette for <a class="palette-page__voyage" href="${page.url}${at ? `#${encodeURIComponent(at)}` : ''}" data-tip="Open the book" data-tip-side="top">${esc(name)}</a>`;
    kicker.textContent = "QSD's Palette";
    const seq = order === 'colour' && v.order?.length === v.photos.length ? v.order : v.photos.map((_, i) => i);
    stage.innerHTML = `<section class="palette-voyage">
        <div class="palette-voyage__blocks">${blocks(sig(v))}</div>
        <div data-vat></div>
      </section>
      <div class="photobook-sheet__order palette-page__order" role="group" aria-label="Order">
        <button type="button" aria-pressed="${order === 'sequence'}" data-order="sequence">Sequence</button>
        <button type="button" aria-pressed="${order === 'colour'}" data-order="colour">Colour</button>
      </div>
      <div class="palette-cards">${seq.map((i) => { const p = v.photos[i]; return `<article class="palette-card${p.slug === at ? ' is-from' : ''}" id="f-${esc(p.slug)}" data-n="${i}">
          <a class="palette-card__print" href="${page.url}#${encodeURIComponent(p.slug)}" aria-label="${esc(p.name || p.slug)}, in its book"><img src="${p.url}/${p.sizes.find((s) => s >= 960) || p.sizes[p.sizes.length - 1] || 480}.webp" alt="" loading="lazy" decoding="async"></a>
          ${p.sig?.length ? blocks(p.sig) : ''}
          <div class="palette-card__row"><div>
            <h3>${esc(p.name || '')}${p.light ? `<small>${esc(p.light)}</small>` : ''}</h3>
            ${p.sig?.length ? bar(p.sig) : ''}
          </div>${p.sig?.length ? `<div class="palette-card__vat" data-i="${i}"></div>` : ''}</div>
        </article>`; }).join('')}</div>`;
    stage.querySelector('[data-vat]').replaceWith(vatBox);
    fillVat(v);
    pour(v, stage.querySelectorAll('.palette-card__vat'));
    stage.querySelector('.palette-page__order').onclick = (e) => {
      const b = e.target.closest('button[data-order]'); if (!b || b.dataset.order === order) return;
      order = b.dataset.order; store.set('palette-order', order);
      const redraw = () => voyage(v, null);
      if (still() || !document.startViewTransition) { redraw(); return; }
      // Only the frames on or near the screen are named for the move (as the book's sheet does), and
      // only for as long as it lasts.
      const named = (on) => { for (const c of stage.querySelectorAll('.palette-card')) { const r = c.getBoundingClientRect(); c.style.viewTransitionName = on && r.bottom > -200 && r.top < innerHeight + 200 ? `palette-f${c.dataset.n}` : ''; } };
      named(true);
      document.startViewTransition(() => { redraw(); named(true); }).finished.finally(() => named(false));
    };
    if (at) requestAnimationFrame(() => document.getElementById(`f-${at}`)?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }

  // Each frame's own vat, poured as its card nears the screen, one a frame so scrolling stays smooth;
  // kept once poured, so a change of order moves them rather than pouring them again.
  const poured = new Map();
  let queue = [];
  const next = () => { const job = queue.shift(); if (!job) return; if (job.slot.isConnected) job.fill(); requestAnimationFrame(next); };
  /** Pour a vat into each slot as it nears view (`root`, `margin`), one a frame; a vat poured once is kept. */
  function drip(slots, keyOf, make, { root = null, margin = '600px 0px' } = {}) {
    const fill = (slot) => { const key = keyOf(slot); if (!poured.has(key)) poured.set(key, make(slot)); slot.replaceChildren(poured.get(key)); };
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { seen.unobserve(e.target); if (queue.push({ slot: e.target, fill: () => fill(e.target) }) === 1) requestAnimationFrame(next); }
    }, { root, rootMargin: margin });
    for (const slot of slots) if (poured.has(keyOf(slot))) fill(slot); else seen.observe(slot);
    return seen;
  }
  let cards = null; // the cards' watcher, let go when the cards are drawn again
  function pour(v, slots) {
    cards?.disconnect();
    const key = (slot) => `${v.g}/${v.photos[slot.dataset.i].slug}`;
    cards = drip(slots, key, (slot) => vat(v.photos[slot.dataset.i].sig, { size: 44, seed: seedOf(key(slot)) }));
  }

  // The voyage's own dye vat stays on the page from one voyage to the next: the new colours poured
  // in over the old, the old let go once they are covered.
  const vatBox = Object.assign(document.createElement('div'), { className: 'palette-voyage__vat' });
  // Behind the page, the same vat drawn large and lost in blur: the voyage's colours as the light the
  // whole page stands in, seen round and through its glass.
  const ambience = Object.assign(document.createElement('div'), { className: 'palette-ambience' });
  ambience.setAttribute('aria-hidden', 'true');
  root.prepend(ambience);
  // Both change as the book's wash does (../photobook/wash.js): the new laid over the old and faded
  // in. The light turns as the words leave; the vat once it is back among the new ones (moving an
  // element cuts its fade short).
  /** The room's light: the square inside the voyage's vat, 48 px, for the page to spread and soften
   *  (a small picture scaled up is already soft, and costs next to nothing to hold). */
  function room(v) {
    const c = vat(v.palette, { size: 96, seed: seedOf(v.g) }), out = document.createElement('canvas');
    const side = c.width / Math.SQRT2, at = (c.width - side) / 2;
    out.width = out.height = 48;
    out.getContext('2d').drawImage(c, at, at, side, side, 0, 0, 48, 48);
    return out;
  }
  function light(v) {
    const g = v?.g ?? '';
    if (ambience.dataset.g === g) return;
    ambience.dataset.g = g;
    crossfade(ambience, v ? room(v) : document.createElement('i'));
  }
  function fillVat(v) {
    if (vatBox.dataset.g === v.g) return;
    vatBox.dataset.g = v.g;
    crossfade(vatBox, vat(v.palette, { size: 176, seed: seedOf(v.g), label: `The colours of ${nameOf(v)}, run together as in a dye vat` }));
  }

  // The rail, above the title: built once, every voyage's dye vat by colour. Moving from one voyage
  // to another only moves the ring, and the rail glides to set the new one in the middle.
  function railTo(v) {
    if (!railNav.firstChild) {
      railNav.innerHTML = `<a class="palette-rail__step" data-step="-1">‹</a>
        <ol class="palette-rail__list">${railed.map((x) => `<li><a href="#${x.g}" data-g="${x.g}" data-tip="${esc(nameOf(x))}" data-tip-side="top" aria-label="${esc(nameOf(x))}"></a></li>`).join('')}</ol>
        <a class="palette-rail__step" data-step="1">›</a>`;
      drip(railNav.querySelectorAll('.palette-rail__list a'), (a) => `rail/${a.dataset.g}`, (a) => vat(voyages.find((x) => x.g === a.dataset.g).palette, { size: 40, seed: seedOf(a.dataset.g) }), { root: railNav.querySelector('.palette-rail__list'), margin: '0px 320px' });
      railNav.dataset.first = '';
    }
    const list = railNav.querySelector('.palette-rail__list');
    let here = null;
    for (const a of list.querySelectorAll('a')) { const on = a.dataset.g === v?.g; if (on) { a.setAttribute('aria-current', 'page'); here = a; } else a.removeAttribute('aria-current'); }
    const at_ = railed.indexOf(v);
    for (const step of railNav.querySelectorAll('[data-step]')) {
      const to = v ? railed[(at_ + Number(step.dataset.step) + railed.length) % railed.length] : null;
      step.hidden = !to;
      if (to) { step.href = `#${to.g}`; step.setAttribute('aria-label', nameOf(to)); step.dataset.tip = nameOf(to); step.dataset.tipSide = 'top'; }
    }
    if (here) {
      const first = 'first' in railNav.dataset;
      delete railNav.dataset.first;
      list.scrollTo({ left: here.offsetLeft - (list.clientWidth - here.offsetWidth) / 2, behavior: first || still() ? 'instant' : 'smooth' });
    }
  }
  // ← → step along the rail.
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const dir = { ArrowLeft: '-1', ArrowRight: '1' }[e.key];
    const step = dir && railNav.querySelector(`[data-step="${dir}"]:not([hidden])`);
    if (step) { e.preventDefault(); location.hash = step.getAttribute('href'); }
  });

  // From one voyage to the next: the words and frames fade out, the page returns to the top unseen,
  // the new ones rise in; the light and the dye vat meanwhile take the new colours.
  const parts = () => [title, ...stage.querySelectorAll('.palette-voyage__blocks, .palette-page__order, .palette-cards, .colour-lede, .palette-index')];
  let shown = null, routing = 0;
  async function route() {
    const g = decodeURIComponent(location.hash.slice(1));
    const v = voyages.find((x) => x.g === g);
    const at = new URLSearchParams(location.search).get('at');
    const token = ++routing, gliding = shown !== null && shown !== (v?.g ?? '') && !still();
    railTo(v);
    light(v);
    if (gliding) {
      await Promise.all(parts().map((el) => el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {})));
      if (token !== routing) return;
    }
    shown = v?.g ?? '';
    if (v) voyage(v, at); else index();
    if (!v || !at) scrollTo({ top: 0, behavior: 'instant' });
    for (const el of parts()) el.getAnimations().forEach((a) => a.cancel());
    if (gliding) for (const el of parts()) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  addEventListener('hashchange', () => { if (location.search) history.replaceState(null, '', location.pathname + location.hash); route(); });
  route();
}

if (stage) { tips(); main(); }
