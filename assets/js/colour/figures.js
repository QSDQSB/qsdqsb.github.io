/**
 * Colour figures in a post's column (_includes/colour-figure.html): the Palette's and Reverie's own
 * pieces, drawn from the site's own data where a post speaks of them, so a figure stays true as the
 * photographs change. Each is drawn as it nears the screen, and its data fetched only then:
 *
 *   palette  a voyage's palette as on its palette page: its blocks, each to its colour's Reverie, and
 *            its dye vat, stirred under the pointer (./vat.js)
 *   frames   a voyage's frames, in the book's sequence or as the post lists them: folded, a contact strip
 *            of the prints, each over its palette's bar; opened (a native disclosure), the palette
 *            page's cards (./cards.js card), where a print opens in its book
 *   chips    colours, each a swatch with its hex and its name in Ridgway's book when one lies close
 *            (./reverie-parts.js namer), as his plates set them (.ridgway-swatch); each to its Reverie
 *   reverie  a colour's Reverie as a card: its dye, hex and name, the colours nearby, the count and the
 *            photographs, worked out as the page works them out (./reverie-parts.js); the card opens it
 *
 * The palette, the frames and the Reverie each stand on a plate: a card, as wide as the column, that
 * says which page it is a piece of (its head leads there) and, at its foot, what it does in the hand.
 * Until a figure is drawn it holds the link it stands for (and keeps it with scripts off, or in a feed).
 *
 * Data: /assets/palettes.json, /assets/colour-atlas.json, /assets/ridgway.json. Styles: _sass/_colour.scss.
 */

import { tips } from '../photobook/tip.js';
import { develop } from '../photobook/develop.js';
import { vat, seedOf } from './vat.js';
import { esc, blocks, bar, card, kindred, dripper, reverieOf, shadeFor, measureCards, json } from './cards.js';
import { namer, opening, gather, pour, nearRow, countLine, prints } from './reverie-parts.js';

// Each file fetched once, when a figure first wants it.
const wanted = {};
const data = (name) => (wanted[name] ??= json(new URL(`../../${name}.json`, import.meta.url)));
const voyageOf = async (g) => {
  const all = await data('palettes'), v = (all.voyages || []).find((x) => x.g === g), page = all.pages?.[g];
  if (!v || !page) throw new Error(`no palette for ${g}`);
  return { v, page };
};
const names = async () => namer((await data('ridgway')).colours);
const hexOf = (six) => (/^[0-9a-f]{6}$/i.test(six) ? `#${six.toLowerCase()}` : null);
const { drip } = dripper();
const PALETTE = new URL('../../../palette/', import.meta.url).pathname;

// A plate's head, the page it is a piece of; and its foot, what it does in the hand (`hover`: said
// only where a pointer can rest on things).
const head = (v, page) => `<p class="colour-plate__head"><a href="${PALETTE}#${v.g}">QSD's Palette for ${esc(page.title)} <span aria-hidden="true">→</span></a></p>`;
const hint = (rest, hover = '') => `<p class="colour-plate__hint">${hover ? `<span class="colour-plate__hover">${hover} </span>` : ''}${rest}</p>`;

const draw = {
  async palette(el) {
    const { v, page } = await voyageOf(el.dataset.voyage);
    const sig = v.palette.map((c) => [c.hex, c.pc, c.accent ? 1 : 0]), frames = v.photos.map((p) => ({ ...p, g: v.g }));
    // A colour of the voyage's own opens its Reverie from the frame that holds the most of it (as its palette page does).
    const rootOf = (h) => { const [m] = kindred(frames, h, { most: 1, near: 0.12 }); return reverieOf(m ? v.g : null, m?.f.slug, h); };
    el.innerHTML = `<article class="colour-plate">${head(v, page)}
      <section class="palette-voyage"><div class="palette-voyage__blocks">${blocks(sig, { link: rootOf })}</div><div class="palette-voyage__vat"></div></section>
      ${hint('Each colour opens its Reverie.', 'Rest the pointer on the vat to stir it.')}</article>`;
    el.querySelector('.palette-voyage__vat').append(vat(v.palette, { size: 176, seed: seedOf(v.g), stir: 'hover', label: `The colours of ${page.title}, run together as in a dye vat` }));
  },

  async frames(el) {
    const { v, page } = await voyageOf(el.dataset.voyage);
    const asked = (el.dataset.frames || '').split(/\s+/).filter(Boolean);
    const shown = asked.length ? asked.map((slug) => v.photos.findIndex((p) => p.slug === slug)).filter((i) => i >= 0) : v.photos.map((_, i) => i);
    // Folded, the frames are a strip of small prints over their bars: the story at a glance, and a
    // tenth of the room. The cards (and their full prints) are drawn only once the reader opens it.
    const strip = shown.map((i) => { const p = v.photos[i]; return `<span class="colour-frames__thumb"><img src="${p.url}/480.webp" alt="" loading="lazy" decoding="async">${bar(p.sig)}</span>`; }).join('');
    el.innerHTML = `<article class="colour-plate">${head(v, page)}
      <details class="colour-frames">
        <summary><span class="colour-frames__strip">${strip}</span><span class="colour-frames__toggle"><span class="colour-frames__show">Show the ${shown.length} frames and their colours</span><span class="colour-frames__hide">Fold the frames away</span></span></summary>
        <div class="palette-cards">${shown.map((i) => { const p = v.photos[i]; return card(p, { href: `${page.url}#${encodeURIComponent(p.slug)}`, i, link: (h) => reverieOf(v.g, p.slug, h) }); }).join('')}</div>
        ${hint('Each print opens in its book. Each colour opens its Reverie.')}
      </details></article>`;
    el.querySelector('details').addEventListener('toggle', () => measureCards(el));
    const key = (slot) => `${v.g}/${v.photos[slot.dataset.i].slug}`;
    drip(el.querySelectorAll('.palette-card__vat'), key, (slot) => vat(v.photos[slot.dataset.i].sig, { size: 44, seed: seedOf(key(slot)) }));
    measureCards(el);
  },

  async chips(el) {
    const nameOf = await names(), colours = (el.dataset.colours || '').split(/\s+/).map(hexOf).filter(Boolean);
    el.innerHTML = `<ol>${colours.map((hex) => {
      const name = nameOf(hex);
      return `<li><a class="ridgway-swatch${name ? '' : ' is-unnamed'}" href="${reverieOf(null, null, hex)}" style="--c:${hex}" data-tip="Reverie in ${hex.toUpperCase()}" data-tip-side="top"><i></i><b>${name ? esc(name) : 'Unnamed'}</b><span>${hex.slice(1).toUpperCase()}</span></a></li>`;
    }).join('')}</ol>`;
  },

  async reverie(el) {
    const asked = hexOf(el.dataset.colour);
    if (!asked) throw new Error('no colour');
    const [atlas, nameOf] = await Promise.all([data('colour-atlas'), names()]);
    const pages = atlas.pages || {}, frames = (atlas.photos || []).filter((p) => pages[p.g] && p.dots && p.sig?.length);
    if (!frames.length) throw new Error('no photographs');
    const { f, hex } = opening(frames, { hex: asked }), { focused, found, all, around } = gather(frames, { f, hex });
    const HEX = hex.toUpperCase(), to = reverieOf(f.g, f.slug, hex);
    // The page's own opening, row, count and photographs, in its order. One link lies over the whole
    // card, to the colour's Reverie (_colour.scss); the colours nearby and a voyage's name lie above it.
    el.innerHTML = `<article class="colour-plate reverie-card">
      <a class="reverie-card__open" href="${to}" aria-label="Reverie in ${HEX}${nameOf(hex) ? `, ${esc(nameOf(hex))}` : ''}"></a>
      <header class="reverie__dye" style="--shade:${shadeFor(hex)};background-color:${hex}">
        <div class="reverie__words"><div class="reverie__label">
          <div class="colour-kicker">Reveries</div>
          <div class="reverie__hex"><span class="reverie__code">${HEX}</span><span class="reverie__chip" aria-hidden="true" style="background:${hex}"></span></div>
          <div class="reverie__named">${esc(nameOf(hex))}</div>
        </div></div>
      </header>
      <div class="reverie-card__body">
        <nav class="reverie__near" aria-label="Colours nearby">${nearRow(around)}</nav>
        <div class="reverie__count">${countLine(found.length, all)}</div>
        ${prints(found, pages, { href: () => to, label: 'in its Reverie' })}
        ${hint('The card opens this colour’s Reverie. Each colour nearby opens its own.')}
      </div>
    </article>`;
    const dye = el.querySelector('.reverie__dye'), { field } = pour(dye, focused, seedOf(`${f.g}/${f.slug}`));
    await field.ready;
    dye.prepend(field);
    dye.classList.add('is-poured');
    // The prints lead where the card does: one stop for the keyboard, the card's own link.
    for (const print of el.querySelectorAll('.palette-card__print')) print.tabIndex = -1;
    measureCards(el);
  },
};

const figures = [...document.querySelectorAll('.colour-figure[data-figure]')].filter((el) => draw[el.dataset.figure]);
if (figures.length) {
  tips();
  // Its prints develop over their blurred placeholders, as the book's do (../photobook/develop.js).
  for (const el of figures) develop(el, '.palette-card__ph img');
  // A figure that cannot be drawn (no data, a voyage or colour gone) keeps its link.
  const fill = (el) => draw[el.dataset.figure](el).then(() => el.classList.add('is-drawn'), () => {});
  if (!('IntersectionObserver' in window)) figures.forEach(fill);
  else {
    const near = new IntersectionObserver((seen) => { for (const e of seen) if (e.isIntersecting) { near.unobserve(e.target); fill(e.target); } }, { rootMargin: '100% 0px' });
    figures.forEach((el) => near.observe(el));
  }
}
