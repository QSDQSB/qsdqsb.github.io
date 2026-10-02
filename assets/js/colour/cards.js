/**
 * The frames as cards, shared by QSD's Palette (./palette.js) and Reverie (./reverie.js): a palette as
 * blocks and as the specs panel's thin bar, a frame as a card, one colour matched across every
 * frame, and the queue that pours each card's dye vat as it nears the screen.
 */

import { oklab, lin } from './vat.js';
import { placeholder } from './thumbhash.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Black or white for the hex on a block, whichever reads better against it (WCAG contrast). */
const ink = (h) => {
  const n = parseInt(h.slice(1), 16), L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#000' : '#fff'; // pure, so even a middling colour reads at 4.5:1 or better
};

/** How much a colour field's foot must darken for ivory words to read on it (about 4:1, for the small
 *  labels above the hex as well as the hex): none on a mid or dark colour; on a light one, as the
 *  book's cover shades beneath its title. */
export const shadeFor = (h) => {
  const n = parseInt(h.slice(1), 16), L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return Math.min(0.7, Math.max(0, 1 - 0.2 / L)).toFixed(2);
};

/** A colour's Reverie: /reverie/?c=<hex>, and &from=<gallery>/<slug>, the frame it was found in (its
 *  first photograph, and the way back), when there is one. Without a colour, the frame's leading one. */
export const REVERIE = new URL('../../../reverie/', import.meta.url).pathname;
export const reverieOf = (g, slug, hex = null) => `${REVERIE}?${[hex ? `c=${hex.slice(1).toLowerCase()}` : '', g ? `from=${encodeURIComponent(`${g}/${slug}`)}` : ''].filter(Boolean).join('&')}`;

/** The essay on how the colours came by their names (_posts/2026-09-30-In-the-Naming-of-Light.md),
 *  among a colour page's ways on (QSD's Palette, Reverie). */
export const ESSAY = `<a href="${new URL('../../../posts/in-the-naming-of-light/', import.meta.url).pathname}">In the Naming of Light <span aria-hidden="true">→</span></a>`;

/** A palette as blocks: equal widths, the hex inside (text to select), the share beneath. `pick`: the
 *  colour chosen, marked by a white line inside its block. `link(hex)`: where a block leads, if anywhere. */
export const blocks = (cs, { pick = null, link = null } = {}) => `<div class="palette-blocks">${cs.map(([h, pc, accent]) => {
  const to = link?.(h), tag = to ? 'a' : 'div';
  const cls = [accent ? 'is-accent' : '', h === pick ? 'is-picked' : ''].filter(Boolean).join(' ');
  return `<${tag}${cls ? ` class="${cls}"` : ''}${to ? ` href="${to}" draggable="false" data-tip="Reverie in ${h.toUpperCase()}" data-tip-side="top"` : ''}>${to ? '<span class="visually-hidden">Reverie in </span>' : ''}<i style="--c:${h};--on:${ink(h)}">${h.slice(1).toUpperCase()}</i><b>${Math.round(pc * 10) / 10}%</b></${tag}>`;
}).join('')}</div>`;

/** A palette as the specs panel draws it: a thin bar, widths tempered. */
export const bar = (cs) => `<div class="palette-card__bar" aria-hidden="true">${cs.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('')}</div>`;

/** A frame as a card: the print (to `href`, its place in the book), its colours as blocks, its place
 *  (`place`, when the cards come from many voyages), name and light, its bar, and a slot for its vat
 *  (`data-i`, `i`). `from`: the frame the reader came from. `plain`: the print and its words alone.
 *  `label`: where the print leads, for a screen reader; `placeHref`: where the place's name leads. */
export function card(p, { href, i, n = i, from = false, pick = null, place = '', placeHref = null, label = 'in its book', link = null, plain = false }) {
  const size = p.sizes.find((s) => s >= 960) || p.sizes[p.sizes.length - 1] || 480, colours = !plain && p.sig?.length;
  // The print develops over its blurred placeholder (./thumbhash.js), as in the book (../photobook/develop.js).
  const ph = placeholder(p.th);
  return `<article class="palette-card${from ? ' is-from' : ''}${plain ? ' is-plain' : ''}" id="f-${esc(p.slug)}" data-n="${n}">
    <a class="palette-card__print" href="${href}" aria-label="${esc(p.name || p.slug)}, ${esc(label)}"><span class="palette-card__ph" style="--r:${p.r || 1.5}${ph ? `;background-image:url(${ph})` : ''}"><img src="${p.url}/${size}.webp" alt="" loading="lazy" decoding="async"></span></a>
    ${colours ? blocks(p.sig, { pick, link }) : ''}
    <div class="palette-card__row"><div>
      ${place ? `<p class="palette-card__place">${placeHref ? `<a href="${placeHref}">${esc(place)}</a>` : esc(place)}</p>` : ''}
      <h3>${esc(p.name || '')}${p.light ? `<small>${esc(p.light)}</small>` : ''}</h3>
      ${colours ? bar(p.sig) : ''}
    </div>${colours ? `<div class="palette-card__vat" data-i="${i}"></div>` : ''}</div>
  </article>`;
}

/** Close to the eye: two colours nearer than this in OKLab read as one (a colour finds a median of 24
 *  photographs so, 43 at the most common; at 0.05 it was 117, too many to call one colour). */
const NEAR = 0.025;
const labs = new Map();
const lab = (h) => { if (!labs.has(h)) labs.set(h, oklab(h)); return labs.get(h); };
/** Every frame holding a colour close to `hex`, the most of it first: each by its nearest such colour,
 *  weighed by how much of the frame it covers and how close it comes. `not`: the frame to leave out. */
export function kindred(frames, hex, { near = NEAR, most = Infinity, not = null } = {}) {
  const P = lab(hex), out = [];
  for (const f of frames) {
    if (f === not || !f.sig?.length) continue;
    let best = null;
    for (const [h, pc] of f.sig) {
      const Q = lab(h), d = Math.hypot(P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]);
      if (d > near) continue;
      const score = pc * (1 - d / near);
      if (!best || score > best.score) best = { hit: h, score };
    }
    if (best) out.push({ f, ...best });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, most);
}

/** A photograph's palette turned toward one colour: that colour in place of the nearest of its own and
 *  given six parts in ten (more, if that held more), the others sharing the rest as they did. The dye
 *  that opens a colour (Reverie's opening, Drift's first stop). */
export function focus(sig, hex) {
  const H = lab(hex), [mine] = sig.map(([h, pc]) => ({ h, pc, x: Math.hypot(...lab(h).map((v, k) => v - H[k])) })).sort((a, b) => a.x - b.x);
  const most = Math.max(mine.pc, 60), rest = 100 - mine.pc;
  return sig.map(([h, pc, a]) => (h === mine.h ? [hex, most, 0] : [h, pc * (100 - most) / Math.max(1e-6, rest), a]));
}

/** A colour as the eye tells colours apart: a dot within this of it (OKLab) holds it. */
export const SAME = 0.025;
/** How fast a dot's closeness falls away from the colour: exp(−(x / WIDTH)²), a bell, not a slope. */
const WIDTH = 0.018;
const dotsOf = new WeakMap();
/** A frame's 24 dots (`rrggbbss` each, lib/dots.mjs): OKLab, and the share of the picture each stands for. */
const dots = (f) => {
  if (!dotsOf.has(f)) {
    const out = [];
    for (let i = 0; i + 8 <= (f.dots || '').length; i += 8) out.push({ hex: `#${f.dots.slice(i, i + 6)}`, lab: lab(`#${f.dots.slice(i, i + 6)}`), share: parseInt(f.dots.slice(i + 6, i + 8), 16) / 255 });
    dotsOf.set(f, out);
  }
  return dotsOf.get(f);
};
/**
 * Every frame that holds `hex`, read from its 24 dots (finer than its palette, which gathers a picture
 * into five): the dots within `near` of it covering at least `least` of the picture. Each scored by how
 * much of the picture holds it (S, the share) and how close it comes (C, the share-weighted closeness
 * of those dots), share leaning a little heavier: S^1.2 × C. The best first. `not`: the frame to leave out.
 */
export function holding(frames, hex, { near = SAME, least = 0.05, not = null } = {}) {
  const P = lab(hex), out = [];
  for (const f of frames) {
    if (f === not) continue;
    let held = 0, close = 0;
    for (const d of dots(f)) {
      const x = Math.hypot(P[0] - d.lab[0], P[1] - d.lab[1], P[2] - d.lab[2]);
      if (x <= near) { held += d.share; close += d.share * Math.exp(-((x / WIDTH) ** 2)); }
    }
    if (held >= least && held > 0) out.push({ f, held, score: held ** 1.2 * (close / held) });
  }
  return out.sort((a, b) => b.score - a.score);
}
/** The frame that comes closest to `hex` when none holds it: the one whose nearest dot is nearest. */
export function closest(frames, hex) {
  const P = lab(hex);
  let best = null, least = Infinity;
  for (const f of frames) for (const d of dots(f)) {
    const x = Math.hypot(P[0] - d.lab[0], P[1] - d.lab[1], P[2] - d.lab[2]);
    if (x < least) { least = x; best = f; }
  }
  return best;
}
/** The first `most` of a ranked `holding` list, chosen so no voyage crowds the rest out: taken one at a
 *  time, each frame's score lowered by `fade` for every frame already taken from its voyage (`v`, so a
 *  trip's parts count as one). */
export function varied(found, { most = 30, fade = 0.8 } = {}) {
  const left = found.slice(), taken = [], per = new Map();
  while (taken.length < most && left.length) {
    let at = 0, top = -Infinity;
    for (let i = 0; i < left.length; i++) { const s = left[i].score * fade ** (per.get(left[i].f.v) || 0); if (s > top) { top = s; at = i; } }
    const [m] = left.splice(at, 1);
    taken.push(m); per.set(m.f.v, (per.get(m.f.v) || 0) + 1);
  }
  return taken;
}
/** At most, the photographs a colour shows (Reverie, Drift in a colour): the one it was found in, then these. */
export const SHOWN = 30;
/** The colours around `hex` that the photographs hold (each a dot's worth at least), no two alike:
 *  where to wander from it. Far enough that each is a page of its own (0.04–0.08 away, 0.04 apart), dark to
 *  light. Each with the frame that holds the most of it. */
export function nearby(frames, hex, { from = 0.04, to = 0.08, most = 14 } = {}) {
  const P = lab(hex), found = [];
  for (const f of frames) for (const d of dots(f)) {
    if (d.share < 1 / 24) continue;
    const x = Math.hypot(P[0] - d.lab[0], P[1] - d.lab[1], P[2] - d.lab[2]);
    if (x > from && x < to) found.push({ ...d, f });
  }
  found.sort((a, b) => b.share - a.share);
  const out = [];
  for (const c of found) if (out.length < most && out.every((o) => Math.hypot(o.lab[0] - c.lab[0], o.lab[1] - c.lab[1], o.lab[2] - c.lab[2]) > from)) out.push(c);
  // A colour out on its own (the far reaches, where a wander leads) looks further, so it is never an end.
  return out.length < 3 && to < 0.12 ? nearby(frames, hex, { from, to: 0.12, most }) : out;
}
/**
 * A queue that pours a vat into each slot as it nears view, one a frame so scrolling stays smooth; a
 * vat poured once is kept (`poured`), so a change of order moves it rather than pouring it again.
 * While `holdFor(ms)` runs only jobs marked `now` pour: a change has the frames to itself.
 */
export function dripper() {
  const poured = new Map();
  let queue = [], hold = 0, running = false, waking = 0;
  const kick = () => { if (running) return; running = true; clearTimeout(waking); requestAnimationFrame(next); };
  const next = () => {
    const wait = hold - performance.now();
    const at = wait > 0 ? queue.findIndex((j) => j.now) : 0;
    if (!queue.length || at < 0) { running = false; if (queue.length) waking = setTimeout(kick, wait); return; }
    const [job] = queue.splice(at, 1); if (job.slot.isConnected) job.fill(); requestAnimationFrame(next);
  };
  /** Pour `make(slot)` into each slot as it nears view (`root`, `margin`); `now`: even while held. */
  function drip(slots, keyOf, make, { root = null, margin = '600px 0px', now = false } = {}) {
    const fill = (slot) => { const key = keyOf(slot); if (!poured.has(key)) poured.set(key, make(slot)); slot.replaceChildren(poured.get(key)); };
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { seen.unobserve(e.target); queue.push({ slot: e.target, fill: () => fill(e.target), now }); kick(); }
    }, { root, rootMargin: margin });
    for (const slot of slots) if (poured.has(keyOf(slot))) fill(slot); else seen.observe(slot);
    return seen;
  }
  return { poured, drip, holdFor: (ms) => { hold = performance.now() + ms; } };
}

/**
 * Where the reader was on a page of cards, kept for their return (Back): the first card on screen and
 * how far down it sat, not a scroll offset, since cards not yet drawn are only estimated
 * (content-visibility) and the page's height moves as they are.
 */
export function place(key) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; // this, not the browser's guess
  return {
    save() {
      const c = [...document.querySelectorAll('.palette-card[id]')].find((x) => x.getBoundingClientRect().bottom > 0);
      try { sessionStorage.setItem(key, JSON.stringify(c ? { id: c.id, top: c.getBoundingClientRect().top } : { y: scrollY })); } catch { /* this visit only */ }
    },
    restore() {
      let at = null;
      try { at = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* no memory */ }
      if (!at) return false;
      const el = at.id && document.getElementById(at.id);
      const go = () => scrollTo({ top: el ? el.getBoundingClientRect().top + scrollY - at.top : at.y, behavior: 'instant' });
      go(); requestAnimationFrame(go); // again once the cards about it are drawn
      return true;
    },
  };
}

/** A page of cards tells its not-yet-drawn cards their true height (_colour.scss --card-h), from one
 *  drawn for the purpose (it may be off screen, and so not drawn yet); again whenever the cards' grid
 *  changes width (its first layout settling, the fonts, a resized window), as their height follows. */
const measured = new WeakMap();
export function measureCards(root) {
  const grid = root.querySelector('.palette-cards');
  if (!grid) return;
  const measure = () => {
    const c = grid.querySelector('.palette-card');
    if (!c) return;
    c.style.contentVisibility = 'visible';
    const h = c.offsetHeight;
    c.style.contentVisibility = '';
    if (h) root.style.setProperty('--card-h', `${h}px`);
  };
  measure();
  measured.get(root)?.disconnect();
  const ro = new ResizeObserver(() => requestAnimationFrame(measure)); // after the resize is laid out, not inside it
  ro.observe(grid);
  measured.set(root, ro);
}

/** A page's data (a URL): the fetch its head began (_includes/head/custom.html, front matter
 *  `preload:`), taken once; else fetched now. Rejects as fetch does when it cannot be had. */
export function json(url) {
  const key = new URL(url, location.href).pathname, pre = window.QSD_pre?.[key];
  if (pre) delete window.QSD_pre[key];
  return (pre || Promise.resolve(null)).then((d) => d ?? fetch(key).then((r) => r.json()));
}

/** The masthead's ‹ named for the page it goes back to. */
export const backLabel = (url) => {
  const p = url.pathname.slice(new URL('../../../', import.meta.url).pathname.length - 1);
  return p === '/' ? 'Back home' : p.startsWith('/palette/') ? "Back to QSD's Palette" : p.startsWith('/reverie/') ? 'Back to the colour' : p.startsWith('/voyage/') ? 'Back to the book' : 'Back';
};

/** The page the reader came from on this site, if any (not this page itself): its URL. */
export const cameFrom = () => {
  try { const r = document.referrer && new URL(document.referrer); return r && r.origin === location.origin && r.pathname !== location.pathname ? r : null; } catch { return null; }
};
