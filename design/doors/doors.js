// Door sketches — brainstorm only. Classic script; data.js must load first.
(function () {
  const D = window.DOORS;
  const params = new URLSearchParams(location.search);
  const at = params.get('at') || 'index';
  const voyage = D.find((v) => v.slug === at && v.parts) || null;
  const IMG = '../../images/';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bySlug = new Map();
  for (const v of D) { bySlug.set(v.slug, { ...v, parent: null }); for (const p of v.parts || []) bySlug.set(p.slug, { ...p, parent: v }); }

  // The atmosphere, in one line: the light, the air, the months. Nothing counted.
  const air = (d) => d.atmos ? [d.atmos.light, d.atmos.air, d.atmos.when].filter(Boolean).join(' · ') : '';
  const pic = (d, { cls = '', eager = false, pos = '' } = {}) =>
    `<div class="pic ${cls}"><img src="${IMG}${d.cover}" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-in')"${pos ? ` style="object-position:${pos}"` : ''}></div>`;
  // Where a door leads: a voyage with parts opens its own wing in the same sketch; anything else, its book.
  const href = (d, sketch) => (d.parts ? `${sketch}?at=${d.slug}` : `room.html?d=${encodeURIComponent(d.slug)}&from=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`);

  function chrome(sketch) {
    const nav = document.createElement('nav');
    nav.className = 'proto';
    const sketches = [['cards.html', 'Cards + the door'], ['p1-hang.html', 'P1 · Hang'], ['p2-cinema.html', 'P2 · Cinema'], ['walk.html', 'Walk']];
    const pages = [['index', 'All voyages'], ...D.filter((v) => v.parts).map((v) => [v.slug, v.title])];
    nav.innerHTML = sketches.map(([h, t]) => `<a href="${h}?at=${at}"${h === sketch ? ' aria-current="page"' : ''}>${t}</a>`).join('') + '<span></span>' +
      pages.map(([k, t]) => `<a href="${sketch}?at=${k}"${k === at ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('');
    document.body.append(nav);
  }
  function mast() {
    const back = voyage ? `<a class="mast__back" href="?at=index">‹ All voyages</a>` : '';
    return `<header class="mast"><span class="mast__logo">Q</span>${back}</header>`;
  }

  // Stepping through a door: its picture carries over into the book's cover (cross-document view
  // transition, Chrome and Safari; elsewhere a plain navigation). Only the chosen door is named.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-door]');
    if (!a) return;
    const img = a.querySelector('.pic > img');
    if (img) img.style.viewTransitionName = 'cover';
    try { sessionStorage.setItem('door', a.dataset.door); } catch (_) {}
  });
  addEventListener('pagereveal', (e) => {
    let slug = null;
    try { slug = sessionStorage.getItem('door'); } catch (_) {}
    if (!e.viewTransition || !slug) return;
    const img = document.querySelector(`a[data-door="${CSS.escape(slug)}"] .pic > img`);
    if (img) { img.style.viewTransitionName = 'cover'; e.viewTransition.finished.finally(() => { img.style.viewTransitionName = ''; }); }
  });
  addEventListener('pageshow', () => document.querySelectorAll('.pic > img').forEach((i) => { i.style.viewTransitionName = ''; }));

  // Depth: at most one door alive at a time (the site's Lontananza module, local copy).
  let alive = null;
  function wake(door) {
    if (!window.DoorDepth || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const d = bySlug.get(door?.dataset.door);
    if (!d || !d.depth) { sleep(); return; }
    if (alive && alive.el === door) return;
    sleep();
    const media = door.querySelector('.pic');
    media.setAttribute('data-depth-map', IMG.replace('images/', '') + d.depth);
    media.setAttribute('data-depth-photo', IMG + d.cover);
    media.setAttribute('data-depth-amp', '55');
    const h = window.DoorDepth.setup(media);
    alive = h ? { el: door, h } : null;
  }
  function sleep() { if (alive) { alive.h.destroy(); alive = null; } }

  window.Doors = { D, at, voyage, bySlug, esc, air, pic, href, chrome, mast, wake, sleep, IMG };
})();
