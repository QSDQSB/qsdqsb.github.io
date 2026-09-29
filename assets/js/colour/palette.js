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
import { esc, blocks, bar, card, kindred, dripper, reverieOf, place, cameFrom, backLabel, measureCards } from './cards.js';

const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } } };

const root = document.getElementById('palette-page');
const stage = root?.querySelector('.palette-page__stage');
const title = root?.querySelector('h1'), status = document.getElementById('palette-status');
const kicker = root?.querySelector('.palette-page__home');
const railNav = root?.querySelector('.palette-rail');
const back = document.querySelector('.masthead__back');
const menu = root?.querySelector('.palette-voyages'), menuList = menu?.querySelector('.palette-voyages__list');
const fold = menu?.querySelector('.palette-voyages__fold'), menuButton = root?.querySelector('.palette-page__menu');

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
  const backTo = (href, label) => { if (!back || !href) return; back.href = href; back.setAttribute('aria-label', label); back.dataset.tip = label; delete back.dataset.along; };
  // Back the way the reader came, when that is where ‹ leads (the voyage's own book, or the page they
  // came in from): through the history, so the page is found as they left it, over the voyages taken
  // here since (each a step in the history, counted in its state).
  const came = cameFrom();
  // `steps`: back that many steps in this page's own history (the overview, from the voyage opened
  // from it); else back over every voyage taken here, to the page the reader came from.
  const along = (label, href = came.href, steps = 0) => { backTo(href, label); back.dataset.along = String(steps); };
  back?.addEventListener('click', (e) => { if ('along' in back.dataset && history.length > 1) { e.preventDefault(); history.go(-(Number(back.dataset.along) || (history.state?.hops ?? 0) + 1)); } });
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
    if (came) along(backLabel(came)); else backTo(back?.dataset.home, back?.dataset.homeLabel);
    kicker.textContent = 'From the voyages';
    // By place, as the list beside it: a trip's parts under its name, the voyages between trips
    // together. Each a way to its palette: its vat (poured as it nears the screen), name and bar.
    const runs = [];
    for (const t of byPlace) { if (!t.parts && runs.at(-1)?.label === '') runs.at(-1).vs.push(...t.vs); else runs.push({ label: t.parts ? t.label : '', vs: [...t.vs] }); }
    const entry = (v) => `<li><a href="#${v.g}" data-g="${v.g}"><i class="palette-index__vat"></i><span><span class="palette-index__name">${esc(nameOf(v))}</span>${bar(sig(v))}</span></a></li>`;
    stage.innerHTML = `<p class="colour-lede">The paint behind the pictures.</p>
      <div class="palette-index">${runs.map(({ label, vs }) => `<section>${label ? `<h2>${esc(label)}</h2>` : ''}<ol>${vs.map(entry).join('')}</ol></section>`).join('')}</div>`;
    const gOf = (i) => i.parentElement.dataset.g;
    drip(stage.querySelectorAll('.palette-index__vat'), (i) => `index/${gOf(i)}`, (i) => vat(voyages.find((x) => x.g === gOf(i)).palette, { size: 52, seed: seedOf(gOf(i)) }));
  }

  function voyage(v, at, { glide = true } = {}) {
    const name = nameOf(v), page = pages[v.g];
    document.title = document.title.replace(/^[^·]*·/, `QSD's Palette for ${name} ·`);
    // The masthead's ‹ goes back to the voyage's book, to the frame the reader came from when there was one.
    backTo(`${page.url}${at ? `#${encodeURIComponent(at)}` : ''}`, `Back to ${name}`);
    if (came?.pathname === new URL(page.url, location.href).pathname) along(`Back to ${name}`);
    else if (prevShown === '') along("Back to QSD's Palette", location.pathname, 1); // opened from the overview
    title.textContent = `QSD's Palette for ${name}`;
    kicker.textContent = "QSD's Palette";
    const seq = order === 'colour' && v.order?.length === v.photos.length ? v.order : v.photos.map((_, i) => i);
    // A colour of the voyage's own opens its Reverie, that colour and no other, from the frame that
    // holds the most of it (only where the reader sets out: the colour is the one they chose).
    const frames = v.photos.map((p) => ({ ...p, g: v.g }));
    const rootOf = (h) => { const [m] = kindred(frames, h, { most: 1, near: 0.12 }); return reverieOf(m ? v.g : null, m?.f.slug, h); };
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
      // The buttons are drawn again with the frames: the one pressed keeps the focus.
      const redraw = () => { voyage(v, null); stage.querySelector(`[data-order="${order}"]`)?.focus({ preventScroll: true }); };
      if (still() || !document.startViewTransition) { redraw(); return; }
      // Only the frames on or near the screen are named for the move (as the book's sheet does), and
      // only for as long as it lasts.
      const named = (on) => { for (const c of stage.querySelectorAll('.palette-card')) { const r = c.getBoundingClientRect(); c.style.viewTransitionName = on && r.bottom > -200 && r.top < innerHeight + 200 ? `palette-f${c.dataset.n}` : ''; } };
      named(true);
      document.startViewTransition(() => { redraw(); named(true); }).finished.finally(() => named(false));
    };
    // From a frame's bar in the book: the voyage's title and palette first, then down to that frame,
    // held in a ring for a moment (_colour.scss).
    const from = at && glide && document.getElementById(`f-${at}`);
    // Arrived: the address no longer asks for the glide (Back to it finds the page where it was left).
    if (at) history.replaceState(history.state, '', location.pathname + location.hash);
    if (from) {
      // Focus goes with the reader to the frame they came from (the ring is its mark: no outline).
      const land = () => { from.classList.add('is-arrived'); from.tabIndex = -1; from.focus({ preventScroll: true }); };
      if (still()) requestAnimationFrame(() => { from.scrollIntoView({ block: 'center', behavior: 'instant' }); land(); });
      else setTimeout(() => {
        if (!from.isConnected) return;
        // The cards above it are only estimated until drawn, so the page moves under a long glide:
        // aimed again when it lands, until the frame is in the middle (a few times at most), then ringed.
        let tries = 0;
        const aim = () => {
          const r = from.getBoundingClientRect(), off = r.top + r.height / 2 - innerHeight / 2;
          if (Math.abs(off) > innerHeight * 0.2 && tries++ < 3) { from.scrollIntoView({ block: 'center', behavior: 'smooth' }); settle(); return; }
          if (!from.classList.contains('is-arrived')) land();
        };
        const settle = () => { let done = false; const go = () => { if (!done) { done = true; aim(); } }; addEventListener('scrollend', go, { once: true }); setTimeout(go, 1400); };
        from.scrollIntoView({ block: 'center', behavior: 'smooth' });
        settle();
      }, 900);
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
    // Not while the keyboard is on the rail: the jump would leave the focused vat off screen.
    if (gliding_ || railList.contains(document.activeElement)) return;
    const run = runWidth(), x = railList.scrollLeft;
    if (x < run * 0.5) railList.scrollLeft = x + run;
    else if (x > run * 1.5) railList.scrollLeft = x - run;
  };
  function copyOf(canvas) {
    const c = Object.assign(document.createElement('canvas'), { width: canvas.width, height: canvas.height, className: canvas.className });
    c.style.cssText = canvas.style.cssText; c.setAttribute('aria-hidden', 'true');
    canvas.ready.then(() => c.getContext('2d').drawImage(canvas, 0, 0));
    c.ready = canvas.ready.then(() => c);
    return c;
  }
  function railTo(v) {
    if (!railNav.firstChild) {
      const run = (copy) => railed.map((x) => `<li${copy === 1 ? '' : ' aria-hidden="true"'}><a href="#${x.g}" data-g="${x.g}" data-copy="${copy}" data-tip="${esc(nameOf(x))}" data-tip-side="top"${copy === 1 ? ` aria-label="${esc(nameOf(x))}"` : ' tabindex="-1"'}></a></li>`).join('');
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
    if (!here) {
      // The overview, on arrival: the rail from the middle of its middle run, so it runs on both ways.
      if ('first' in railNav.dataset) { delete railNav.dataset.first; const mid = railList.children[railed.length + (railed.length >> 1)]; if (mid) railList.scrollLeft = centre(mid); }
      return;
    }
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
    // As a sheet over the page, the page behind it is out of reach until it closes.
    for (const el of [root.querySelector('.palette-page__body'), root.querySelector('.colour-end'), document.querySelector('.masthead')]) if (el) el.inert = open && sheet.matches;
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
  let shown = null, routing = 0, hops = 0, prevShown = null, shownHash = location.hash;
  const kept = () => place(`palette-at:${location.hash}`);
  const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  addEventListener('pagehide', () => kept().save());
  async function route() {
    const g = decodeURIComponent(location.hash.slice(1));
    const v = voyages.find((x) => x.g === g);
    const at = new URLSearchParams(location.search).get('at');
    const token = ++routing, gliding = shown !== null && shown !== (v?.g ?? '') && !still();
    // Each voyage taken here is a step in the history: its state counts them, for ‹ (above).
    const stamped = history.state?.hops != null;
    if (!stamped) history.replaceState({ ...history.state, hops: shown === null ? 0 : hops + 1 }, '');
    hops = history.state.hops;
    const back_ = shown === null && returning; // come back to (Back): as it was left, no glide
    // A voyage left for another in the page keeps its place, found again on Back (the entry has its
    // count already: it was stamped when first shown).
    const revisit = shown !== null && stamped;
    if (shown !== null) place(`palette-at:${shownHash}`).save();
    prevShown = shown; shownHash = location.hash;
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
    const changed = shown !== null, hadFocus = stage.contains(document.activeElement);
    shown = v?.g ?? '';
    if (v) voyage(v, at, { glide: !back_ }); else index();
    // Said once, not the whole stage read out; and focus, if the reader was in what was replaced, to the title.
    if (changed) status.textContent = title.textContent;
    if (hadFocus && !(v && at)) title.focus({ preventScroll: true });
    measureCards(stage);
    if (!(revisit && kept().restore())) scrollTo({ top: 0, behavior: 'instant' });
    if (back_) requestAnimationFrame(() => kept().restore());
    for (const el of parts()) el.getAnimations().forEach((a) => a.cancel());
    // …and the new one settles in as a page arrives (0.4 s, the smooth curve).
    if (gliding) for (const el of parts()) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: SMOOTH });
    if (gliding && v) morph(before);
  }
  addEventListener('hashchange', () => { if (location.search) history.replaceState(history.state, '', location.pathname + location.hash); route(); });
  route();
}

if (stage) { tips(); main(); }
