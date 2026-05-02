---
name: frontmatter-contract-enforcer
description: Validate Jekyll frontmatter against this site's collection contracts. Use whenever editing or creating markdown in `_posts/`, `_pages/`, `_voyage/`, or `_subvoyage/`, whenever the user mentions adding a post, page, voyage, or subvoyage, and whenever frontmatter keys like `gallery_name`, `map_dataset`, `subgalleries`, or `permalink` are being touched. Catches missing required keys and conditional pairings that break rendering silently.
---

# Frontmatter Contract Enforcer

Jekyll won't refuse to render a page with a missing `header` or a `gallery_name` that points nowhere — it'll just produce an empty shell. That makes frontmatter mistakes invisible in CI and only surface when a reader hits a broken page. This skill catches them at edit time.

## Required keys per collection

| Collection | Required | Strongly expected / conditional |
|---|---|---|
| `_posts` | `title`, `date` | `permalink`, `tags`, `header` |
| `_pages` | `title` | `layout` (non-default), `permalink` (routable), `map_dataset` (map-enabled pages) |
| `_voyage` | `title`, `date`, `header` | exactly one of: `gallery_name` OR `subgalleries: true`; optional `map_dataset` |
| `_subvoyage` | `title`, `date`, `header` | `gallery_name` (typically required for gallery routing) |

## Conditional pairings (these are where things break)

- **`gallery_name: <name>`** must resolve to two real directories:
  - `gallery/<name>/` (full images)
  - `images/thumbnails/gallery/<name>/` (thumbnails — often the missing one)
- **`map_dataset: <name>`** must match `_data/maps/<name>.yml`. If it doesn't, the map block silently renders empty.
- **`subgalleries: true`** puts the page in enumerator mode (card list of children, no image viewer). Parent voyage basename must align with `_subvoyage/<basename>/` so the enumerator can discover children — they're matched by path substring, not by an explicit reference.
- **`tags`** should resolve to entries in `_data/tag_colours.yml`. Missing entries don't break rendering, but the tag will display without its accent colour. Warn and offer to add the mapping.

## Workflow

1. For each touched markdown file, parse frontmatter and identify the collection.
2. Verify required keys are present.
3. For each conditional pairing, check the referenced path or data file actually exists.
4. Flag failures with `file: missing <key>` or `file: <key>=<value> does not resolve to <expected path>`.

## Output

PASS / WARN / FAIL per file. Always include the file path, the offending key, and the concrete remediation (which file to create, which key to add, which existing tag colour to use).
