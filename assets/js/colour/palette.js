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
import { vat, seedOf, oklab, glow } from './vat.js';
import { crossfade } from '../photobook/wash.js';
import { esc, blocks, card, kindred, dripper, reverieOf } from './cards.js';

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

  // Every voyage by place, by name: a trip told in parts under its own (Prague: Castle, Twilight…),
  // the rest on their own. The list beside the page and the page of every palette keep this order.
  const trips = data.trips || {};
  const titleOf = (top) => trips[top] || top.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const byName = (a, b) => nameOf(a).localeCompare(nameOf(b));
  const tops = new Map();
  for (const v of voyages) { const top = v.g.split('/')[0]; if (!tops.has(top)) tops.set(top, []); tops.get(top).push(v); }
  const byPlace = [...tops]
    .map(([top, vs]) => { const parts = vs.some((v) => v.g.includes('/')); return { parts, vs: parts ? vs.sort(byName) : vs, label: parts ? titleOf(top) : nameOf(vs[0]) }; })
    .sort((a, b) => a.label.localeCompare(b.label));

  function index() {
    document.title = document.title.replace(/^[^·]*·/, "QSD's Palette ·");
    title.textContent = "QSD's Palette";
    backTo(back?.dataset.home, back?.dataset.homeLabel);
    kicker.textContent = 'From the voyages';
    stage.innerHTML = `<p class="colour-lede">The colours of every voyage: each one's own, pooled from its photographs, without the black and white that every journey has.</p>
      <ol class="palette-index">${byPlace.flatMap(({ vs }) => vs).map((v) => `<li><a href="#${v.g}" class="palette-index__name">${esc(nameOf(v))}</a>${strip(sig(v), { href: `#${v.g}`, label: `QSD's Palette for ${nameOf(v)}` })}</li>`).join('')}</ol>`;
  }

  function voyage(v, at) {
    const name = nameOf(v), page = pages[v.g];
    document.title = document.title.replace(/^[^·]*·/, `QSD's Palette for ${name} ·`);
    // The masthead's ‹ goes back to the voyage's book, to the frame the reader came from when there was one.
    backTo(`${page.url}${at ? `#${encodeURIComponent(at)}` : ''}`, `Back to ${name}`);
    title.textContent = `QSD's Palette for ${name}`;
    kicker.textContent = "QSD's Palette";
    const seq = order === 'colour' && v.order?.length === v.photos.length ? v.order : v.photos.map((_, i) => i);
    // A colour of the voyage's own opens its Reverie from the frame that holds the most of it.
    const frames = v.photos.map((p) => ({ ...p, g: v.g }));
    const rootOf = (h) => { const [m] = kindred(frames, h, { most: 1, near: 0.12 }); return m ? reverieOf(v.g, m.f.slug, m.hit) : null; };
    stage.innerHTML = `<section class="palette-voyage">
        <div class="palette-voyage__blocks">${blocks(sig(v), { link: rootOf })}</div>
        <div data-vat></div>
      </section>
      <div class="photobook-sheet__order palette-page__order" role="group" aria-label="Order">
        <button type="button" aria-pressed="${order === 'sequence'}" data-order="sequence">Sequence</button>
        <button type="button" aria-pressed="${order === 'colour'}" data-order="colour">Colour</button>
      </div>
      <h2 class="visually-hidden">The frames</h2>
      <div class="palette-cards">${seq.map((i) => { const p = v.photos[i]; return card(p, { href: `${page.url}#${encodeURIComponent(p.slug)}`, i, from: p.slug === at, link: (h) => reverieOf(v.g, p.slug, h) }); }).join('')}</div>`;
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
    // From a frame's bar in the book: the voyage's title and palette first, then down to that frame,
    // held in a ring for a moment (_colour.scss).
    const from = at && document.getElementById(`f-${at}`);
    if (from) {
      if (still()) requestAnimationFrame(() => from.scrollIntoView({ block: 'center', behavior: 'instant' }));
      else setTimeout(() => { if (from.isConnected) from.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 900);
    }
  }

  // Each frame's own vat, poured as its card nears the screen (./cards.js dripper), and none of the
  // frames' while a voyage is changing: the change has the frames to itself.
  const { poured, drip, holdFor } = dripper();
  let cards = null; // the cards' watcher, let go when the cards are drawn again
  // The frames rise into view as content does across the site (_scroll-animations.scss: the same
  // classes, the same 12 px and timing), unless motion is off.
  let reveal = null;
  function rise(els) {
    reveal?.disconnect();
    if (still()) return;
    document.documentElement.classList.add('scroll-reveal-ready');
    reveal = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-visible'); reveal.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px' });
    for (const el of els) { el.classList.add('reveal-on-scroll'); reveal.observe(el); }
  }
  function pour(v, slots) {
    rise(stage.querySelectorAll('.palette-card'));
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
  function light(v) {
    const g = v?.g ?? '';
    if (ambience.dataset.g === g) return;
    ambience.dataset.g = g;
    crossfade(ambience, v ? glow(v.palette, { seed: seedOf(v.g) }) : document.createElement('i'));
  }
  // A change of voyage is one gesture, one tempo: the palette's blocks take the new dye in a wave
  // from the left, and the vat beside them changes its dye whole in the same time and on the same
  // curve (the site's standard ease). The room's light turns alongside.
  // The site's own curves (_components.scss), not this page's: one vocabulary of motion.
  const css = getComputedStyle(document.documentElement);
  const EASE = css.getPropertyValue('--ease-standard').trim() || 'ease', SMOOTH = css.getPropertyValue('--ease-smooth').trim() || 'ease-out';
  const CHANGE = 1100; // the dye's own time, longer than a page's: the one signature moment
  function fillVat(v) {
    if (vatBox.dataset.g === v.g) return;
    vatBox.dataset.g = v.g;
    const label = `The colours of ${nameOf(v)}, run together as in a dye vat`;
    // One live vat for the page's life (stirred while the pointer rests on it, settled back when it
    // leaves), repainted from voyage to voyage in the same context, so a change makes no new one.
    let live = vatBox.querySelector('canvas.colour-vat:not(.is-was)');
    if (!live) { live = vat(v.palette, { size: 176, seed: seedOf(v.g), stir: 'hover', label }); vatBox.append(live); return; }
    if (still()) { live.repaint(v.palette, { seed: seedOf(v.g), label }); return; }
    // The old dye kept as a still picture, over the live vat, while the live vat takes the new.
    const was = Object.assign(document.createElement('canvas'), { width: live.width, height: live.height, className: 'colour-vat is-was' });
    was.style.cssText = live.style.cssText; was.setAttribute('aria-hidden', 'true');
    was.getContext('2d').drawImage(live, 0, 0);
    vatBox.querySelectorAll('.is-was').forEach((c) => c.remove());
    vatBox.append(was);
    live.style.opacity = '0';
    // The vessel turns a little as its dye changes, whole: the old dye fades as it turns on, the new
    // arrives turning in behind it and comes to rest (at once when its measure is remembered; a few
    // frames on, the first time).
    live.repaint(v.palette, { seed: seedOf(v.g), label }).then(() => {
      was.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'rotate(12deg)' }], { duration: CHANGE, easing: EASE, fill: 'forwards' }).finished.then(() => was.remove(), () => was.remove());
      live.style.opacity = '';
      live.animate([{ opacity: 0, transform: 'rotate(-12deg)' }, { opacity: 1, transform: 'none' }], { duration: CHANGE, easing: EASE });
    });
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
    c.style.cssText = canvas.style.cssText; c.setAttribute('aria-hidden', 'true'); c.dataset.pouring = '';
    canvas.ready.then(() => { c.getContext('2d').drawImage(canvas, 0, 0); delete c.dataset.pouring; });
    c.ready = canvas.ready.then(() => c);
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
      }, { root: railList, margin: '0px 320px', now: true });
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
  function buildMenu() {
    const item = (v) => `<li><a href="#${v.g}" data-g="${v.g}"><i></i><span>${esc(nameOf(v))}</span></a></li>`;
    menuList.innerHTML = byPlace.map(({ vs, label, parts }) => (parts
      ? `<section data-trip="${esc(label)}"><h2>${esc(label)}</h2><ol>${vs.map(item).join('')}</ol></section>`
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
  // Folding changes the layout once (the list's words fade, _colour.scss), rather than laying the page
  // out again every frame.
  const toggleFold = () => setFolded(!root.classList.contains('is-folded'));
  fold.addEventListener('click', () => (sheet.matches ? openMenu(false) : toggleFold()));
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
  // Evenly spaced through OKLab; the animation's own easing (the vat's) paces it.
  const flow = (from, to, steps = 12) => { const A = oklab(from), B = oklab(to); return Array.from({ length: steps + 1 }, (_, k) => ({ backgroundColor: toHex(A.map((x, i) => x + (B[i] - x) * (k / steps))), offset: k / steps })); };
  const blocksNow = () => [...root.querySelectorAll('.palette-voyage .palette-blocks > *')].map((d) => d.querySelector('i').style.getPropertyValue('--c').trim());
  function morph(before) {
    const row = root.querySelector('.palette-voyage .palette-blocks');
    if (!row || !before.length) return;
    // The whole wave, first block to last, inside the vat's time.
    const now = [...row.children], count = Math.max(now.length, before.length), spread = 280;
    const wave = count > 1 ? spread / (count - 1) : 0, wash = CHANGE - spread, grow = EASE;
    now.forEach((d, i) => {
      const to = d.querySelector('i').style.getPropertyValue('--c').trim(), from = before[Math.min(i, before.length - 1)], delay = i * wave;
      d.querySelector('i').animate(flow(from, to), { duration: wash, delay, easing: EASE, fill: 'backwards' });
      if (i >= before.length) d.animate([{ flexGrow: 0 }, { flexGrow: 1 }], { duration: wash, delay, easing: grow, fill: 'backwards' });
      for (const [k, el] of [d.querySelector('i'), d.querySelector('b')].entries()) {
        // The words rise in as the dye settles: only the text, so the colour beneath keeps flowing.
        el.animate([{ color: 'transparent' }, { color: 'transparent', offset: 0.6 }, {}], { duration: wash, delay: delay + k * 40, easing: EASE, fill: 'backwards' });
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
    if (gliding) holdFor(300 + CHANGE);
    railTo(v);
    menuTo(v);
    light(v);
    const before = gliding && v ? blocksNow() : [];
    if (gliding) {
      // The old voyage lifts away as a page leaves the site (0.3 s, the standard curve), not a blink.
      await Promise.all(parts().map((el) => el.animate([{ opacity: getComputedStyle(el).opacity, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 300, easing: EASE, fill: 'forwards' }).finished.catch(() => {})));
      if (token !== routing) return;
    }
    shown = v?.g ?? '';
    if (v) voyage(v, at); else index();
    scrollTo({ top: 0, behavior: 'instant' });
    for (const el of parts()) el.getAnimations().forEach((a) => a.cancel());
    // …and the new one settles in as a page arrives (0.4 s, the smooth curve).
    if (gliding) for (const el of parts()) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: SMOOTH });
    if (gliding && v) morph(before);
  }
  addEventListener('hashchange', () => { if (location.search) history.replaceState(null, '', location.pathname + location.hash); route(); });
  route();
}

if (stage) { tips(); main(); }
