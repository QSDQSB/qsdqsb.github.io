# Data Integrity Rules

Defines cross-file consistency constraints for map/gallery/taxonomy data.

## Map Pipeline Integrity

Two concurrent sources, both funnelled into the same renderer:

| Source | Trigger | Cache target |
|---|---|---|
| Global atlas | Always | `assets/maps/voyage-atlas.geojson` |
| Per-parent atlas (auto-derived from sub-voyages) | `_voyage/<slug>.md` has `subgalleries: true` | `assets/maps/voyage-<slug>.geojson` |

The old hand-curated `_data/maps/*.yml` → arbitrary-named-dataset pipeline is retired (directory doesn't exist; `geocode-maps.js` no longer generates from it). `page.map_dataset` frontmatter still works as a direct pointer to one of the two generated ids above — the only live user is `_portfolio/voyage.html` (`map_dataset: voyage-atlas`), included outside the voyage/gallery flow entirely. Flag any `map_dataset` value that isn't `voyage-atlas` or an existing `voyage-<slug>` — nothing generates other names.

Include/runtime contract: `_includes/map.html` (accepts `include.dataset`, preferred, or falls back to `page.map_dataset`) + `assets/js/map.js`. Leaflet/map.js gating lives in `_includes/head/custom.html` and must match `page.subgalleries OR page.map_dataset`.

Rules:
- Every `_voyage/<slug>.md` with `subgalleries: true` must produce a corresponding `assets/maps/voyage-<slug>.geojson` after preprocess.
- Optional `map:` block on a parent voyage (only meaningful with `subgalleries: true`) must be shaped as `{ center: [lat, lng], zoom, minZoom, maxZoom }`. Embedded by the geocoder into the derived FeatureCollection's `properties.viewport` and applied by the renderer ahead of the fitBounds fallback.
- Optional `map:` block on a sub-voyage refines its marker: `{ lat, lng }` (explicit), `{ query }` (Nominatim override), or `{ exclude: true }` (skip).

## Gallery Integrity

Rules:
- `gallery_name` values must resolve to expected `gallery/<gallery_name>/` structure.
- Thumbnail structure should match `images/thumbnails/gallery/<gallery_name>/` expectations.
- Parent/subgallery links should not produce orphaned references.

## Taxonomy Color Integrity

Rules:
- Active `tags` in touched voyage/post files should map to `_data/tag_colours.yml` where applicable.
- Missing color mappings should emit actionable findings.

## Related Checks

- `DATA-001` map dataset-to-cache consistency (both sources)
- `DATA-002` gallery_name path consistency
- `DATA-003` tag-to-color mapping consistency
- `DATA-004` parent voyage / sub-voyage coords alignment (geocodable title or explicit `map:`)
