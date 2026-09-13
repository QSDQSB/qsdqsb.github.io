# Layouts & Gallery System

Reference for the 9 layouts in `_layouts/`. Linked from CLAUDE.md; read this
when touching a layout, the gallery viewer, or the hero.

The two with real behaviour are `gallery.html` and the page hero overlay.
Everything else is a thin wrapper.

## `gallery.html` — two execution modes

Mutually exclusive. The branch is decided by frontmatter:

| Condition | Mode | What renders |
|---|---|---|
| `page.subgalleries == true` | **Enumerator** | Sub-voyage card list via `_includes/archive-single.html`. No thumbnail grid, no JS viewer. |
| Otherwise (default) | **Gallery viewer** | Thumbnail grid + fullscreen JS viewer (`assets/js/gallery.js`). |

Enumerator children are discovered by path-substring match on the parent voyage
basename — the `frontmatter-contract-enforcer` skill owns the alignment rules.

Gallery viewer asset contracts:

- Full images: `gallery/<gallery_name>/<file>`
- Thumbnails: `images/thumbnails/gallery/<gallery_name>/<file>`
- Filenames must match between the two directories.

Map block (`_includes/map.html`) is included after main content for any voyage
with `subgalleries: true` — the layout passes `dataset="voyage-<basename>"` and
the renderer loads the auto-derived `assets/maps/voyage-<basename>.geojson`
(one feature per child, atlas renderer + tag legend + editorial popups), through
the same Leaflet + `map.js` engine as the global atlas.

**Gallery viewer keyboard:** Backspace = parent, Shift = cover/contain toggle,
Esc = fullscreen, arrows = navigate.

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
  depth_centred: true     # hero uses a SUBJECT-CENTRED depth map (see below) —
                          # switches defaults to amp 90 / focus 50 / ay 35 and
                          # scales the offset by the cover factor so parallax is
                          # uniform in screen space across viewport crops
  depth_amp: 60           # lean amplitude, default 60 (centred: 90)
  depth_focus: 75         # depth value that stays pinned, default 75 (centred: 50)
  depth_ay: 100           # vertical amplitude as % of horizontal (centred: 35 —
                          # architecture tolerates no vertical stretch)
```

**Two depth-map families** (found via on-device + headless bake-offs, PR #68):
night heroes keep the original V1-small maps — their soft edges warp as
dreamy flow, which suits organic night scenes and is the user-approved look.
Daylight/twilight heroes use the **subject-centred recipe**: Depth Anything
V2-large → σ2 soften → centre-weighted-median-to-0.5 remap (far-slope
guarded), regenerated via
`node scripts/run-depth-onnx.mjs <model.onnx> --batch jobs.json --blur 2 --centre`
(ONNX weights from the Depth-Anything-ONNX GitHub releases — no Hugging Face
needed). Pages carrying such maps set `depth_centred: true`; without the key
the runtime behaves exactly as before, so the two families coexist.
`scripts/depth-render-harness.html` + `scripts/shoot-depth-configs.mjs` are
the headless Playwright loop for tuning parallax parameters offline.

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
