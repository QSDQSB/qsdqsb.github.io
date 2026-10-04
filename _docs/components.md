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
| Gloss | class `blockquote.gloss` (`_page.scss`) | A heading's translation, set beneath it in two lines as an inscription is: the first small and widely spaced, the Latin-script one the `lede` in brass. Written `> 中文 *English*` then `{: .gloss}` | a post whose chapters are named in another language |
| Colour code | `_includes/colour-code.html` (`.colour-code`) | A hex named in a line of prose, a dot of the exact colour before it | posts |

## Controls

| Piece | Mixin / class | For | Used by |
|---|---|---|---|
| Pill | `pill` | Glass with a chevron or mark and a label, in a control's corners of 10 px (0009, pick 2; Q17; the name is kept from when it was a pill): the way back, a menu | `.photobook-lightbox__back`, `.palette-page__menu` |
| Brass focus | `brass-focus` | The keyboard's mark on a swatch of any colour, pale or deep: a brass hairline set off its edge, `:focus-visible` only | `.reverie__near a`, `.ridgway-swatch` |
| Round tool | `round-tool` | A full-screen viewer's tools, top right: slideshow, specs, picture only, the way to the book. A 40 px square of glass in a control's corners of 10 px (0009, pick 2; Q17; the name is kept from when it was a disc) | `.photobook-lightbox__tool`, `.colour-drift__tool` |
| Quiet icon button | `icon-button-quiet($size)` | A bare mark in the label's ink, lit on hover: no ring, no fill | `.palette-voyages__fold`, `.palette-rail__step` |
| Segmented toggle | class `.photobook-sheet__order` | Two or three exclusive choices in spaced capitals (Sequence / Colour) | the book's sheet, the palette page |
| Tooltip | `data-tip` (+ `data-tip-side`), `assets/js/photobook/tip.js` | Naming an icon control after a pause; pointer only | masthead ‹, lightbox, colophon, rail |
| Palette strip | class `.palette-strip` | A palette as a thin bar with its hex codes | specs panel, colophon |
| Tag | `tag` (+ `tag-lit`) | One look for every tag: ink, a one-pixel line, no fill and no colour; under the pointer it only brightens (0009) | the specimen page; the tag pages and a post's tags in stages 6 and 10 |
| Text button | `text-button($quiet)` (+ `text-button-lit`, `-pressed`, `-unavailable`) | A button with words: a rounded rectangle of 10 px, solid (a glass-white fill) or quiet (none until the pointer); never a pill (0009, pick 2) | the specimen page; the chrome's buttons as they move onto it (stage 2) |

## Surfaces

| Piece | Mixin | For | Used by |
|---|---|---|---|
| Bar glass | `glass-bar` | The darkened glass controls sit in over a photograph | the Photobook's dial and switch |
| Card | `card($large)` (+ `card-lifted`) | A picture that is a way in: corners of 10 px, or 18 px where it is the scene; a short shadow at rest; under the pointer and focus it lifts as one object in 0.3 s; still where motion is off (0009) | the specimen page; Home's cards in stage 4 |
| Surface relief | `surface-relief` | A flat colour field given a surface: wall or canvas relief under a raking light (a still SVG tile, soft light) | Reverie's opening, a colour's lightbox frame, Drift's colour |
| Wash | `wash` (+ `wash-layer`) | A room lit by a picture's colour, crossfading layer to layer (`assets/js/photobook/wash.js`) | the lightbox, the palette page's room |
| Plate | class `.colour-plate` (`_colour.scss`) | A piece of a colour page set in a post: a card on a card's short shadow, as wide as the column, its head naming the page (onward link), its foot a small hint. A frame's plate (`.frame-plate`) holds one print over its specs, the lightbox's own (`assets/js/photobook/specs.js`), as a band where the column is wide (`photobook-specs-band`, `_photobook.scss`) | the colour figures in a post (`_includes/colour-figure.html`, `assets/js/colour/figures.js`) |
| Folded frames | class `.colour-frames` (`_colour.scss`), a native `<details>` | A voyage's frames in a post: folded, a contact strip of small prints over their palette bars; opened on a press, the palette page's cards | the frames figure (`assets/js/colour/figures.js`) |

## Marks

| Piece | Mixin | For | Used by |
|---|---|---|---|
| Ornament | `ornament` | A lozenge on a brass rule, drawn on an `<hr>`, only between passages of prose (0009, picks 8 and 9) | the specimen page; a post's `---` in stage 6 |

Every piece is drawn in every state on the specimen page (`_specimen/`, built by
`npm run visual:build` only and shot by the pixel harness as `specimen`), so a change to a piece
shows there before any page adopts it.

## Inks and glass

On `:root`, in `_sass/_tokens.scss`: `--ink`, `--ink-2`, `--ink-3` and `--line`; `--glass` and
`--glass-edge`; a control's fill, `--control` and `--control-hover`. New work uses these names. The
Photobook's (`--photobook-ink` and the rest) are aliases of them, kept until each use has moved.
The sun's gold (`--photobook-gold`) stays the book's own.

## Scales

In `_sass/_variables.scss`, as [0002](../_plan/decisions/0002-one-control-vocabulary.md) amended by
[0009](../_plan/decisions/0009-how-much.md). A new value takes a step; a literal is a step not yet named.

| Scale | Steps |
|---|---|
| Corners | `$radius-none` 0 (a print) · `$radius-hair` 3px · `$radius-picture` 8px (a picture inside an article) · `$border-radius` 10px (a control, a card, a panel) · `$radius-large` 18px (a card that is the scene) · `$radius-pill` 999px · `$radius-round` 50% (dots and discs, not a control; the nav buttons and the quiet icon button still built so wait for the corner sorting, 0009 "Not settled") |
| Durations | `$duration-fast` 0.15s · `$duration-base` 0.3s (a hover, a card's lift) · `$duration-slow` 0.6s (a print developing, a panel moving) · `$duration-arrive` 0.7s (words arriving) · `$duration-cover` 1s (the wide cover's words; `$cubic-bezier-default` carries it) · `$duration-scene` 1.1s and over (a room's light, an opening) |
| Shadows | `$shadow-rest` (a card at rest) · `$shadow-lifted` (a card under the pointer) |
| Glass | `$glass-blur` 14px at 120% (the default) · `$glass-blur-thin` 6px (a small mark over a picture or code). The Photobook's bar and panel (18px, 24px) are inherited as built |

## Motion

- **Two curves.** `$cubic-bezier-standard` and `$cubic-bezier-smooth` in Sass. Scripts read them as
  `--ease-standard` and `--ease-smooth` from `:root`. Don't write a `cubic-bezier(…)` in a script.
- **Page changes.** Out over 0.3 s on the standard curve, in over 0.4 s on the smooth curve
  (`_view-transitions.scss`). The palette page's voyage-to-voyage change follows the same timings.
- **Content arriving.** The `reveal-on-scroll` / `is-visible` classes (`_scroll-animations.scss`):
  a 12 px fade-up.
- **Endings.** `presented-by-qsd.html` closes a page: the books, the archive, the colour pages.
- **Stillness.** Every motion stops under `prefers-reduced-motion` and `html.motion-off`.
