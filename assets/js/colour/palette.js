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
import { vat, seedOf, oklab } from './vat.js';
import { crossfade } from '../photobook/wash.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } } };

const root = document.getElementById('palette-page');
const stage = root?.querySelector('.palette-page__stage');
const title = root?.querySelector('h1');
const kicker = root?.querySelector('.palette-page__home');
const railNav = root?.querySelector('.palette-rail');
const back = document.querySelector('.masthead__back');
const menu = root?.querySelector('.palette-voyages'), menuList = menu?.querySelector('.palette-voyages__list');
const fold = menu?.querySelector('.palette-voyages__fold'), menuButton = root?.querySelector('.palette-page__menu');

/** A palette as a wall label: the bar (a link when `href`), the hex codes beneath. Widths tempered. */
function strip(colours, { href = null, label = '', shares = false } = {}) {
  const bands = colours.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('');
  const bar = href ? `<a class="palette-strip__bar" href="${href}" aria-label="${esc(label)}">${bands}</a>` : `<div class="palette-strip__bar" aria-hidden="true">${bands}</div>`;
  const hex = colours.map(([h, pc, accent]) => `<span title="${Math.round(pc)}%${accent ? ', accent' : ''}"><i style="--c:${h}"></i>${h.slice(1).toUpperCase()}${shares ? `<b>${Math.round(pc)}%</b>` : ''}</span>`).join('');
  return `<div class="palette-strip">${bar}<p class="palette-strip__hex">${hex}</p></div>`;
}

/** Black or white for the hex on a block, whichever reads better against it (WCAG contrast). */
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const ink = (h) => {
  const n = parseInt(h.slice(1), 16), L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#000' : '#fff'; // pure, so even a middling colour reads at 4.5:1 or better
};
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
  // The masthead's way back (_layouts/default.html, from the page's masthead_back_*): to the voyages
  // on the page of every palette, to the book on a voyage's.
  if (back) { back.dataset.home = back.getAttribute('href'); back.dataset.homeLabel = back.getAttribute('aria-label'); }
  const backTo = (href, label) => { if (!back || !href) return; back.href = href; back.setAttribute('aria-label', label); back.dataset.tip = label; };
  // The rail: every voyage as a small vat, by colour (dark to light, like with like), so the way
  // from one voyage's palette to the next is a step to its neighbour.
  const railed = voyages.every((v) => Number.isFinite(v.rank)) ? [...voyages].sort((a, b) => a.rank - b.rank) : voyages;

  function index() {
    document.title = document.title.replace(/^[^·]*·/, "QSD's Palette ·");
    title.textContent = "QSD's Palette";
    backTo(back?.dataset.home, back?.dataset.homeLabel);
    kicker.textContent = 'From the voyages';
    stage.innerHTML = `<p class="colour-lede">The colours of every voyage: each one's own, pooled from its photographs, without the black and white that every journey has.</p>
      <ol class="palette-index">${voyages.map((v) => `<li><a href="#${v.g}" class="palette-index__name">${esc(nameOf(v))}</a>${strip(sig(v), { href: `#${v.g}`, label: `QSD's Palette for ${nameOf(v)}` })}</li>`).join('')}</ol>`;
  }

  function voyage(v, at) {
    const name = nameOf(v), page = pages[v.g];
    document.title = document.title.replace(/^[^·]*·/, `QSD's Palette for ${name} ·`);
    // The masthead's ‹ goes back to the voyage's book, to the frame the reader came from when there was one.
    backTo(`${page.url}${at ? `#${encodeURIComponent(at)}` : ''}`, `Back to ${name}`);
    title.textContent = `QSD's Palette for ${name}`;
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
      <h2 class="visually-hidden">The frames</h2>
      <div class="palette-cards">${seq.map((i) => { const p = v.photos[i]; return `<article class="palette-card${p.slug === at ? ' is-from' : ''}" id="f-${esc(p.slug)}" data-n="${i}">
          <a class="palette-card__print" href="${page.url}#${encodeURIComponent(p.slug)}" aria-label="${esc(p.name || p.slug)}, in its book"><img style="--r:${p.r || 1.5}" src="${p.url}/${p.sizes.find((s) => s >= 960) || p.sizes[p.sizes.length - 1] || 480}.webp" alt="" loading="lazy" decoding="async"></a>
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
    for (const old of vatBox.children) setTimeout(() => old.release?.(), 1400); // once faded, its context goes
    // Stirred while the pointer rests on it; settled back, true to its shares, when it leaves.
    crossfade(vatBox, vat(v.palette, { size: 176, seed: seedOf(v.g), stir: 'hover', label: `The colours of ${nameOf(v)}, run together as in a dye vat` }));
  }

  // The rail, above the title: built once, every voyage's dye vat by colour, without end: the run is
  // laid three times and the reader kept in the middle one, moved a whole run along (unseen, the runs
  // being alike) whenever they near either end, so the last voyage leads on to the first. Moving
  // from one voyage to another only moves the ring, and the rail glides the short way round to set
  // the new one in the middle. The outer runs are for the eye alone; their vats are copies.
  let railList = null, gliding_ = false;
  const runWidth = () => { const a = railList.children[railed.length], b = railList.children[0]; return a.offsetLeft - b.offsetLeft; };
  const centre = (el) => el.offsetLeft - (railList.clientWidth - el.offsetWidth) / 2;
  const wrap = () => {
    if (gliding_) return;
    const run = runWidth(), x = railList.scrollLeft;
    if (x < run * 0.5) railList.scrollLeft = x + run;
    else if (x > run * 1.5) railList.scrollLeft = x - run;
  };
  function copyOf(canvas) {
    const c = Object.assign(document.createElement('canvas'), { width: canvas.width, height: canvas.height, className: canvas.className });
    c.style.cssText = canvas.style.cssText; c.setAttribute('aria-hidden', 'true');
    c.getContext('2d').drawImage(canvas, 0, 0);
    return c;
  }
  function railTo(v) {
    if (!railNav.firstChild) {
      const run = (copy) => railed.map((x) => `<li${copy === 1 ? '' : ' aria-hidden="true"'}><a href="#${x.g}" data-g="${x.g}" data-copy="${copy}"${copy === 1 ? ` data-tip="${esc(nameOf(x))}" data-tip-side="top" aria-label="${esc(nameOf(x))}"` : ' tabindex="-1"'}></a></li>`).join('');
      railNav.innerHTML = `<a class="palette-rail__step" data-step="-1">‹</a>
        <ol class="palette-rail__list">${run(0)}${run(1)}${run(2)}</ol>
        <a class="palette-rail__step" data-step="1">›</a>`;
      railList = railNav.querySelector('.palette-rail__list');
      // A voyage's vat is poured once; its places in the other runs take a copy.
      drip(railList.querySelectorAll('a'), (a) => `rail/${a.dataset.g}/${a.dataset.copy}`, (a) => {
        const first = [0, 1, 2].map((k) => poured.get(`rail/${a.dataset.g}/${k}`)).find(Boolean);
        return first ? copyOf(first) : vat(voyages.find((x) => x.g === a.dataset.g).palette, { size: 40, seed: seedOf(a.dataset.g) });
      }, { root: railList, margin: '0px 320px' });
      let ticking = false;
      railList.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; wrap(); }); } }, { passive: true });
      // When the rail changes width (the list folded away, a window resized), the voyage on the page
      // is set back in the middle, at once.
      new ResizeObserver(() => {
        if (gliding_) return;
        const cur = railList.querySelector('a[data-copy="1"][aria-current]');
        if (cur) railList.scrollLeft = centre(cur);
      }).observe(railList);
      railNav.dataset.first = '';
    }
    let here = null;
    const mid = railList.scrollLeft + railList.clientWidth / 2;
    for (const a of railList.querySelectorAll('a')) {
      const on = a.dataset.g === v?.g;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      // Of the three places the voyage stands, the nearest: the short way round.
      if (on && (!here || Math.abs(a.offsetLeft + a.offsetWidth / 2 - mid) < Math.abs(here.offsetLeft + here.offsetWidth / 2 - mid))) here = a;
    }
    const at_ = railed.indexOf(v);
    for (const step of railNav.querySelectorAll('[data-step]')) {
      const to = v ? railed[(at_ + Number(step.dataset.step) + railed.length) % railed.length] : null;
      step.hidden = !to;
      if (to) { step.href = `#${to.g}`; step.setAttribute('aria-label', nameOf(to)); step.dataset.tip = nameOf(to); step.dataset.tipSide = 'top'; }
    }
    if (!here) return;
    const first = 'first' in railNav.dataset;
    delete railNav.dataset.first;
    if (first) here = railList.querySelector(`a[data-copy="1"][data-g="${CSS.escape(v.g)}"]`);
    if (first || still()) { railList.scrollLeft = centre(here); return; }
    // Glide, then settle into the middle run where the reader cannot see it happen.
    gliding_ = true;
    railList.scrollTo({ left: centre(here), behavior: 'smooth' });
    let settled = false;
    const settle = () => { if (settled) return; settled = true; gliding_ = false; wrap(); };
    railList.addEventListener('scrollend', settle, { once: true });
    setTimeout(settle, 900); // when there was nowhere to glide, or no scrollend to say so
  }
  // Every voyage by place: a trip told in parts under its name (Prague: Castle, Twilight…), the rest
  // on their own, each with its vat; the one on the page marked. A column on a laptop, folded away to
  // a slim strip and back (remembered); on a phone a sheet, opened from "Voyages" and closed by
  // choosing, Esc or ×.
  const trips = data.trips || {};
  const titleOf = (top) => trips[top] || top.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  function buildMenu() {
    const groups = new Map();
    for (const v of voyages) { const top = v.g.split('/')[0]; if (!groups.has(top)) groups.set(top, []); groups.get(top).push(v); }
    const item = (v) => `<li><a href="#${v.g}" data-g="${v.g}"><i></i><span>${esc(nameOf(v))}</span></a></li>`;
    const byName = (a, b) => nameOf(a).localeCompare(nameOf(b));
    menuList.innerHTML = [...groups].map(([top, vs]) => ({ top, vs, label: vs.some((v) => v.g.includes('/')) ? titleOf(top) : nameOf(vs[0]) }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(({ top, vs, label }) => (vs.some((v) => v.g.includes('/'))
        ? `<section data-trip="${esc(label)}"><h2>${esc(label)}</h2><ol>${vs.sort(byName).map(item).join('')}</ol></section>`
        : `<section data-trip=""><ol>${item(vs[0])}</ol></section>`)).join('');
    drip(menuList.querySelectorAll('a i'), (i) => `menu/${i.parentElement.dataset.g}`, (i) => vat(voyages.find((x) => x.g === i.parentElement.dataset.g).palette, { size: 20, seed: seedOf(i.parentElement.dataset.g) }), { root: menuList, margin: '200px 0px' });
  }
  function menuTo(v) {
    let here = null;
    for (const a of menuList.querySelectorAll('a')) { if (a.dataset.g === v?.g) { a.setAttribute('aria-current', 'page'); here = a; } else a.removeAttribute('aria-current'); }
    // Keep the voyage on the page in view within the list, without moving the page itself.
    if (here && (here.offsetTop < menuList.scrollTop || here.offsetTop + here.offsetHeight > menuList.scrollTop + menuList.clientHeight)) menuList.scrollTop = here.offsetTop - menuList.clientHeight / 3;
  }
  const openMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) fold.focus({ preventScroll: true }); else if (menu.contains(document.activeElement)) menuButton.focus({ preventScroll: true });
  };
  const sheet = matchMedia('(max-width: 71.98rem)'); // below the site's rail breakpoint the list is a sheet
  const setFolded = (folded) => {
    root.classList.toggle('is-folded', folded);
    fold.setAttribute('aria-expanded', String(!folded));
    fold.setAttribute('aria-label', folded ? 'Show the voyages' : 'Hide the voyages');
    store.set('palette-voyages', folded ? 'folded' : 'open');
  };
  setFolded(store.get('palette-voyages') === 'folded');
  menuButton.addEventListener('click', () => openMenu(!menu.classList.contains('is-open')));
  fold.addEventListener('click', () => (sheet.matches ? openMenu(false) : setFolded(!root.classList.contains('is-folded'))));
  menuList.addEventListener('click', (e) => { if (e.target.closest('a')) openMenu(false); });
  menu.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { e.preventDefault(); openMenu(false); } });
  buildMenu();

  // ← → step along the rail.
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const dir = { ArrowLeft: '-1', ArrowRight: '1' }[e.key];
    const step = dir && railNav.querySelector(`[data-step="${dir}"]:not([hidden])`);
    if (step) { e.preventDefault(); location.hash = step.getAttribute('href'); }
  });

  // From one voyage to the next: the words and frames fade out, the page returns to the top unseen,
  // the new ones rise in; the light and the dye vat meanwhile take the new colours.
  const parts = () => [title, ...stage.querySelectorAll('.palette-page__order, .palette-cards, .colour-lede, .palette-index')];

  // From one voyage's palette to the next, the blocks stay and take the new dye: each colour flows
  // into the next through OKLab (so navy to rust passes a clean plum, never a grey-brown), in a wave
  // from left to right; a colour the new palette lacks narrows away, one it adds opens from nothing;
  // the hex and share of each rise in once its colour has nearly settled. About as long as the vat's
  // own crossfade, so the whole palette turns as one.
  const toHex = ([L, a, b]) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const g = (x) => Math.round(Math.min(1, Math.max(0, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)) * 255).toString(16).padStart(2, '0');
    return `#${g(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${g(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)}${g(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
  };
  const smooth = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2); // in and out: the blend is given its time
  const flow = (from, to, steps = 12) => { const A = oklab(from), B = oklab(to); return Array.from({ length: steps + 1 }, (_, k) => { const t = smooth(k / steps); return { backgroundColor: toHex(A.map((x, i) => x + (B[i] - x) * t)), offset: k / steps }; }); };
  const blocksNow = () => [...root.querySelectorAll('.palette-voyage .palette-blocks > div')].map((d) => d.querySelector('i').style.getPropertyValue('--c').trim());
  function morph(before) {
    const row = root.querySelector('.palette-voyage .palette-blocks');
    if (!row || !before.length) return;
    const now = [...row.children], wash = 1000, wave = 90, grow = 'cubic-bezier(.65,0,.35,1)';
    now.forEach((d, i) => {
      const to = d.querySelector('i').style.getPropertyValue('--c').trim(), from = before[Math.min(i, before.length - 1)], delay = i * wave;
      d.querySelector('i').animate(flow(from, to), { duration: wash, delay, easing: 'linear', fill: 'backwards' });
      if (i >= before.length) d.animate([{ flexGrow: 0 }, { flexGrow: 1 }], { duration: wash, delay, easing: grow, fill: 'backwards' });
      for (const [k, el] of [d.querySelector('i'), d.querySelector('b')].entries()) {
        // The words rise in as the dye settles: only the text, so the colour beneath keeps flowing.
        el.animate([{ color: 'transparent' }, { color: 'transparent', offset: 0.6 }, {}], { duration: wash + 120, delay: delay + k * 40, easing: 'ease-out', fill: 'backwards' });
      }
    });
    // Colours the new palette lacks: their blocks narrow away at the right, carrying their old dye.
    before.slice(now.length).forEach((hex, j) => {
      const ghost = Object.assign(document.createElement('div'), { ariaHidden: 'true' });
      ghost.innerHTML = `<i style="--c:${hex}"></i><b>&nbsp;</b>`;
      row.append(ghost);
      ghost.animate([{ flexGrow: 1, opacity: 1 }, { flexGrow: 0, opacity: 0.4 }], { duration: wash, delay: (now.length + j) * wave, easing: grow, fill: 'both' }).finished.then(() => ghost.remove(), () => ghost.remove());
    });
  }
  let shown = null, routing = 0;
  async function route() {
    const g = decodeURIComponent(location.hash.slice(1));
    const v = voyages.find((x) => x.g === g);
    const at = new URLSearchParams(location.search).get('at');
    const token = ++routing, gliding = shown !== null && shown !== (v?.g ?? '') && !still();
    railTo(v);
    menuTo(v);
    light(v);
    const before = gliding && v ? blocksNow() : [];
    if (gliding) {
      await Promise.all(parts().map((el) => el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {})));
      if (token !== routing) return;
    }
    shown = v?.g ?? '';
    if (v) voyage(v, at); else index();
    if (!v || !at) scrollTo({ top: 0, behavior: 'instant' });
    for (const el of parts()) el.getAnimations().forEach((a) => a.cancel());
    if (gliding) for (const el of parts()) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (gliding && v) morph(before);
  }
  addEventListener('hashchange', () => { if (location.search) history.replaceState(null, '', location.pathname + location.hash); route(); });
  route();
}

if (stage) { tips(); main(); }
