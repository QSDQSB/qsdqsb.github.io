# Voyage/Subvoyage Gallery Behavior

Canonical instruction for how `_voyage`, `_subvoyage`, and `_layouts/gallery.html` determine page behavior.

## Purpose

Define deterministic behavior contracts for gallery-backed voyage content without changing runtime logic.

## Execution Model

The `gallery` layout has two mutually exclusive branches:

1. Enumerator mode:
   - Condition: `page.subgalleries == true`
   - Outcome: render a subvoyage card list (via `archive-single.html`) instead of image thumbnails/viewer.
2. Gallery viewer mode:
   - Condition: all other cases (`page.subgalleries` missing/false)
   - Outcome: render image thumbnail grid + fullscreen viewer runtime (`assets/js/gallery.js`).

## Parameter-To-Behavior Matrix

| Parameter | Location | Required | Behavior |
| --- | --- | --- | --- |
| `subgalleries` | `_voyage` frontmatter (default false in `_config.yml`) | Conditional | `true` selects enumerator mode and disables gallery thumbnail/viewer rendering for that page. |
| `gallery_name` | `_voyage` or `_subvoyage` frontmatter | Required for gallery viewer mode | Used to resolve `gallery/<gallery_name>/` and `images/thumbnails/gallery/<gallery_name>/` assets. |
| `map_dataset` | `_voyage`/`_subvoyage` frontmatter | Optional | If present, includes `_includes/map.html` map block on gallery-layout pages. |
| `tags` | frontmatter | Optional but recommended | If `site.tag_voyage.type` and first tag exist, renders voyage tag taxonomy block. |
| `title` | frontmatter | Required | Shown in page header; also used by random-anchor include (`slugify(title)` for in-page anchors). |
| `subtitle` | frontmatter | Optional | Displayed under title in gallery viewer header when set. |
| `description` / `excerpt` | frontmatter | Optional (one recommended) | Gallery viewer header paragraph prefers `description`, then falls back to `excerpt`. |
| `header.overlay_*` | frontmatter | Optional but expected for visual consistency | Controls hero/cover display when applicable in layout flow. |
| `collections`, `defaults` | `_config.yml` | Required site config | Set default `layout: gallery` for `voyage`/`subvoyage` and default `subgalleries: false` for voyage. |
| `subvoyage permalink` | `_config.yml` | Required site config | `subvoyage` routes under `/voyage/:path/`. |
| `gallery_d` | `_config.yml` | Required site config | Base gallery URL prefix used in thumbnail/full image links (default `"/gallery"`). |
| `tag_voyage` | `_config.yml` | Required for voyage tag archive rendering | Enables voyage taxonomy URL generation. |
| `image: true` path scope | `_config.yml` defaults for `path: "gallery"` | Required | Marks files under `gallery/` as image static files for selection. |
| `thumbnail_position` | site config (`site.thumbnail_position`) | Optional | Passed to thumbnail `data-position`; runtime falls back to `"center"` if unset. |

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
4. Subvoyage related-panel contract (gallery viewer mode):
   - Triggered only when `gallery_name` contains `/`.
   - Uses first segment as parent key and shows up to 3 sibling subvoyages.

## Gallery Asset Contracts

Required conventions for gallery viewer mode:

1. Full images:
   - `gallery/<gallery_name>/<filename>`
2. Thumbnails:
   - `images/thumbnails/gallery/<gallery_name>/<filename>`
3. Rendering references:
   - Full image href/src use `{{ site.gallery_d }}/{{ page.gallery_name }}/{{ image.name }}`
   - Thumbnail placeholder uses `/images/thumbnails/gallery/{{ page.gallery_name }}/{{ image.name }}`

Normative requirement when `subgalleries != true`:

- `gallery_name` must be present and resolvable.
- If `gallery_name` is absent or unresolved, the page still renders the gallery shell but has no valid thumbnail/image set and is contract-invalid.

## Runtime Behavior Contracts (Gallery Viewer Mode)

From `assets/js/gallery.js`:

1. Input source:
   - Builds slides from `#thumbnails .thumbnail`.
2. Keyboard controls:
   - `Backspace`: parent directory navigation.
   - `Shift`: toggle image display (`cover` / `contain`) and persist in cookie.
   - `Esc`: toggle gallery rail (fullscreen mode).
   - `Up` / `Down`: move by row.
   - `Left` / `Right` / `Space`: previous/next slide.
3. Touch controls:
   - Swipe on viewer for next/previous.
   - Swipe on main rail to hide based on configured side.
4. Thumbnail lazy-loading:
   - Uses `IntersectionObserver` with `rootMargin: 50px 0px`, `threshold: 0.01`.
   - Prefers `data-thumbnail`; falls back to `data-src`.
5. Caption behavior:
   - Temporarily highlights image caption/title after slide activation (`captionDuration`).

## Deterministic Scenarios

| Scenario | Inputs | Expected Behavior |
| --- | --- | --- |
| 1. Parent enumerator voyage | `_voyage` page with `subgalleries: true` | Renders subvoyage cards via `archive-single.html`; no thumbnail viewer section. |
| 2. Direct voyage gallery | `_voyage` page with `gallery_name` and no `subgalleries: true` | Renders thumbnail grid + viewer runtime with gallery images/thumbnails. |
| 3. Subvoyage gallery page | `_subvoyage` page with `gallery_name: parent/child` | Renders gallery viewer plus sibling subvoyage panel (`Other <parent>`), sampled up to 3. |
| 4. Map-enabled gallery layout | Any gallery-layout page with `map_dataset` | Includes map block after main content region. |
| 5. Tag block rendering | `site.tag_voyage.type` enabled and `page.tags[0]` present | Renders voyage taxonomy chip list with voyage tag path. |
| 6. Random recommendation rail | Gallery viewer mode | Renders 4 random recommendations; if sampled voyage has `subgalleries: true`, one subvoyage is sampled instead. |
| 7. Missing `gallery_name` in viewer mode | `subgalleries` false/missing and no `gallery_name` | Gallery shell renders but thumbnail/image population is empty; treat as contract violation. |
| 8. Unset `thumbnail_position` | `site.thumbnail_position` undefined | Slide background-position defaults to `"center"` in runtime. |

## Dependency Surface

Primary behavior dependencies:

- `_layouts/gallery.html`
- `_includes/archive-single.html`
- `_includes/map.html`
- `assets/js/gallery.js`
- `_config.yml` (`collections`, `defaults`, `gallery_d`, `tag_voyage`)
