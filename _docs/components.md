# Components

The site's shared pieces. They come from the Photobook's design, the site's canonical system,
and live in `_sass/_components.scss`, imported before the pages that use them. A page includes a
piece; it does not restyle it.

**Reuse before you create.** Before writing a label, title, button, pill, glass or row of links
for a new page, find it here. A new piece earns its place only by a need none of these meets. Then
it goes into `_components.scss` with a line in this file, not into the page's own partial. The
palette page once invented its own title, label, links and buttons, near-copies of the book's.
That is what made it look like a different site (2026-09-27).

## Words

| Piece | Mixin | For | Used by |
|---|---|---|---|
| Eyebrow | `eyebrow` | The spaced-capital label above a title or section (never under 11px) | `.photobook-kicker`, `.colour-kicker` |
| Display title | `display-title` | A page's title, as every hero page and book cover sets it | `.photobook-cover__title h1`, `.colour-head h1` |
| Lede | `lede` | The Didot italic line under a title (font only; the page sets width and colour) | `.photobook-cover__lede`, `.colour-lede` |
| Onward links | `onward-links` | Spaced-capital links over hairlines, in a wrapping row | `.photobook-colophon__onward`, `.colour-next` |

## Controls

| Piece | Mixin / class | For | Used by |
|---|---|---|---|
| Pill | `pill` | A glass pill with a chevron or mark and a label: the way back, a menu | `.photobook-lightbox__back`, `.palette-page__menu` |
| Quiet icon button | `icon-button-quiet($size)` | A bare mark in the label's ink, lit on hover: no ring, no fill | `.palette-voyages__fold`, `.palette-rail__step` |
| Segmented toggle | class `.photobook-sheet__order` | Two or three exclusive choices in spaced capitals (Sequence / Colour) | the book's sheet, the palette page |
| Tooltip | `data-tip` (+ `data-tip-side`), `assets/js/photobook/tip.js` | Naming an icon control after a pause; pointer only | masthead ‹, lightbox, colophon, rail |
| Palette strip | class `.palette-strip` | A palette as a thin bar with its hex codes | specs panel, colophon, palette index |

## Surfaces

| Piece | Mixin | For | Used by |
|---|---|---|---|
| Bar glass | `glass-bar` | The darkened glass controls sit in over a photograph | the Photobook's dial and switch |
| Wash | `wash` (+ `wash-layer`) | A room lit by a picture's colour, crossfading layer to layer (`assets/js/photobook/wash.js`) | the lightbox, the palette page's room |

## Motion

- **Two curves.** `$cubic-bezier-standard` and `$cubic-bezier-smooth` in Sass. Scripts read them as
  `--ease-standard` and `--ease-smooth` from `:root`. Don't write a `cubic-bezier(…)` in a script.
- **Page changes.** Out over 0.3 s on the standard curve, in over 0.4 s on the smooth curve
  (`_view-transitions.scss`). The palette page's voyage-to-voyage change follows the same timings.
- **Content arriving.** The `reveal-on-scroll` / `is-visible` classes (`_scroll-animations.scss`):
  a 12 px fade-up.
- **Endings.** `presented-by-qsd.html` closes a page: the books, the archive, the colour pages.
- **Stillness.** Every motion stops under `prefers-reduced-motion` and `html.motion-off`.
