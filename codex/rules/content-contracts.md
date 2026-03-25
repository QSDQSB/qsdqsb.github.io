# Content Contracts

Defines frontmatter and behavior contracts for touched files.

## Enforcement Mode

- Strict on touched files.
- Legacy untouched files are not globally retrofitted by default.

## Collection Contracts

### `_posts`
Required keys:
- `title`
- `date`

Strongly expected keys:
- `permalink`
- `tags`
- `header`

Defaults are provided by `_config.yml` (`layout: single`, `toc`, `related`, etc.).

### `_pages`
Required keys:
- `title`

Conditional keys:
- `layout` for non-default pages
- `permalink` for routable pages
- `map_dataset` if page includes map module

### `_voyage`
Required keys:
- `title`
- `date`
- `header`

At least one of:
- `gallery_name` (gallery-backed voyage)
- `subgalleries: true` (subvoyage enumerator mode)

Optional map linkage:
- `map_dataset`

### `_subvoyage`
Required keys:
- `title`
- `date`
- `header`

Typically required for gallery routing:
- `gallery_name`

## Map/Gallery-Specific Contracts

- If `map_dataset` exists, the page must be render-compatible with map include usage.
- If `gallery_name` exists, it must resolve to gallery and thumbnail path conventions.
- If `subgalleries: true`, parent/sub-collection relation must resolve cleanly.

## Related Checks

- `CT-001` required frontmatter keys
- `CT-002` conditional key compatibility
- `CT-003` map/galleries contract consistency
