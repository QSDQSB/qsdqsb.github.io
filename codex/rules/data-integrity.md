# Data Integrity Rules

Defines cross-file consistency constraints for map/gallery/taxonomy data.

## Map Pipeline Integrity

- Dataset source: `_data/maps/*.yml`
- Generated cache target: `assets/maps/*.geojson`
- Include/runtime contract: `_includes/map.html` + `assets/js/map.js`

Rules:
- Each referenced `map_dataset` must map to an existing data file.
- Generated cache should exist after preprocess for touched datasets.
- Dataset categories should resolve to valid marker color values.

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

- `DATA-001` map dataset-to-cache consistency
- `DATA-002` gallery_name path consistency
- `DATA-003` tag-to-color mapping consistency
