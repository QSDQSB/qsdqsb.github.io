/**
 * Reverie (_pages/reverie.html): one colour, and every photograph from any voyage that holds it, read
 * from each photograph's 24 dots (./cards.js holding: the same colour to the eye, a dot's worth of the
 * picture at least), the one it was found in first. The colour leads: its dye across the whole width
 * (a rectangular vat, the colour given the most of it and that photograph's colours round it), its hex
 * set large. Beneath, the colours nearby, a step away each, to wander to; then the photographs, as the
 * palette page's cards but bare: prints and their words, nothing laid over the mood. A print opens full
 * screen and stays in the colour (Drift, walking this colour from it, held still; its ‹ comes back
 * here); a voyage's name opens its palette.
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
 * Data: /assets/colour-atlas.json (scripts/photos/lib/atlas.mjs atlasOf).
 */

import { tips } from '../photobook/tip.js';
import { crossfade } from '../photobook/wash.js';
import { vat, seedOf, oklab, glow } from './vat.js';
import { esc, ink, card, reverieOf, holding, nearby, focus } from './cards.js';

const root = document.getElementById('reverie');
const body = root?.querySelector('.reverie__stage');
const base = new URL('../../../', import.meta.url).pathname;
const still = () => window.QSD?.motionOff?.() || matchMedia('(prefers-reduced-motion: reduce)').matches;

async function main() {
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
      const lab = (h) => oklab(h), vivid = f.sig.filter(([h, pc]) => pc >= 8 && lab(h)[0] > 0.3).sort((a, b) => Math.hypot(...lab(b[0]).slice(1)) - Math.hypot(...lab(a[0]).slice(1)));
      hex = (vivid[0] || [...f.sig].sort((a, b) => b[1] - a[1])[0])[0];
    }
    return { f, hex };
  }

  const dye = root.querySelector('.reverie__dye'), hexEl = root.querySelector('.reverie__hex');
  const near = root.querySelector('.reverie__near');
  const back = document.querySelector('.masthead__back');
  // The room below the opening, faintly lit by the photograph's dye (the palette page's room,
  // ../photobook/wash.js).
  const room = Object.assign(document.createElement('div'), { className: 'palette-ambience' });
  room.setAttribute('aria-hidden', 'true');
  root.prepend(room);
  let shown = null;

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
    const field = vat(focused, { shape: 'rect', width: Math.max(1, Math.round(box.width / 8)), height: Math.max(1, Math.round(box.height / 8)), seed });
    await field.ready;
    // The photographs that hold it, the one it was found in first; and the colours a step away.
    const found = [{ f }, ...holding(frames, hex, { not: f })];
    const around = [...nearby(frames, hex), { hex, f, here: true }].sort((a, b) => oklab(a.hex)[0] - oklab(b.hex)[0]);

    return function put() {
      document.title = document.title.replace(/^[^·]*·/, `Reverie in ${HEX} ·`);
      if (back) { const label = `Back to ${f.name || 'the photograph'}, in ${page.title}`; back.href = `${page.url}#${encodeURIComponent(f.slug)}`; back.setAttribute('aria-label', label); back.dataset.tip = label; }
      if (shown?.f !== f) crossfade(room, glow(f.sig, { seed }));
      dye.querySelector(':scope > .colour-vat')?.remove();
      dye.prepend(field);
      dye.style.setProperty('--on', ink(hex));
      hexEl.textContent = HEX;
      near.innerHTML = `<p class="reverie__near-label">Nearby</p><ol>${around.map((c) => `<li>${c.here
        ? `<span class="is-here" style="--c:${c.hex}" aria-current="true" aria-label="${c.hex.toUpperCase()}, here"></span>`
        : `<a href="${reverieOf(c.f.g, c.f.slug, c.hex)}" style="--c:${c.hex}" data-tip="${c.hex.toUpperCase()}" data-tip-side="top" aria-label="${c.hex.toUpperCase()}"></a>`}</li>`).join('')}</ol>`;
      // The photographs, bare: the print and its words; the first, where the colour was found, ringed.
      body.innerHTML = `
        <p class="reverie__count">${found.length > 1 ? `In ${found.length} photographs` : 'Only here, so far'}</p>
        <div class="palette-cards">${found.map(({ f: p }, i) => card(p, { href: `${base}drift/?from=${encodeURIComponent(`${p.g}/${p.slug}`)}&c=${hex.slice(1)}&src=${encodeURIComponent(`${f.g}/${f.slug}`)}&open`, label: 'full screen, in this colour', i, from: i === 0, place: pages[p.g].title, placeHref: `${base}palette/?at=${encodeURIComponent(p.slug)}#${p.g}`, plain: true })).join('')}</div>
        <p class="colour-next"><a href="${base}drift/?from=${encodeURIComponent(`${f.g}/${f.slug}`)}&c=${hex.slice(1)}">Drift in this colour <span aria-hidden="true">→</span></a><a href="${base}palette/?at=${encodeURIComponent(f.slug)}#${f.g}">QSD's Palette for ${esc(page.title)} <span aria-hidden="true">→</span></a></p>`;
      shown = { f, hex };
    };
  }

  /**
   * From one colour to the next (_colour.scss, the view transition's names). With the opening on
   * screen, it changes in place: the dye turns to the new colour and the hex gives way. From further
   * down, the page changes as the site's pages do (the root's fade) and comes back at the top.
   */
  let changing = Promise.resolve();
  function go(next) {
    changing = changing.then(async () => {
      const put = await prepare(next);
      const inPlace = scrollY < dye.offsetHeight * 0.6;
      const update = () => { put(); if (!inPlace) scrollTo({ top: 0, behavior: 'instant' }); };
      if (still() || !document.startViewTransition) { update(); return; }
      const html = document.documentElement;
      html.classList.toggle('reverie-in-place', inPlace);
      await document.startViewTransition(update).finished.catch(() => {});
      html.classList.remove('reverie-in-place');
    });
    return changing;
  }

  // A colour nearby: its Reverie, in the page.
  root.addEventListener('click', (e) => {
    const a = e.target.closest('.reverie__near a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    e.preventDefault();
    history.pushState(null, '', url.pathname + url.search);
    go(read(url.href));
  });
  addEventListener('popstate', () => go(read(location.href)));

  // Back from a print (Drift's ‹): the page as it was left, where it was left.
  const key = () => `reverie-at:${location.search}`;
  addEventListener('pagehide', () => { try { sessionStorage.setItem(key(), String(scrollY)); } catch { /* this visit only */ } });
  const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

  const first = read(location.href);
  history.replaceState(null, '', reverieOf(first.f.g, first.f.slug, first.hex) + location.hash);
  changing = prepare(first).then((put) => {
    put();
    if (returning) { try { const y = Number(sessionStorage.getItem(key())); if (y) requestAnimationFrame(() => scrollTo({ top: y, behavior: 'instant' })); } catch { /* no memory */ } }
  });
}

if (body) { tips(); main(); }
