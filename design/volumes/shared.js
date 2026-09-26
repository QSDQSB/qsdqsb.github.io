// Volume sketches — brainstorm only. Classic script so the pages open straight from disk.
(function () {
  const params = new URLSearchParams(location.search);
  const key = params.get('v') in window.VOLUMES ? params.get('v') : 'prague';
  const V = window.VOLUMES[key];
  const IMG = '../../images/';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const roman = (n) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][n - 1] || String(n);
  const d = (s) => new Date(`${s}T12:00:00`);
  const MONTH = { month: 'long' }, DAYM = { day: 'numeric', month: 'long' };
  function range(a, b) {
    if (!a) return '';
    const A = d(a), B = d(b || a), y = B.getFullYear();
    if (a === b || !b) return `${A.toLocaleDateString('en-GB', DAYM)} ${y}`;
    if (A.getMonth() === B.getMonth()) return `${A.getDate()} – ${B.getDate()} ${B.toLocaleDateString('en-GB', MONTH)} ${y}`;
    return `${A.toLocaleDateString('en-GB', DAYM)} – ${B.toLocaleDateString('en-GB', DAYM)} ${y}`;
  }
  const days = [...new Set(V.chapters.flatMap((c) => c.photos.map((p) => p.day)).filter(Boolean))].sort();
  const first = days[0], last = days[days.length - 1];
  // A voyage can hold more than one visit: a gap of three weeks or more between frames starts another.
  function visitsOf(list) {
    const ds = [...new Set(list.filter(Boolean))].sort(), out = [];
    for (const x of ds) {
      const v = out[out.length - 1];
      if (v && (d(x) - d(v[v.length - 1])) / 864e5 < 21) v.push(x); else out.push([x]);
    }
    return out;
  }
  const visits = visitsOf(days);
  const monthOf = (v) => {
    const A = d(v[0]), B = d(v[v.length - 1]), y = B.getFullYear();
    return A.getMonth() === B.getMonth() ? `${B.toLocaleDateString('en-GB', MONTH)} ${y}` : `${A.toLocaleDateString('en-GB', MONTH)} – ${B.toLocaleDateString('en-GB', MONTH)} ${y}`;
  };
  // "14 – 19 June 2023" for one visit; "June 2023 · January 2024 · July 2024" for several.
  function when(list) {
    const vs = visitsOf(list);
    if (!vs.length) return '';
    return vs.length === 1 ? range(vs[0][0], vs[0][vs[0].length - 1]) : vs.map(monthOf).join(' · ');
  }
  const chapterWhen = (c, short) => { const w = when(c.photos.map((p) => p.day)); return short && visitsOf(c.photos.map((p) => p.day)).length === 1 ? w.replace(/ \d{4}$/, '') : w; };
  // A day heading: its visit's own count ("Day 2"), and the year only when the volume spans several.
  function dayLabel(s) {
    const label = d(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', ...(visits.length > 1 ? { year: 'numeric' } : {}) });
    const v = visits.find((v) => v.includes(s));
    return { label, n: v ? v.indexOf(s) + 1 : 1, visit: visits.indexOf(v) + 1 };
  }

  // srcset over the WebP tiers; renditions are named by their long edge.
  function srcset(p) {
    return p.webp.map((w) => `${p.url}/${w}.webp ${p.ratio < 1 ? Math.round(w * p.ratio) : w}w`).join(', ');
  }
  function print(p, { sizes = '50vw', cls = '', eager = false, style = '' } = {}) {
    const fallback = p.webp[1] || p.webp[0];
    return `<div class="print ${cls}" style="${p.ph ? `background-image:url(${p.ph});` : ''}${style}"><img src="${p.url}/${fallback}.webp" srcset="${srcset(p)}" sizes="${sizes}" alt="${esc(p.alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-in')"></div>`;
  }
  const ticks = (films) => `<span class="ticks">${films.map((f) => `<i style="--film:${f.hue}" title="${esc(f.name)}"></i>`).join('')}</span>`;
  const bar = (films) => `<span class="ticks--bar">${films.map((f) => `<i style="--film:${f.hue};flex:${f.n}"></i>`).join('')}</span>`;
  const coverOf = (c) => c.photos[c.coverIndex] || c.photos[0];

  function cover() {
    const films = V.films.length;
    return `<header class="vcover"><img src="${IMG}${V.hero}" alt="" fetchpriority="high">
      <div class="vcover__title"><div><h1>${esc(V.title)}</h1><p class="vcover__lede">${esc(V.excerpt)}</p></div>
      <dl class="facts"><div><dt>Chapters</dt><dd>${V.chapters.length}</dd></div><div><dt>Frames</dt><dd>${V.frames}</dd></div><div><dt>Films</dt><dd>${films}</dd></div>${visits.length > 1 ? `<div><dt>Visits</dt><dd>${visits.length}</dd></div>` : `<div><dt>Days</dt><dd>${days.length}</dd></div>`}</dl></div></header>`;
  }

  function colophon() {
    const rows = V.chapters.filter((c) => c.photos.length).map((c) => `<div class="vcolophon__row"><span>${esc(c.title)}</span>${bar(c.films)}<b>${c.photos.length}</b></div>`).join('');
    return `<section class="vcolophon"><h2 class="kicker">Colophon · ${when(days)}</h2>
      <div class="vcolophon__bar">${V.films.map((f) => `<i style="--film:${f.hue};flex:${f.n}"></i>`).join('')}</div>
      <div class="legend">${V.films.map((f) => `<span><i style="--film:${f.hue}"></i>${esc(f.name)} <b>${f.n}</b></span>`).join('')}</div>
      <div class="vcolophon__chapters">${rows}</div></section>`;
  }

  // The page's light, taken from a frame's own colours (two crossfading layers).
  const glowEl = document.createElement('div');
  glowEl.className = 'glow';
  glowEl.innerHTML = '<i></i><i></i>';
  document.body.prepend(glowEl);
  let layer = 0, lastGlow = '';
  function glow(p) {
    if (!p || !p.glow) return;
    const g = p.glow, sig = g.join();
    if (sig === lastGlow) return;
    lastGlow = sig;
    const [a, b] = glowEl.children;
    const next = layer ? a : b, prev = layer ? b : a;
    next.style.background = `radial-gradient(60% 50% at 18% 12%, ${g[0]}, transparent 70%), radial-gradient(55% 45% at 85% 70%, ${g[1]}, transparent 70%), radial-gradient(40% 40% at 50% 100%, ${g[2]}, transparent 70%)`;
    next.classList.add('is-on'); prev.classList.remove('is-on');
    layer = 1 - layer;
  }

  function chrome(current) {
    const nav = document.createElement('nav');
    nav.className = 'proto';
    const q = `?v=${key}`;
    const sketches = [['a-contents.html', 'A · Contents'], ['b-covers.html', 'B · Covers'], ['c-book.html', 'C · One book']];
    nav.innerHTML = sketches.map(([h, t]) => `<a href="${h}${q}"${h === current ? ' aria-current="page"' : ''}>${t}</a>`).join('') + '<span></span>' +
      Object.keys(window.VOLUMES).map((k) => `<a href="${current}?v=${k}"${k === key ? ' aria-current="page"' : ''}>${esc(window.VOLUMES[k].title)}</a>`).join('');
    document.body.append(nav);
  }

  // A spread, a pair, a three, again (assets/js/photobook/rows.mjs).
  function bookRows(photos) {
    const rows = []; let k = 0, beat = 0; const kinds = ['spread', 'pair', 'triple'];
    while (k < photos.length) {
      const left = photos.length - k; let want = [1, 2, 3][beat++ % 3];
      if (want === 1 && (photos[k].ratio || 1.5) < 1.2) want = 2;
      const take = k > 0 && left <= 3 && left !== want ? left : Math.min(want, left);
      rows.push({ kind: kinds[take - 1], items: Array.from({ length: take }, (_, j) => k + j) });
      k += take;
    }
    return rows;
  }

  document.title = `${V.title} — volume sketch`;
  window.Vol = { V, key, esc, roman, range, dayLabel, days, first, last, visits, visitsOf, when, chapterWhen, print, ticks, bar, coverOf, cover, colophon, glow, chrome, bookRows, IMG };
})();
