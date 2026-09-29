/**
 * Reverie (_pages/reverie.html): one colour, and every photograph from any voyage that holds it, read
 * from each photograph's 24 dots (./cards.js holding: the same colour to the eye, a dot's worth of the
 * picture at least), the one it was found in first. The colour leads: a chip of it, exact and flat,
 * labelled with its hex and its name, standing on its dye across the whole width
 * (a rectangular vat, the colour given the most of it and that photograph's colours round it), its hex
 * set large. Beneath, the colours nearby, a step away each, to wander to; then the photographs, as the
 * palette page's cards but bare: prints and their words, nothing laid over the mood. A print opens in
 * the book's own lightbox, over the page (../photobook/lightbox.js: its specs, keys and rail), the
 * colour its first frame and each photograph's dye vat a dot on the rail; closing it is back in the
 * colour, where it was left. A voyage's name opens its palette.
 *
 * Moving to another colour stays in the page (history kept): the dye turns to the new colour in place,
 * as the palette page's vat does, and the hex gives way to the next. From further down, the page
 * changes as the site's pages do, out and back in at the top.
 *
 * ?c=<hex>&from=<gallery>/<slug>. Without a colour, the photograph's most vivid one of any size (its
 * largest is a shadow or a grey a third of the time); without a photograph,
 * the one that holds the colour most; without either, a photograph at random. The masthead's ‹ goes back
 * to the photograph it was found in, in its book.
 *
 * Beneath the hex, its name in Robert Ridgway's Color Standards and Color Nomenclature (1912), when
 * one of his colours lies within half again the eye's match of it (four colours in five have one).
 *
 * Data: /assets/colour-atlas.json (scripts/photos/lib/atlas.mjs atlasOf); /assets/ridgway.json
 * (scripts/colour/ridgway.mjs).
 */

import { tips } from '../photobook/tip.js';
import { crossfade } from '../photobook/wash.js';
import { lightbox } from '../photobook/lightbox.js';
import { vat, seedOf, oklab, glow } from './vat.js';
import { esc, card, reverieOf, holding, varied, SHOWN, nearby, focus, shadeFor, place, cameFrom, backLabel, measureCards } from './cards.js';

const root = document.getElementById('reverie');
const body = root?.querySelector('.reverie__stage');
const base = new URL('../../../', import.meta.url).pathname;
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

async function main() {
  // The colour the address asks for, at once, while the photographs are read: its hex and its flat
  // colour where the dye will pour.
  const asked = new URLSearchParams(location.search).get('c');
  if (/^[0-9a-f]{6}$/i.test(asked || '')) {
    root.querySelector('.reverie__code').textContent = `#${asked.toUpperCase()}`;
    root.querySelector('.reverie__chip').style.background = `#${asked}`;
    const d = root.querySelector('.reverie__dye'); d.style.backgroundColor = `#${asked}`; d.style.setProperty('--shade', shadeFor(`#${asked}`));
  }
  const names = fetch(new URL('../../ridgway.json', import.meta.url)).then((r) => r.json()).catch(() => ({ colours: [] }));
  let data = null;
  try { data = await (await fetch(new URL('../../colour-atlas.json', import.meta.url))).json(); } catch { /* shown below */ }
  const pages = data?.pages || {};
  const frames = (data?.photos || []).filter((p) => pages[p.g] && p.dots && p.sig?.length);
  if (!frames.length) { body.innerHTML = '<p class="colour-empty">The colours are still being read from the photographs.</p>'; return; }

  /** The colour and the photograph it was found in, from an address. */
  function read(url) {
    const q = new URL(url, location.href).searchParams, from = q.get('from') || '', cut = from.lastIndexOf('/');
    let f = frames.find((x) => x.g === from.slice(0, cut) && x.slug === from.slice(cut + 1));
    let hex = /^[0-9a-f]{6}$/i.test(q.get('c') || '') ? `#${q.get('c').toLowerCase()}` : null;
    if (!f && hex) f = holding(frames, hex, { least: 0 })[0]?.f;
    if (!f) f = frames[Math.floor(Math.random() * frames.length)];
    if (!hex) {
      const vivid = f.sig.filter(([h, pc]) => pc >= 8 && oklab(h)[0] > 0.3).sort((a, b) => Math.hypot(...oklab(b[0]).slice(1)) - Math.hypot(...oklab(a[0]).slice(1)));
      hex = (vivid[0] || [...f.sig].sort((a, b) => b[1] - a[1])[0])[0];
    }
    return { f, hex };
  }

  const dye = root.querySelector('.reverie__dye'), codeEl = root.querySelector('.reverie__code'), namedEl = root.querySelector('.reverie__named'), chipEl = root.querySelector('.reverie__chip'), hexEl = root.querySelector('.reverie__hex');
  // Ridgway's names, each with its colour in OKLab; a colour is named by the nearest within reach.
  const ridgway = (await names).colours.map(([n, h]) => [n.replace(/\s*\(\d\)$/, ''), oklab(`#${h}`)]);
  const nameOf = (hex) => {
    const P = oklab(hex); let best = null;
    for (const [n, L] of ridgway) { const x = Math.hypot(P[0] - L[0], P[1] - L[1], P[2] - L[2]); if (!best || x < best.x) best = { n, x }; }
    return best && best.x <= 0.03 ? best.n : '';
  };
  const near = root.querySelector('.reverie__near');
  const back = document.querySelector('.masthead__back'), came = cameFrom();
  // The room below the opening, faintly lit by the photograph's dye (the palette page's room,
  // ../photobook/wash.js).
  const room = Object.assign(document.createElement('div'), { className: 'palette-ambience' });
  room.setAttribute('aria-hidden', 'true');
  root.prepend(room);
  let shown = null, hero = {};

  // The book's lightbox, over the page. Its frames are laid when it opens (the colour, then the
  // photographs as the cards stand), from every voyage's lightbox frames (/assets/frames.json,
  // fetched once, when first wanted).
  let book = null;
  const books = () => (book ??= fetch(new URL('../../frames.json', import.meta.url)).then((r) => r.json()).catch(() => ({})));
  const lbFrames = [], lbEl = document.getElementById('photobook-lightbox');
  const cardPrints = () => body.querySelectorAll('.palette-card__print');
  const lb = lightbox(lbFrames, {
    printOf: (i) => (i === 0 ? dye : cardPrints()[i - 1]),
    mark: (p) => (p.paint ? vat(p.dye, { size: 16, seed: p.seed }) : vat(p.signature || p.sig || [], { size: 16, seed: seedOf(`${p.g}/${p.slug}`) })),
  });
  async function lay() {
    const all = await books(), { f, hex, found, focused } = shown, HEX = hex.toUpperCase();
    const seed = seedOf(`${f.g}/${f.slug}`);
    const colour = {
      slug: 'colour', name: HEX, place: HEX, city: `In ${found.length} photograph${found.length === 1 ? '' : 's'}`, ratio: 16 / 9, dye: focused, seed,
      paint() {
        const el = document.createElement('div');
        el.style.setProperty('--shade', shadeFor(hex));
        el.append(vat(focused, { shape: 'rect', width: 200, height: 112, seed }));
        el.insertAdjacentHTML('beforeend', `<p class="reverie__hex is-painted" style="--c:${hex}">${HEX}</p>`);
        return el;
      },
      room: () => glow(focused, { seed }),
    };
    const photos = found.map(({ f: p }) => {
      const fr = (all[p.g] || []).find((x) => x.slug === p.slug) || { slug: p.slug, url: p.url, sizes: p.sizes, ratio: p.r, name: p.name, signature: p.sig };
      return { ...fr, g: p.g, voyage: pages[p.g].title };
    });
    lbFrames.splice(0, lbFrames.length, colour, ...photos);
  }
  async function openAt(k, img = null) { const was = shown; await changing; await lay(); if (shown === was) lb.open(k, null, img); }
  // The way back, named for the colour.
  const lbBack = lbEl?.querySelector('.photobook-lightbox__back');

  /**
   * A colour's Reverie, made ready off the page (the dye measured and drawn), then set in at once by the
   * returned `put`: a view transition must find its change ready, as the page does not draw while it waits.
   */
  async function prepare({ f, hex }) {
    const page = pages[f.g], HEX = hex.toUpperCase(), seed = seedOf(`${f.g}/${f.slug}`);
    // The opening: the photograph's colours turned toward this one (./cards.js focus) and poured into the
    // whole width (a rectangular vat, ./vat.js), so it lies in the middle and the others run as currents
    // round it. Drawn at an eighth of the size it is shown and let soften as it is spread: a mood.
    const focused = focus(f.sig, hex);
    const box = dye.getBoundingClientRect();
    // Still, from the shared context (no context of its own to make, no program to compile): the colour
    // changes at once. The stirrable one is made only when the dot is first pointed at (below).
    const fw = Math.max(1, Math.round(box.width / 8)), fh = Math.max(1, Math.round(box.height / 8));
    const field = vat(focused, { shape: 'rect', width: fw, height: fh, seed });
    await field.ready;
    // The photographs that hold it: the one it was found in first, then the nearest others, no voyage
    // crowding the rest out; and the colours a step away.
    const others = holding(frames, hex, { not: f }), all = others.length + 1;
    const found = [{ f }, ...varied(others, { most: SHOWN - 1 })];
    const around = [...nearby(frames, hex), { hex, f, here: true }].sort((a, b) => oklab(a.hex)[0] - oklab(b.hex)[0]);

    return function put() {
      document.title = document.title.replace(/^[^·]*·/, `Reverie in ${HEX} ·`);
      if (back && !came) { const label = `Back to ${f.name || 'the photograph'}, in ${page.title}`; back.href = `${page.url}#${encodeURIComponent(f.slug)}`; back.setAttribute('aria-label', label); back.dataset.tip = label; }
      if (shown?.f !== f) crossfade(room, glow(f.sig, { seed }));
      dye.querySelector(':scope > .colour-vat')?.remove();
      hero.live?.release?.(); // the last colour's stirring field, if it was stirred, lets its context go
      hero = { field, live: null, spec: [focused, { shape: 'rect', width: fw, height: fh, seed, stir: 'hold', speed: 20 }], want: false };
      dye.prepend(field);
      dye.classList.add('is-poured');
      dye.style.setProperty('--shade', shadeFor(hex));
      codeEl.textContent = HEX;
      chipEl.style.background = hex;
      const named = nameOf(hex);
      namedEl.textContent = named; // its line kept, named or not, so the hex never moves between colours
      near.innerHTML = `<p class="reverie__near-label">Nearby</p><ol>${around.map((c) => `<li>${c.here
        ? `<span class="is-here" style="--c:${c.hex}" aria-current="true"><span class="visually-hidden">${c.hex.toUpperCase()}, here</span></span>`
        : `<a href="${reverieOf(c.f.g, c.f.slug, c.hex)}" style="--c:${c.hex}" data-tip="${c.hex.toUpperCase()}" data-tip-side="top" aria-label="${c.hex.toUpperCase()}"></a>`}</li>`).join('')}</ol>`;
      // The photographs, bare: the print and its words; the first, where the colour was found, ringed.
      body.innerHTML = `
        <p class="reverie__count">${all > found.length ? `QSD reveries: the ${found.length} nearest of ${all} photographs` : (all === 1 ? 'QSD reveries in only this photograph… for now' : `QSD reveries in ${all} photographs`)}</p>
        <div class="palette-cards">${found.map(({ f: p }, i) => card(p, { href: `${base}drift/?from=${encodeURIComponent(`${p.g}/${p.slug}`)}&c=${hex.slice(1)}&src=${encodeURIComponent(`${f.g}/${f.slug}`)}&open`, label: 'full screen, in this colour', i, from: i === 0, place: pages[p.g].title, placeHref: `${base}palette/?at=${encodeURIComponent(p.slug)}#${p.g}`, plain: true })).join('')}</div>
        <p class="colour-next"><a href="${base}drift/?from=${encodeURIComponent(`${f.g}/${f.slug}`)}&c=${hex.slice(1)}">Drift in this colour <span aria-hidden="true">→</span></a><a href="${base}palette/?at=${encodeURIComponent(f.slug)}#${f.g}">QSD's Palette for ${esc(page.title)} <span aria-hidden="true">→</span></a></p>
        <p class="reverie__credit"><a href="${base}utils/ridgway/">Colour names after Robert Ridgway, 1912 <span aria-hidden="true">→</span></a></p>`;
      measureCards(body);
      shown = { f, hex, found, focused };
      if (lbBack) { lbBack.lastChild.textContent = HEX; lbBack.setAttribute('aria-label', `Back to ${HEX}`); lbBack.dataset.tip = `Back to ${HEX} · Esc`; }
    };
  }

  /**
   * From one colour to the next (_colour.scss, the view transition's names). With the opening on
   * screen, it changes in place: the dye turns to the new colour and the hex gives way. From further
   * down, the page changes as the site's pages do (the root's fade) and comes back at the top.
   */
  let changing = Promise.resolve(), shownAt = '', wanted = '';
  // One change after another; a change that fails leaves the page as it was, and the next still runs.
  // `focus`: a change the reader asked for from a control the change takes away (a colour nearby):
  // focus goes to the new colour's hex, which says it, rather than falling to the page.
  function go(next, at = location.search, { focus = false } = {}) {
    wanted = at;
    changing = changing.then(async () => {
      if (at !== wanted) return; // passed over by a later change before it began
      const put = await prepare(next);
      if (at !== wanted) return;
      const inPlace = scrollY < dye.offsetHeight * 0.6;
      const update = () => { put(); shownAt = at; if (!inPlace) scrollTo({ top: 0, behavior: 'instant' }); if (focus) hexEl.focus({ preventScroll: true }); };
      if (still() || !document.startViewTransition) { update(); return; }
      const html = document.documentElement;
      html.classList.toggle('reverie-in-place', inPlace);
      await document.startViewTransition(update).finished.catch(() => {});
      html.classList.remove('reverie-in-place');
    }).catch(() => {});
    return changing;
  }

  // Pointing at the colour's dot stirs its dye; leaving it, the dye stays as it was left. The stirring
  // field is made on the first point (the same dye, measured already, so it takes the still one's place
  // unseen), and kept for this colour only.
  chipEl.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    const h = hero; h.want = true;
    if (h.live) { h.live.stir(true); return; }
    if (h.making) return;
    h.making = true;
    const live = vat(...h.spec);
    live.ready.then(() => {
      if (hero !== h) { live.release?.(); return; }
      h.field.replaceWith(live); h.live = live;
      if (h.want) live.stir(true);
    });
  });
  chipEl.addEventListener('pointerleave', () => { hero.want = false; hero.live?.stir(false); });

  // A colour nearby: its Reverie, in the page. A print: the lightbox, over the page.
  root.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const print = e.target.closest('.palette-card__print');
    if (print && lbEl) { e.preventDefault(); openAt([...cardPrints()].indexOf(print) + 1, print.querySelector('img')); return; }
    const a = e.target.closest('.reverie__near a[href]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    e.preventDefault();
    history.pushState({ colours: (history.state?.colours ?? 0) + 1 }, '', url.pathname + url.search);
    go(read(url.href), url.search, { focus: true });
  });
  // ← and → wander to the colour beside this one in the row nearby (dark to light), as a click there
  // would; not while the lightbox has the keys, or a field or a modifier does.
  addEventListener('keydown', (e) => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || lbEl?.open || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const items = [...near.querySelectorAll('li')], here = items.findIndex((li) => li.querySelector('.is-here'));
    const to = items[here + (e.key === 'ArrowRight' ? 1 : -1)]?.querySelector('a[href]');
    if (here < 0 || !to) return;
    e.preventDefault(); to.click();
  });
  // Back and forward between colours (the lightbox's own steps, open and closed, keep the address).
  addEventListener('popstate', () => { if (lbEl?.open || location.search === (wanted || shownAt)) return; go(read(location.href)); });

  // Back from a print (Drift's ‹): the page as it was left, where it was left (the card at the top).
  const kept = () => place(`reverie-at:${location.search}`);
  addEventListener('pagehide', () => kept().save());
  const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

  // The masthead's ‹, when the reader came from another page of the site: back the way they came, to
  // that page as they left it (the book at its frame, the palette where they were), over the colours
  // they have taken here since (each a step in the history, counted in its state).
  if (back && came) {
    const to = backLabel(came);
    back.href = came.href; back.setAttribute('aria-label', to); back.dataset.tip = to;
    back.addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.go(-((history.state?.colours ?? 0) + 1)); } });
  }

  const first = read(location.href);
  // The address made whole (its colour and where it was found), keeping what the history holds for
  // this entry (the lightbox's, when the page is come back to with it open).
  history.replaceState({ ...history.state, colours: history.state?.colours ?? 0 }, '', reverieOf(first.f.g, first.f.slug, first.hex) + location.hash);
  wanted = location.search;
  changing = prepare(first).then((put) => {
    put(); shownAt = location.search;
    if (returning) requestAnimationFrame(() => kept().restore());
    // A link to one of its photographs (#slug) opens it.
    const slug = decodeURIComponent(location.hash.slice(1));
    const k = slug ? shown.found.findIndex(({ f: p }) => p.slug === slug) : -1;
    if (k >= 0) openAt(k + 1);
  });
}

if (body) { tips(); main(); }
