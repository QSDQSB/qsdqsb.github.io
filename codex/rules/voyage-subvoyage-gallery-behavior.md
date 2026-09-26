# Voyage/Subvoyage Gallery Behavior

Canonical instruction for how `_voyage`, `_subvoyage`, and `_layouts/gallery.html` determine page behavior.

## Purpose

Define deterministic behavior contracts for gallery-backed voyage content without changing runtime logic.

## Execution Model

The `gallery` layout has two mutually exclusive branches:

1. Enumerator mode (index of parts):
   - Condition: `page.subgalleries == true`
   - Outcome: render hero, a subvoyage card list (via `archive-single.html`) and the atlas; no Photobook.
2. Photobook mode:
   - Condition: all other cases (`page.subgalleries` missing/false)
   - Outcome: include `_includes/photobook.html` (cover, film bar, book, colophon, end matter, lightbox), styled by `_sass/_photobook.scss`, scripted by the `assets/js/photobook/` ES modules.

## Parameter-To-Behavior Matrix

| Parameter | Location | Required | Behavior |
| --- | --- | --- | --- |
| `subgalleries` | `_voyage` frontmatter (default false in `_config.yml`) | Conditional | `true` selects enumerator mode; the page renders no Photobook. |
| `gallery_name` | `_voyage` or `_subvoyage` frontmatter | Required for Photobook mode | Selects the merged manifest `site.data.photo_manifests[<gallery_name with / → _>]`. |
| `subgalleries: true` also auto-includes a map | `_voyage` frontmatter | N/A (implied by `subgalleries`) | Always renders `_includes/map.html` with the auto-derived `voyage-<basename>` dataset — `map_dataset` frontmatter has no effect here; unset for `_voyage`/`_subvoyage`. |
| `tags` | frontmatter | Optional but recommended | If `site.tag_voyage.type` and first tag exist, renders voyage tag taxonomy block. |
| `title` | frontmatter | Required | Shown in page header; also used by random-anchor include (`slugify(title)` for in-page anchors). |
| `subtitle` / `description` / `excerpt` | frontmatter | Optional (one recommended) | Photobook cover lede: first of `subtitle`, `description`, `excerpt`. |
| `header.overlay_*` | frontmatter | Optional but expected for visual consistency | Enumerator hero; in Photobook mode, `overlay_image` is the cover only when the manifest has no cover photo. |
| `collections`, `defaults` | `_config.yml` | Required site config | Set default `layout: gallery` for `voyage`/`subvoyage` and default `subgalleries: false` for voyage. |
| `subvoyage permalink` | `_config.yml` | Required site config | `subvoyage` routes under `/voyage/:path/`. |
| `tag_voyage` | `_config.yml` | Required for voyage tag archive rendering | Enables voyage taxonomy URL generation. |
| `photo_manifests` | `_data/photo_manifests/<key>.json` (gitignored) | Required for Photobook mode | Written by `npm run photos:fetch` before every build; `scripts/photos/lib/book.mjs` adds rows, cover, colophon and per-photo place/light/glow/lightbox record. |

## Routing And Collection Expectations

1. Parent voyage pages:
   - Source: `_voyage/*.md`
   - Typical use:
     - `subgalleries: true` for parent index behavior, or
     - `gallery_name` for direct gallery behavior.
2. Subvoyage pages:
   - Source: `_subvoyage/**.md`
   - URL contract: `/voyage/:path/` from collection permalink.
3. Enumerator linkage contract:
   - Parent voyage enumerator branch derives `voyage_name` from parent file basename.
   - Subvoyages are matched by `item.path contains "<voyage_name>/"`.
   - Parent voyage basename and subvoyage folder naming must stay aligned.
4. Subvoyage related-panel contract (Photobook mode, `_includes/photobook/end.html`):
   - Triggered only when `gallery_name` contains `/`.
   - Uses first segment as parent key and shows up to 3 sibling subvoyages.

## Photobook Data Contracts

Required conventions for Photobook mode:

1. Data:
   - `site.data.photo_manifests[<gallery_name with / → _>]`, merged from the R2 manifest and `_data/photos/<gallery_name>.yml` by `npm run photos:fetch`.
   - Place per photo: `_data/photo_locations/<gallery_name>.yml`, else the caption.
2. Images:
   - `https://img.qsdqsb.com/t/<hash>/<width>.<webp|avif|jpg>`, with srcset. No image is read from the repo; `gallery/` and `images/thumbnails/gallery/` are unused and gitignored.
3. Rows:
   - Spread / pair / three rhythm; a portrait never takes a spread. The rule lives in `assets/js/photobook/rows.mjs`, shared by the build and the page's film filter.

Normative requirement when `subgalleries != true`:

- `gallery_name` must be present and known to the photo pipeline (`_data/photos/<name>.yml` or a fetched manifest), with processed photos.
- If `gallery_name` is absent, unknown, or unprocessed, the page renders an empty Photobook ("still on their way") and is contract-invalid.

## Runtime Behavior Contracts (Photobook Mode)

From `assets/js/photobook/` (loaded only on these pages; every frame is plain HTML without it):

1. Input source:
   - The `#photobook-data` JSON block (per-frame lightbox records written at build time).
2. Lightbox keyboard controls:
   - `Left` / `Right`: previous/next frame.
   - `Space` / `S`: slideshow.
   - `I`: specs; `P`: pin specs; `F`: bare print; `Z` (or double-click): loupe.
   - `Esc`: leave the loupe, then bare mode, then close.
3. Touch controls:
   - Swipe left/right for next/previous; swipe up for specs, down to hide them.
4. Film filter:
   - Re-lays the rows with `rows.mjs` for the chosen film.

## Deterministic Scenarios

| Scenario | Inputs | Expected Behavior |
| --- | --- | --- |
| 1. Parent enumerator voyage | `_voyage` page with `subgalleries: true` | Renders subvoyage cards via `archive-single.html`; no Photobook. |
| 2. Direct voyage gallery | `_voyage` page with `gallery_name` and no `subgalleries: true` | Renders the Photobook from the gallery's manifest. |
| 3. Subvoyage gallery page | `_subvoyage` page with `gallery_name: parent/child` | Renders the Photobook plus sibling subvoyage panel (`Other <parent>`), sampled up to 3. |
| 4. Map-enabled gallery layout | `_voyage` page with `subgalleries: true` | Includes map block (auto-derived `voyage-<basename>` dataset) after main content region. |
| 5. Tag block rendering | `site.tag_voyage.type` enabled and `page.tags[0]` present | Renders voyage taxonomy chip list with voyage tag path. |
| 6. Random recommendation rail | Photobook mode | Renders 4 random recommendations; if sampled voyage has `subgalleries: true`, one subvoyage is sampled instead. |
| 7. Missing or unprocessed `gallery_name` in Photobook mode | `subgalleries` false/missing and no `gallery_name`, or no processed manifest | Empty Photobook renders; treat as contract violation. |

## Dependency Surface

Primary behavior dependencies:

- `_layouts/gallery.html`
- `_includes/archive-single.html`
- `_includes/map.html`
- `_includes/photobook.html`, `_includes/photobook/*.html`
- `_sass/_photobook.scss`
- `assets/js/photobook/*`
- `scripts/photos/lib/book.mjs` (via `npm run photos:fetch`)
- `_config.yml` (`collections`, `defaults`, `tag_voyage`)
