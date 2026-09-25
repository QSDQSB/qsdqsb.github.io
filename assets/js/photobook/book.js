/**
 * The book's controls: the film filter re-lays the frames it keeps in the same rhythm (rows.mjs),
 * and the view switch lays every frame on a light table instead. Frames are the page's own
 * figures, moved, never re-rendered; the sheet is built from the page data the first time it opens.
 */

import { bookRows } from './rows.mjs';

// Renditions are named by their long edge; a srcset states widths, so a portrait's are scaled down.
const srcset = (p) => p.sizes.filter((s) => s <= 1280).map((s) => `${p.url}/${s}.webp ${Math.round(s * Math.min(1, p.ratio || 1.5))}w`).join(', ');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function book({ frames, onOpen, onLayout }) {
  const bookEl = document.getElementById('photobook-book');
  const sheetEl = document.getElementById('photobook-sheet');
  if (!bookEl) return;
  const figures = [...bookEl.querySelectorAll('.photobook-frame')].sort((a, b) => a.dataset.i - b.dataset.i);
  let film = '', view = 'book';

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
        <figcaption class="photobook-frame__caption"><span class="photobook-sheet__frame-no">${esc(p.frame)}</span>${p.film ? `<span class="photobook-film" style="--film:${p.hue}"><i></i>${esc(p.film)}</span>` : ''}</figcaption></figure>`).join('');
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

  // A change made from deep in the book starts the reader at the top of what it now shows.
  const toTop = () => {
    const main = document.querySelector('.photobook-main');
    if (main && main.getBoundingClientRect().top < 0) main.scrollIntoView({ block: 'start' });
  };
  const films = document.querySelector('.photobook-bar__films');
  films?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    film = b.dataset.film || '';
    for (const x of b.parentElement.children) x.setAttribute('aria-pressed', String(x === b));
    b.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    layout(); toTop();
  });
  document.querySelector('.photobook-bar__views')?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.dataset.view;
    for (const x of b.parentElement.children) x.setAttribute('aria-pressed', String(x === b));
    layout(); toTop();
  });
  // Films that run past the pill fade at its edge, so the ones out of sight are known to be there.
  const edge = () => films?.classList.toggle('is-scrollable', films.scrollWidth > films.clientWidth + 1 && films.scrollLeft + films.clientWidth < films.scrollWidth - 1);
  films?.addEventListener('scroll', edge, { passive: true });
  window.addEventListener('resize', edge);

  // The bar steps below the masthead only when the expanded masthead would reach over it: across (the
  // step does not move it sideways) and down (the bar is stuck at the top, not still in the page's flow).
  const bar = document.querySelector('.photobook-bar'), mast = document.querySelector('.masthead');
  const under = () => {
    if (!bar || !mast) return;
    const out = mast.classList.contains('is-scrolled') && mast.classList.contains('is-nav-expanded') && !mast.classList.contains('is-nav-faded');
    const nav = (mast.querySelector('.greedy-nav') || mast).getBoundingClientRect(), pill = bar.querySelector('.photobook-bar__pill')?.getBoundingClientRect();
    const stuck = bar.getBoundingClientRect().top + 16 < nav.bottom + 8;
    bar.classList.toggle('is-under-masthead', !!(out && stuck && pill && pill.left < nav.right + 12));
  };
  // Past the book (the colophon and what follows) the bar has nothing to filter, so it steps away.
  // Read on every frame of scrolling: a jump (End, Home) can carry the colophon past any threshold.
  const end = document.querySelector('.photobook-colophon') || document.querySelector('.photobook-end');
  const past = () => { if (bar && end) bar.classList.toggle('is-past', end.getBoundingClientRect().top < window.innerHeight * 0.5); };
  let tick = 0;
  window.addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; under(); past(); }); }, { passive: true });
  past();
  if (mast) new MutationObserver(under).observe(mast, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', under);
  // Any frame, in the book or on the sheet, opens the lightbox over the frames currently shown.
  document.querySelector('.photobook-main')?.addEventListener('click', (e) => {
    const b = e.target.closest('.photobook-frame__print'); if (!b) return;
    const i = Number(b.closest('.photobook-frame').dataset.i);
    onOpen?.(i, keepOrder(), b.querySelector('img'));
  });

  layout(); edge();
}
