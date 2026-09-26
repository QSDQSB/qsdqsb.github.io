/**
 * The book's controls: the film filter re-lays the frames it keeps in the same rhythm (rows.mjs),
 * and the view switch lays every frame on a light table instead. Frames are the page's own
 * figures, moved, never re-rendered; the sheet is built from the page data the first time it opens.
 */

import { bookRows } from './rows.mjs';
import { filmDial } from './dial.js';

// Renditions are named by their long edge; a srcset states widths, so a portrait's are scaled down.
const srcset = (p) => p.sizes.filter((s) => s <= 1280).map((s) => `${p.url}/${s}.webp ${Math.round(s * Math.min(1, p.ratio || 1.5))}w`).join(', ');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function book({ frames, onOpen, onLayout, onScreen, onPrefetch }) {
  const bookEl = document.getElementById('photobook-book');
  const sheetEl = document.getElementById('photobook-sheet');
  if (!bookEl) return;
  const figures = [...bookEl.querySelectorAll('.photobook-frame')].sort((a, b) => a.dataset.i - b.dataset.i);
  // The view the reader last chose, on any voyage, is where the next one opens.
  const saved = (() => { try { return localStorage.getItem('photobook-view'); } catch { return null; } })();
  let film = '', view = saved === 'sheet' ? 'sheet' : 'book';

  const shown = () => figures.filter((f) => !film || f.dataset.film === film);

  function relayBook() {
    const keep = shown();
    const rows = bookRows(keep.map((f) => ({ ratio: Number(f.style.getPropertyValue('--ratio')) || 1.5 })));
    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = `photobook-row photobook-row--${r.kind}`;
      for (const k of r.items) row.appendChild(keep[k]);
      frag.appendChild(row);
    }
    bookEl.replaceChildren(frag);
  }

  function relaySheet() {
    const keep = new Set(shown().map((f) => Number(f.dataset.i)));
    if (!sheetEl.childElementCount) {
      sheetEl.innerHTML = frames.map((p, i) => `<figure class="photobook-frame" data-i="${i}"${p.film ? ` data-film="${esc(p.film)}"` : ''} style="--ratio:${p.ratio}">
        <button class="photobook-frame__print" type="button" aria-label="${esc(p.name)}"><img src="${p.url}/${p.sizes[0] || 480}.webp" srcset="${srcset(p)}" sizes="(min-width: 768px) 18rem, 45vw" width="480" height="${Math.round(480 / (p.ratio || 1.5))}" alt="" loading="lazy" decoding="async"></button>
        <figcaption class="photobook-frame__caption"><span class="photobook-sheet__frame-no">${esc(p.frame)}</span>${p.film ? `<span class="photobook-film" style="--film:${p.hue}" title="${esc(p.film)}"><i></i><span>${esc(p.film)}</span></span>` : ''}</figcaption></figure>`).join('');
    }
    for (const f of sheetEl.children) f.hidden = !keep.has(Number(f.dataset.i));
  }

  function layout() {
    bookEl.hidden = view !== 'book';
    sheetEl.hidden = view !== 'sheet';
    if (view === 'book') relayBook(); else relaySheet();
    const cover = document.getElementById('photobook-cover');
    const targets = view === 'book' ? [...bookEl.children] : [...sheetEl.children].filter((f) => !f.hidden);
    onLayout?.([cover, ...targets].filter(Boolean));
  }
  const keepOrder = () => shown().map((f) => Number(f.dataset.i));

  const main = document.querySelector('.photobook-main');
  const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A new view starts the reader at its top, at once.
  const toTop = () => { if (main && main.getBoundingClientRect().top < 0) main.scrollIntoView({ block: 'start', behavior: 'instant' }); };

  // A new film re-lays the book where the reader is: the frame they were at keeps its place on the
  // screen, or, if the film leaves it out, the nearest kept frame after it (before it, at the end)
  // takes that place. The frames that stay move into their new rows, the others dissolve (a view
  // transition; a crossfade where there is none; nothing moves when motion is off).
  const filmHead = document.querySelector('.photobook-book__film');
  const inView = (f) => { const r = f.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  function placeOf(all, box) {
    if (main.getBoundingClientRect().top > 0) return null;     // the cover is still in view: nothing to hold
    const at = all.find((x) => !x.hidden && box.contains(x) && x.getBoundingClientRect().top + x.offsetHeight / 2 > 0);
    return at ? { el: at, top: at.getBoundingClientRect().top } : null;
  }
  function holdPlace(place, all, f) {
    if (!place) return;
    const kept = (x) => !f || x.dataset.film === f, k = all.indexOf(place.el);
    const to = kept(place.el) ? place.el : all.slice(k + 1).find(kept) || all.slice(0, k).reverse().find(kept);
    if (to) window.scrollBy({ top: to.getBoundingClientRect().top - place.top, behavior: 'instant' });
  }
  function refilter(f, hue) {
    if (!main) { film = f; layout(); return; }
    const box = view === 'book' ? bookEl : sheetEl;
    const all = view === 'book' ? figures : [...sheetEl.children];
    const place = placeOf(all, box);
    const apply = () => {
      film = f;
      if (filmHead) { filmHead.hidden = !f; filmHead.textContent = f; filmHead.style.setProperty('--film', hue); }
      layout();
      holdPlace(place, all, f);
    };
    if (still()) return apply();
    if (document.startViewTransition) {
      // Named: what is on screen now, and the kept frames around the reader's place, which will be;
      // each frame is one element across the change.
      const k = place ? all.indexOf(place.el) : 0;
      const soon = new Set([...all.slice(k), ...all.slice(0, k).reverse()].filter((x) => !f || x.dataset.film === f).slice(0, 9));
      const named = all.filter((x) => soon.has(x) || (!x.hidden && box.contains(x) && inView(x)));
      named.forEach((x) => { x.style.viewTransitionName = `photobook-f${x.dataset.i}`; });
      document.documentElement.classList.add('is-refiltering');
      const t = document.startViewTransition(apply);
      t.finished.finally(() => {
        named.forEach((x) => { x.style.viewTransitionName = ''; });
        document.documentElement.classList.remove('is-refiltering');
      });
      return;
    }
    main.classList.add('is-fading');
    setTimeout(() => { apply(); main.classList.remove('is-fading'); }, 180);
  }
  const dial = document.querySelector('.photobook-dial');
  const mark = document.querySelector('.photobook-bar__mark');
  const turn = dial && filmDial(dial, (f) => {
    mark?.style.setProperty('--film', turn.hue());
    document.querySelector('.photobook-bar')?.classList.toggle('has-filter', !!f);
    refilter(f, turn.hue());
  });
  // Once per reader and voyage: when the dial first comes fully into view, it turns a little and back.
  if (turn && 'IntersectionObserver' in window) {
    const key = `qsd.dial.hinted:${location.pathname}`;
    let seen = true;
    try { seen = localStorage.getItem(key) === '1'; } catch { /* no storage: no hint */ }
    if (!seen) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTimeout(() => turn.hint(), 900);
        try { localStorage.setItem(key, '1'); } catch { /* the hint may come again */ }
      }, { threshold: 1 });
      io.observe(dial);
    }
  }
  // The view switch has two positions, each a button that sets its own view.
  const views = document.querySelector('.photobook-switch');
  views?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.act === 'screen') { onScreen?.(keepOrder()); return; }
    if (!b || b.dataset.view === view) return;
    view = b.dataset.view;
    try { localStorage.setItem('photobook-view', view); } catch { /* the choice lasts this page only */ }
    for (const x of views.querySelectorAll('button[data-view]')) x.setAttribute('aria-pressed', String(x.dataset.view === view));
    layout(); toTop();
  });
  // The bar steps below the masthead only when the expanded masthead would reach over it: across (the
  // step does not move it sideways) and down (the bar is stuck at the top, not still in the page's flow).
  const bar = document.querySelector('.photobook-bar'), mast = document.querySelector('.masthead');
  const under = () => {
    if (!bar || !mast) return;
    const out = mast.classList.contains('is-scrolled') && mast.classList.contains('is-nav-expanded') && !mast.classList.contains('is-nav-faded');
    const nav = (mast.querySelector('.greedy-nav') || mast).getBoundingClientRect(), pill = bar.querySelector('.photobook-bar__dock')?.getBoundingClientRect();
    // Where the dials' tops sit before any step: the bar is their centre line, half a dial below.
    const top = bar.getBoundingClientRect().top - 43;
    bar.classList.toggle('is-under-masthead', !!(out && top < nav.bottom + 8 && pill && pill.left < nav.right + 12));
  };
  // Past the book (the colophon and what follows) the bar has nothing to filter, so it steps away.
  // Read on every frame of scrolling: a jump (End, Home) can carry the colophon past any threshold.
  const end = document.querySelector('.photobook-colophon') || document.querySelector('.photobook-end');
  const past = () => { if (bar && end) bar.classList.toggle('is-past', end.getBoundingClientRect().top < window.innerHeight * 0.5); };
  // Held at the top of the window over the book, the controls draw in (and back to full size under
  // the pointer or the keyboard); at rest on the cover's edge they are full size.
  const stuck = () => { if (bar) bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 0.5); };
  // Over the book the controls step away, so nothing sits on the photographs. Scrolling back up (the
  // gesture that also brings the masthead) calls them in; scrolling on down sends them away. No timers.
  const dock = bar?.querySelector('.photobook-bar__dock');
  let lastY = window.scrollY, run = 0;
  const summon = (on) => bar?.classList.toggle('is-summoned', on);
  const intent = () => {
    const y = window.scrollY, d = y - lastY; lastY = y;
    if (!bar?.classList.contains('is-stuck')) { run = 0; summon(false); return; }
    run = Math.sign(d) === Math.sign(run) ? run + d : d;
    if (run < -24) summon(true);
    else if (run > 24 && !dock?.matches(':hover, :has(:focus-visible)')) summon(false);
    // Away, the controls keep no focus a key could act on unseen: a keyboard reader's brings them
    // back; a tap's is let go.
    const f = document.activeElement;
    if (!bar.classList.contains('is-summoned') && dock?.contains(f)) { if (f.matches(':focus-visible')) summon(true); else f.blur(); }
  };
  mark?.addEventListener('click', () => summon(true));
  dock?.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) summon(true); });
  dock?.addEventListener('keydown', () => summon(true));
  let tick = 0;
  window.addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; stuck(); intent(); under(); past(); }); }, { passive: true });
  stuck(); past();
  if (mast) new MutationObserver(under).observe(mast, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', () => { stuck(); under(); });
  // Any frame, in the book or on the sheet, opens the lightbox over the frames currently shown.
  // A print the pointer rests on (or a finger touches) starts fetching its full size for the lightbox.
  let restT = 0;
  const main_ = document.querySelector('.photobook-main');
  main_?.addEventListener('pointerover', (e) => {
    const b = e.target.closest?.('.photobook-frame__print'); clearTimeout(restT); if (!b) return;
    const i = Number(b.closest('.photobook-frame').dataset.i);
    if (e.pointerType === 'mouse') restT = setTimeout(() => onPrefetch?.(i), 120); else onPrefetch?.(i);
  });
  document.querySelector('.photobook-main')?.addEventListener('click', (e) => {
    const b = e.target.closest('.photobook-frame__print'); if (!b) return;
    const i = Number(b.closest('.photobook-frame').dataset.i);
    onOpen?.(i, keepOrder(), b.querySelector('img'));
  });

  if (views) for (const x of views.querySelectorAll('button[data-view]')) x.setAttribute('aria-pressed', String(x.dataset.view === view));
  layout();
}
