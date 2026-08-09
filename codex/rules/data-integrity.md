# Data Integrity Rules

Defines cross-file consistency constraints for map/gallery/taxonomy data.

## Map Pipeline Integrity

Three concurrent sources, all funnelled into the same renderer:

| Source | Trigger | Cache target |
|---|---|---|
| Global atlas | Always | `assets/maps/voyage-atlas.geojson` |
| Per-parent atlas (auto-derived from sub-voyages) | `_voyage/<slug>.md` has `subgalleries: true` | `assets/maps/voyage-<slug>.geojson` |
| Explicit override | A page sets `map_dataset: <name>` directly (e.g. `_portfolio/voyage.html` sets `map_dataset: voyage-atlas` to render the global atlas) | `assets/maps/<name>.geojson` — must already be one of the two rows above; there is no separate YAML-backed generator for arbitrary names |

Include/runtime contract: `_includes/map.html` (accepts `include.dataset` or falls back to `page.map_dataset`) + `assets/js/map.js`. Leaflet/map.js gating lives in `_includes/head/custom.html` and must match `page.subgalleries OR page.map_dataset`.

Rules:
- Each referenced `map_dataset` must map to an existing `assets/maps/<name>.geojson` (produced by `scripts/geocode-maps.js`, not hand-authored).
- Every `_voyage/<slug>.md` with `subgalleries: true` must produce a corresponding `assets/maps/voyage-<slug>.geojson` after preprocess.
- Optional `map:` block on a parent voyage (only meaningful with `subgalleries: true`) must be shaped as `{ center: [lat, lng], zoom, minZoom, maxZoom }`. Embedded by the geocoder into the derived FeatureCollection's `properties.viewport` and applied by the renderer ahead of the fitBounds fallback.
- Optional `map:` block on a sub-voyage refines its marker: `{ lat, lng }` (explicit), `{ query }` (Nominatim override), or `{ exclude: true }` (skip).
- Flag any voyage with both `subgalleries: true` AND `map_dataset:` — `page.map_dataset` wins via Liquid `default:`, almost certainly unintended.
- Marker/tag colors for atlas features should resolve via `_data/tag_colours.yml`, same as everywhere else on the site.

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

- `DATA-001` map dataset-to-cache consistency (all three sources)
- `DATA-002` gallery_name path consistency
- `DATA-003` tag-to-color mapping consistency
- `DATA-004` parent voyage / sub-voyage coords alignment (geocodable title or explicit `map:`)
