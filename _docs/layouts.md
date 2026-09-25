# Layouts & Gallery System

Reference for the 9 layouts in `_layouts/`. Linked from CLAUDE.md; read this
when touching a layout, the Photobook, or the hero.

The two with real behaviour are `gallery.html` and the page hero overlay.
Everything else is a thin wrapper.

## `gallery.html` — a router

Mutually exclusive. The branch is decided by frontmatter:

| Condition | Mode | What renders |
|---|---|---|
| `page.subgalleries == true` | **Index of parts** | Hero, sub-voyage cards via `_includes/archive-single.html`, the atlas. |
| Otherwise (default) | **Photobook** | `_includes/photobook.html`, built from the gallery's manifest. |

Index-of-parts children are discovered by path-substring match on the parent
voyage basename — the `frontmatter-contract-enforcer` skill owns the alignment
rules.

Map block (`_includes/map.html`) is included after the part cards for any
voyage with `subgalleries: true` — the layout passes
`dataset="voyage-<basename>"` and the renderer loads the auto-derived
`assets/maps/voyage-<basename>.geojson` (one feature per child, atlas renderer
+ tag legend + editorial popups), through the same Leaflet + `map.js` engine as
the global atlas.

### The Photobook

`_includes/photobook.html` assembles `_includes/photobook/`: `cover`,
`filmbar`, `book`, `frame`, `sun`, `colophon`, `lightbox`, `end` (the voyage's
other parts — up to 3 siblings sampled from `gallery_name`'s first segment —
then random voyages, tags, sign-off). Styles: `_sass/_photobook.scss`. Script:
`assets/js/photobook/` ES modules (`index.js`, `book.js`, `dial.js`, `glow.js`,
`lightbox.js`, `rows.mjs`), loaded only on these pages; every frame is plain
HTML without it.

Data contract — no files on disk, only the manifest:

- Liquid reads `site.data.photo_manifests[<gallery_name, / → _>]`, the merged
  manifest `npm run photos:fetch` writes before every build.
- The book's layer is worked out there by `scripts/photos/lib/book.mjs`: rows
  (spread / pair / three; a portrait never takes a spread), cover (first
  featured landscape, else first landscape), colophon (films, lenses, hours),
  and per photo the place (`_data/photo_locations/<gallery>.yml`, else the
  caption), the light (sun phrase + glyph), glow colours, placeholder, film,
  and the lightbox record.
- The row rule lives once, in `assets/js/photobook/rows.mjs`, so the film
  filter re-lays the page by the same rule the build used.
- Images: `https://img.qsdqsb.com/t/<hash>/<width>.<webp|avif|jpg>`, with
  srcset.
- No manifest, or no processed photos → the page renders an empty Photobook
  ("still on their way"). `check:frontmatter` and `check:gallery` catch it.

**The controls** (`filmbar.html`, `dial.js`, the bar section of `book.js`): a
film dial and a Book/Sheet switch of the same height, mounted on the seam of
cover and book (their centre on the cover's lower edge).

- The dial: a glass disc, a red index above; at rest a dot per film (white for
  ALL), in hand (hover on a real pointer, keyboard focus, a finger turning it,
  a first tap, the first-visit hint) the films' letters (`filmCode()` in
  `book.mjs`) and the setting named underneath. Click, drag with detents, or
  arrow keys. On touch the first tap only opens it. No dial for one film.
- Over the book both step away; scrolling up about 24 px calls them back
  drawn in to 58 px (`is-stuck` / `is-summoned`). While a film is chosen the
  corner keeps the dial's index over that film's colour (`.photobook-bar__mark`).
- A film change: the page glides to the book's start as the dial turns, then
  the book re-lays in a view transition (staying frames move, others
  dissolve; crossfade without the API; nothing with motion off), headed by the
  film's edge print (`.photobook-book__film`). Book ⇄ Sheet jumps to the top.
- The first-visit hint turns the dial ~10° and back once per voyage
  (`localStorage` `qsd.dial.hinted:<path>`).
- The switch has a third stop, the full-screen corners: **Screening**, the book
  full screen as a slideshow from the first frame of the current filter
  (`lightbox.js` `screen()`); a tap, click or Esc ends it where it started.
  Book or Sheet is remembered (`localStorage` `photobook-view`).
- **The way back** is the masthead's ‹ before the logo (`_includes/photobook.html`
  passes `back_url` / `back_label` to `masthead.html`, cached per destination):
  a part's to its voyage, a voyage's to all voyages. Nothing sits on the cover.

**Lightbox keyboard:** arrows = navigate, Space / S = slideshow, I = specs,
F = bare print, Z (or double-click) = loupe, Esc = back out
(loupe, then bare, then close).

## Page hero overlay (`_includes/page__hero.html`)

Active when `has-overlay-hero` is on the body (set from
`page.header.overlay_color` / `overlay_image`). Renders `.page__hero--overlay`
with the core copy/media shell: title/excerpt hierarchy, optional CTA, optional
caption.

### Depth parallax (Lontananza)

When `images/depth/<mirror>.depth.jpg` exists for the hero's `overlay_image`
(produced by `npm run generate:depth`, committed), the include emits
`data-depth-*` attributes and `assets/js/hero-depth-parallax.js` upgrades the
hero to a WebGL canvas that leans the photograph around its neural depth map
(pointer-driven, idle "breath" drift when the pointer rests).

The static `background-image` remains underneath as loading state and universal
fallback — no WebGL, `prefers-reduced-motion`, `?motion=off`, or any load
failure leaves today's static hero. The canvas replicates `overlay_filter`
in-shader so text contrast is unchanged, and slots between the media's
`::before` seam-blur and `::after` scrim (explicit z-indices preserve the
dissolve sandwich).

Optional per-page `header` keys, all on the 0–100 prototyping scale:

```yaml
header:
  overlay_image: cover/venice-3v1.jpg
  depth_parallax: false   # opt out entirely (default: on when a depth map exists)
  depth_amp: 60           # lean amplitude, default 60
  depth_focus: 75         # depth value that stays pinned, default 75 (near field)
```

The home hero (`_layouts/home.html`) runs a second variant of the same module:
a `.home__hero-depth` wrapper re-applies the glass frost recipe (blur, radial
mask, slow zoom) over the canvas and uses `data-depth-motion="spring"` —
underdamped spring motion (overshoot + settle) instead of the smooth damped
lean, amp 90, dpr capped at 1 (retina is wasted under 7px blur). Its photo is
hardcoded in the layout, so the generator lists it in `EXTRA_SOURCES`.

> A Swiper-carousel variant of this hero, gated behind a `page.swipers`
> frontmatter key, lived alongside this for a while but was never set by any
> content — it and its supporting JS/CSS/vendor bundle were removed as dead
> code. If a multi-slide hero is needed again, build it fresh against the
> current single-slide markup rather than reviving the old branch.

### Opening scene

Excerpt reveal / opening scene is runtime-driven by
`assets/js/overlay-opening-scene.js`, which:

- Toggles `overlay-opening-*` body classes.
- Emits the `qsd:overlay-opening` event with `start`, `finish`, `cancel` phases.
- `assets/js/masthead-intent.js` listens to that event and adjusts nav
  visibility/lock.

Reduced-motion users (`prefers-reduced-motion`) bypass the animated opening
flow. `?motion=off` also kills it — see the motion-switch notes for the
screenshot workflow.

## Other layouts

- `default.html` — base wrapper (masthead, search, scripts).
- `single.html` — post/page view with sidebar + TOC.
- `splash.html` — hero/landing.
- `archive.html`, `archive-taxonomy.html` — tag/category archives.
- `search.html`, `compress.html` — specialised.

## When editing layouts

1. Layout/include changes that affect visible structure trigger the
   `responsive-layout-auditor` skill — validate desktop *and* mobile-small.
2. Style changes embedded in layouts must still respect the SCSS authoring
   rules (`css-token-steward` skill).
3. Cross-check `_data/navigation.yml` and `_data/tag_colours.yml` if the layout
   consumes them — drift between layout assumptions and data shape silently
   breaks rendering.
