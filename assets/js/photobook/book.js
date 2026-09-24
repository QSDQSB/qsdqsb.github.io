/**
 * The book's controls: the film filter re-lays the frames it keeps in the same rhythm (rows.mjs),
 * and the view switch lays every frame on a light table instead. Frames are the page's own
 * figures, moved, never re-rendered; the sheet is built from the page data the first time it opens.
 */

import { bookRows } from './rows.mjs';

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
        <button class="photobook-frame__print" type="button" aria-label="${esc(p.name)}"${p.ph ? ` style="background-image:url(${p.ph})"` : ''}><img src="${p.url}/${p.sizes[0] || 480}.webp" width="480" height="${Math.round(480 / (p.ratio || 1.5))}" alt="" loading="lazy" decoding="async"></button>
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

  document.querySelector('.photobook-bar__films')?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    film = b.dataset.film || '';
    for (const x of b.parentElement.children) x.setAttribute('aria-pressed', String(x === b));
    layout();
  });
  document.querySelector('.photobook-bar__views')?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.dataset.view;
    for (const x of b.parentElement.children) x.setAttribute('aria-pressed', String(x === b));
    layout();
  });
  // Any frame, in the book or on the sheet, opens the lightbox over the frames currently shown.
  document.querySelector('.photobook-main')?.addEventListener('click', (e) => {
    const b = e.target.closest('.photobook-frame__print'); if (!b) return;
    const i = Number(b.closest('.photobook-frame').dataset.i);
    onOpen?.(i, keepOrder(), b.querySelector('img'));
  });

  layout();
}
