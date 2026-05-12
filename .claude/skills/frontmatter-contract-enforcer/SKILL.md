---
name: frontmatter-contract-enforcer
description: Validate Jekyll frontmatter against this site's collection contracts. Use whenever editing or creating markdown in `_posts/`, `_pages/`, `_voyage/`, or `_subvoyage/`, whenever the user mentions adding a post, page, voyage, or subvoyage, and whenever frontmatter keys like `gallery_name`, `map_dataset`, `subgalleries`, `map`, or `permalink` are being touched. Catches missing required keys and conditional pairings that break rendering silently.
---

# Frontmatter Contract Enforcer

Jekyll won't refuse to render a page with a missing `header` or a `gallery_name` that points nowhere — it'll just produce an empty shell. That makes frontmatter mistakes invisible in CI and only surface when a reader hits a broken page. This skill catches them at edit time.

## Required keys per collection

| Collection | Required | Strongly expected / conditional |
|---|---|---|
| `_posts` | `title`, `date` | `permalink`, `tags`, `header` |
| `_pages` | `title` | `layout` (non-default), `permalink` (routable), `map_dataset` (manual-YAML map pages) |
| `_voyage` | `title`, `date`, `header` | exactly one of: `gallery_name` OR `subgalleries: true`; optional `map:` viewport (only with `subgalleries:true`); `map_dataset:` only as a legacy escape hatch |
| `_subvoyage` | `title`, `date`, `header` | `gallery_name` (typically required for gallery routing); optional `map:` block to pin / refine the parent's auto-derived map marker |

## Conditional pairings (these are where things break)

- **`gallery_name: <name>`** must resolve to two real directories:
  - `gallery/<name>/` (full images)
  - `images/thumbnails/gallery/<name>/` (thumbnails — often the missing one)
- **`subgalleries: true`** does two things:
  1. Puts the voyage in enumerator mode (sub-voyage card list, no image viewer). Parent voyage basename must align with `_subvoyage/<basename>/` so the enumerator can discover children — matched by path substring.
  2. Auto-derives an atlas-style map at `assets/maps/voyage-<basename>.geojson`, one feature per child of `_subvoyage/<basename>/*.md`. No `map_dataset:` needed.
- **`map:` on a parent voyage with `subgalleries:true`** — optional viewport override:
  ```yaml
  map:
    center: [<lat>, <lng>]
    zoom: 13
    minZoom: 6
    maxZoom: 20
  ```
  Without it, the renderer fitBounds to the children's coordinates. Flag a `map:` block on a parent voyage WITHOUT `subgalleries:true` (legacy YAML `viewport:` shape leaking in, won't be honoured).
- **`map:` on a sub-voyage** — optional, all keys optional:
  - `map: { lat, lng }` — explicit coords (skip geocoding)
  - `map: { query: "..." }` — override the title-based geocode query
  - `map: { exclude: true }` — omit this child from the parent's map
  - Default when nothing is set: geocode by `"<sub-voyage title>, <parent voyage title>"`. Atmospheric titles (Portraits, Twilight, Flow, Streetscape…) typically fail to geocode and are gracefully skipped with a build warning. Suggest adding `map:` if the file is silently absent from the map.
- **`map_dataset: <name>`** — legacy hand-curated path. Must match `_data/maps/<name>.yml`. Only use for voyages without `subgalleries:true` that need a manual marker list. Flag any voyage with BOTH `subgalleries:true` AND `map_dataset:` — the dataset wins via Liquid `default:` precedence in the layout, but that's almost never intended; the parent should use the auto-derive instead.
- **`tags`** should resolve to entries in `_data/tag_colours.yml`. Missing entries don't break rendering, but the tag will display without its accent colour. Warn and offer to add the mapping.

## Workflow

1. For each touched markdown file, parse frontmatter and identify the collection.
2. Verify required keys are present.
3. For each conditional pairing, check the referenced path or data file actually exists. For `map:` blocks, validate shape (`center` is `[lat, lng]`, numeric `zoom`/`minZoom`/`maxZoom`, `lat`+`lng` always together).
4. Flag failures with `file: missing <key>` or `file: <key>=<value> does not resolve to <expected path>`.

## Output

PASS / WARN / FAIL per file. Always include the file path, the offending key, and the concrete remediation (which file to create, which key to add, which existing tag colour to use).
