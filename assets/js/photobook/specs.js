/**
 * A frame's specs, as the lightbox's panel sets them: its number on the roll, the place, the six
 * figures (focal length, aperture, shutter, ISO, the weather, the sun), the film's edge print, its
 * palette as a wall label, the camera and the film settings.
 *
 * Shared by the lightbox (./lightbox.js) and a post's frame figure (../colour/figures.js), so the
 * panel a post shows is the one the book shows. Styles: _sass/_photobook.scss (.photobook-specs__*).
 */

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The sun's glyph and phrase, as _includes/photobook/sun.html draws them. */
export function sunGlyph(l, cls = 'photobook-sun__glyph') {
  return `<svg class="${cls}" viewBox="0 0 20 16" aria-hidden="true"><path class="photobook-sun__arc" d="M2 11A8 8 0 0 1 18 11"/><path class="photobook-sun__horizon" d="M0 11H20"/><circle class="photobook-sun__dot${l.below ? ' photobook-sun__dot--below' : ''}" cx="${l.x}" cy="${l.y}" r="1.7"/></svg>`;
}

/** The weather's mark: drawn in the sun glyph's hand, one ink hairline throughout. */
const CLOUD = 'M5 10h10.5a3 3 0 0 0 .3-6 4.2 4.2 0 0 0-8-.8A3.4 3.4 0 0 0 5 10z';
const WEATHER = {
  clear: '<circle class="w-ink" cx="10" cy="8" r="3"/><path class="w-ink" d="M10 1.5v1.8M10 12.7v1.8M3.5 8h1.8M14.7 8h1.8M5.4 3.4l1.3 1.3M13.3 11.3l1.3 1.3M5.4 12.6l1.3-1.3M13.3 4.7l1.3-1.3"/>',
  night: '<path class="w-ink" d="M12.6 2.6A4.6 4.6 0 1 0 15.4 11 5.4 5.4 0 0 1 12.6 2.6z"/>',
  partly: '<circle class="w-ink" cx="7" cy="6" r="2.4"/><path class="w-ink" d="M7 1.6v1M2.6 6h1M3.9 2.9l.7.7M10.1 2.9l-.7.7"/><path class="w-ink" d="M6.5 13.5h9a2.7 2.7 0 0 0 .2-5.4 3.6 3.6 0 0 0-6.9-.6 2.9 2.9 0 0 0-2.3 6z"/>',
  'partly-night': '<path class="w-ink" d="M7.3 3.1A2.9 2.9 0 1 0 9.4 8.3 3.4 3.4 0 0 1 7.3 3.1z"/><path class="w-ink" d="M6.5 13.5h9a2.7 2.7 0 0 0 .2-5.4 3.6 3.6 0 0 0-6.9-.6 2.9 2.9 0 0 0-2.3 6z"/>',
  aloft: '<path class="w-ink" d="M2 3.5h16" stroke-dasharray="1.5 2"/><path class="w-ink" d="M5 14h10.5a3 3 0 0 0 .3-6 4.2 4.2 0 0 0-8-.8A3.4 3.4 0 0 0 5 14z"/>',
  overcast: '<path class="w-ink" d="M5 13h10.5a3 3 0 0 0 .3-6 4.2 4.2 0 0 0-8-.8A3.4 3.4 0 0 0 5 13z"/>',
  fog: '<path class="w-ink" d="M3 5.5h14M5 8.5h12M3 11.5h11"/>',
  rain: `<path class="w-ink" d="${CLOUD}"/><path class="w-ink" d="M7 12l-.8 2M10.5 12l-.8 2M14 12l-.8 2"/>`,
  snow: `<path class="w-ink" d="${CLOUD}"/><circle class="w-dot" cx="7" cy="13.3" r=".7"/><circle class="w-dot" cx="10.5" cy="14.3" r=".7"/><circle class="w-dot" cx="14" cy="13.3" r=".7"/>`,
  thunder: `<path class="w-ink" d="${CLOUD}"/><path class="w-ink" d="M10.8 10.5l-1.8 2.3h2.2l-1.6 2.4"/>`,
};
// Each mark's ink from left to right (its bounding box, plus the hairline's half-width), so the box
// can be cut to it and the mark stand right after the temperature like one more letter.
const INK = { clear: [3, 17], night: [7.7, 15.9], partly: [2.1, 18.8], 'partly-night': [3.9, 18.8], aloft: [1.5, 19.2], overcast: [2.2, 19.2], fog: [2.5, 17.5], rain: [2.2, 19.2], snow: [2.2, 19.2], thunder: [2.2, 19.2] };
export const weatherGlyph = (w) => {
  const [x0, x1] = INK[w.kind] || [0, 20];
  return `<svg class="photobook-weather__glyph" viewBox="${x0} 0 ${x1 - x0} 16" style="--ink:${((x1 - x0) / 16).toFixed(3)}" aria-hidden="true">${WEATHER[w.kind] || ''}</svg>`;
};

/**
 * The frame's signature (three to five colours, lib/signature.mjs), set like a wall label: a thin
 * bar, widths tempered (the square root of each share) so a black that fills the frame does not
 * drown the rest, which leads to the voyage's page in QSD's Palette; beneath it the colours' hex
 * codes, plain text to select and copy, shown while the palette is under the pointer.
 * `to`: where the bar leads, { base: the palette page, gallery, title }.
 */
export const paletteStrip = (p, to) => (p.signature?.length ? `<div class="palette-strip photobook-specs__palette">
      <a class="palette-strip__bar" href="${to.base}?at=${encodeURIComponent(p.slug)}#${to.gallery}" data-tip="${esc(to.title)}" data-tip-side="top" aria-label="${esc(to.title)}">${p.signature.map(([h, pc]) => `<i style="--c:${h};flex:${Math.sqrt(pc).toFixed(2)}"></i>`).join('')}</a>
      <p class="palette-strip__hex">${p.signature.map(([h]) => `<span><i style="--c:${h}"></i>${h.slice(1).toUpperCase()}</span>`).join('')}</p>
    </div>` : '');

/** The panel's contents. n: the frame's place in the book, printed on the film's edge as a roll
 *  numbers its frames. `to`: where its palette leads (paletteStrip). */
export function specsHTML(p, n, to) {
  const ev = p.bias ? ` · ${p.bias > 0 ? '+' : '−'}${Math.abs(Math.round(p.bias * 100) / 100)} EV` : '';
  const sun = p.light ? `<div class="photobook-specs__sun"><b>${String(p.light.alt).replace('-', '−')}°${sunGlyph(p.light)}</b><span>${esc(p.light.text)}</span></div>` : '';
  const wide = ([, v]) => String(v).length > 12;
  const settings = p.settings?.length ? `<dl class="photobook-specs__settings">${[...p.settings.filter((s) => !wide(s)), ...p.settings.filter(wide)].map(([k, v]) => `<div${wide([k, v]) ? ' class="is-wide"' : ''}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '';
  return `<div class="photobook-specs__head"><span class="photobook-specs__no">${esc(p.frame)}${p.shots ? ` · <span title="Shutter count">№ ${Number(p.shots).toLocaleString('en-GB')}</span>` : ''}</span>
        ${p.place ? `<h3>${esc(p.place)}</h3>` : ''}${p.city ? `<span class="photobook-specs__city">${esc(p.city)}</span>` : ''}</div>
      <div class="photobook-specs__highlights">
        <div><b>${p.focal ? Math.round(p.focal) : '—'}<small>mm</small></b><span>Focal length</span></div>
        <div><b><i>ƒ</i>/${p.aperture ?? '—'}</b><span>Aperture</span></div>
        <div><b>${esc(p.shutter || '—')}<small>s</small></b><span>Shutter</span></div>
        <div><b>${p.iso ?? '—'}</b><span>ISO${ev}</span></div>
        ${p.weather ? `<div class="photobook-specs__weather"><b>${String(p.weather.t).replace('-', '−')}°C</b><span>${weatherGlyph(p.weather)}${esc(p.weather.text)}</span></div>` : ''}
        ${sun}
        ${p.film ? `<div class="photobook-specs__film"><div class="photobook-specs__print" style="--film:${p.hue}">${esc(p.film)}${p.code ? `<span>${esc(p.code)}</span>` : ''}<i>${n}&emsp;▸${n}A</i></div></div>` : ''}
        ${paletteStrip(p, to)}
      </div>
      ${p.camera || p.lens ? `<p class="photobook-specs__gear"><b>${esc(p.camera || '')}</b>${p.lens ? ` · ${esc(p.lens)}` : ''}</p>` : ''}
      ${settings}`;
}
