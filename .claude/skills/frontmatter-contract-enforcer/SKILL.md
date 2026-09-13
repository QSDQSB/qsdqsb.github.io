---
name: frontmatter-contract-enforcer
description: Validate Jekyll frontmatter against this site's collection contracts. Use whenever editing or creating markdown in `_posts/`, `_pages/`, `_voyage/`, or `_subvoyage/`, whenever the user mentions adding a post, page, voyage, or subvoyage, and whenever frontmatter keys like `gallery_name`, `subgalleries`, `map`, or `permalink` are being touched. Catches missing required keys and conditional pairings that break rendering silently.
---

# Frontmatter Contract Enforcer

Jekyll won't refuse to render a page with a missing `header` or a `gallery_name` that points nowhere — it'll just produce an empty shell. That makes frontmatter mistakes invisible in CI and only surface when a reader hits a broken page. This skill catches them at edit time.

## Required keys per collection

| Collection | Required | Strongly expected / conditional |
|---|---|---|
| `_posts` | `title`, `date` | `permalink`, `tags`, `header` |
| `_pages` | `title` | `layout` (non-default), `permalink` (routable) |
| `_voyage` | `title`, `date`, `header` | exactly one of: `gallery_name` OR `subgalleries: true`; optional `map:` viewport (only with `subgalleries:true`) |
| `_subvoyage` | `title`, `date`, `header` | `gallery_name` (typically required for gallery routing); optional `map:` block to pin / refine the parent's auto-derived map marker |

## Routing & placement

Voyages and sub-voyages both route as `/voyage/:path/` (set in `_config.yml`).

Sub-voyages are children of a parent voyage that has `subgalleries: true`, and
the folder structure *is* the discovery mechanism:

```
_subvoyage/
└── <parent-basename>/      # MUST equal the parent voyage's file basename
    ├── child-one.md        # _voyage/europe-2024.md → _subvoyage/europe-2024/
    └── child-two.md
```

Two placement failures, both silent:

- Sub-voyage left in `_subvoyage/` **root** instead of `_subvoyage/<parent>/` →
  invisible to the enumerator AND missing from the parent's auto-derived map.
- Folder name drifts from the parent basename (`_voyage/europe-2024.md` but
  `_subvoyage/europe/`) → invisible to the enumerator.

For nested galleries (`gallery_name: parent/child`), sibling discovery for the
related-panel works on the **first segment** — all siblings must live under
`_subvoyage/parent/` and use `gallery_name: parent/<sibling>`. The panel
surfaces up to 3 random siblings.

## Conditional pairings (these are where things break)

- **`gallery_name: <name>`** must resolve to two real directories:
  - `gallery/<name>/` (full images)
  - `images/thumbnails/gallery/<name>/` (thumbnails — often the missing one)
- **`subgalleries: true`** does two things:
  1. Puts the voyage in enumerator mode (sub-voyage card list, no image viewer). Parent voyage basename must align with `_subvoyage/<basename>/` so the enumerator can discover children — matched by path substring.
  2. Auto-derives an atlas-style map at `assets/maps/voyage-<basename>.geojson`, one feature per child of `_subvoyage/<basename>/*.md`.
- **`map:` on a parent voyage with `subgalleries:true`** — optional viewport override:
  ```yaml
  map:
    center: [<lat>, <lng>]
    zoom: 13
    minZoom: 6
    maxZoom: 20
  ```
  Without it, the renderer fitBounds to the children's coordinates.

  **A voyage-level `map:` block has two independent roles — don't conflate them:**
  - `lat`/`lng`/`query` → where this voyage sits on the **global atlas**. Read by `resolveVoyageCoords()` in `scripts/geocode-maps.js` for *any* voyage, with or without `subgalleries`. Perfectly valid on a plain gallery voyage.
  - `center`/`zoom`/`minZoom`/`maxZoom` → the **viewport of this voyage's own map**. Only a `subgalleries:true` voyage renders one, so these keys are inert elsewhere (warn, don't error).

  `map.lat` and `map.lng` must always appear together — `geocode-maps.js` throws otherwise.
- **`map:` on a sub-voyage** — optional, all keys optional:
  - `map: { lat, lng }` — explicit coords (skip geocoding)
  - `map: { query: "..." }` — override the title-based geocode query
  - `map: { exclude: true }` — omit this child from the parent's map
  - Default when nothing is set: geocode by `"<sub-voyage title>, <parent voyage title>"`. Atmospheric titles (Portraits, Twilight, Flow, Streetscape…) typically fail to geocode and are gracefully skipped with a build warning. Suggest adding `map:` if the file is silently absent from the map.
- **`tags`** should resolve to entries in `_data/tag_colours.yml`. Missing entries don't break rendering, but the tag will display without its accent colour. Warn and offer to add the mapping.

The old hand-curated `_data/maps/*.yml` pipeline is retired (the directory doesn't exist) — don't validate `map_dataset` against it. Within these four collections `map_dataset` is a no-op today (no `_posts`/`_pages`/`_voyage`/`_subvoyage` file sets it, and `_layouts/gallery.html` no longer honours an override even on a `subgalleries:true` voyage) — flag it if you see it here. It does still work outside this skill's scope: `_portfolio/voyage.html` uses `map_dataset: voyage-atlas` directly to load the global atlas.

## `seo_description` — search metadata, never displayed (all collections)

Optional cross-collection key. It feeds **only** the `<meta name="description">`
tag (`_includes/seo.html`) that search engines read for result snippets. No
layout renders it, so it is deliberately decoupled from the page's visible copy.

- **Why it exists:** `excerpt` / `description` are the site's *display* voice —
  poetic, atmospheric, often oblique ("Where whispers dance on liquid streets").
  That reads well on the page but tells Google nothing about *what the page is*.
  `seo_description` carries the plain, content-descriptive summary instead.
- **Voice:** factual and concrete, ~150–160 chars, no QSD irony. Name the actual
  subject so specific long-tail queries can match — real place names for voyages
  ("Seceda, Alpe di Siusi"), the actual theme for essays ("memory, impermanence
  and the self"). This is the one place on the site that is intentionally
  *un*-stylised, and it is exempt from the `house-style` prose lexicon.
- **Fallback chain** for `<meta name="description">`:
  1. hand-written `seo_description` (richest; use it wherever the templated line
     below is too thin — essays especially, since a template can't summarise
     prose).
  2. **templated fallback for `_voyage` / `_subvoyage` only** — one place per
     gallery, so a plain `"<place> — travel photography by QSD"` is descriptive
     and unique. Subvoyages fold in the parent voyage's real title
     (`"<sub>, <parent> — travel photography by QSD"`). Every voyage/subvoyage
     is covered without hand-writing.
  3. `description` → `excerpt` → `site.description` (the poetic display copy),
     for everything else — posts and pages get **no** template, so hand-write
     `seo_description` for any essay you want discoverable.
- **Social cards are separate:** `og:description` / `twitter:description` keep
  using the poetic `description` / `excerpt`, so shares stay evocative. Only the
  search-engine `<meta name="description">` prefers `seo_description`.
- **Don't** write one for a stub / `#TODO` page — a meta description must
  accurately describe content that actually exists.
- **Coverage audit:** `npm run check:seo` classifies every page by which source
  its description comes from — `authored`, `template`, `display` (weak), `gap`,
  or `stub`. Exit 1 on any `gap`; `--strict` also fails on `display`-only pages.

## Workflow — run the checker, don't hand-verify

Every rule above is deterministic, so it is enforced by code rather than by
reading carefully. **Run the script first; your job is interpretation and
remediation, not detection.**

```bash
node scripts/check-frontmatter.js              # all collections
node scripts/check-frontmatter.js --changed    # only files changed vs HEAD
node scripts/check-frontmatter.js <path>...    # specific files
node scripts/check-frontmatter.js --json       # machine-readable
```

`npm run check:frontmatter` is the same thing. Exit 1 on any error; warnings
exit 0.

**error** = the page is broken or renders empty. **warn** = it renders, but
degraded (missing thumbnails, an uncoloured tag, a missing date).

Then, for each finding:

1. Read the offending file and confirm the finding is real. If the script is
   wrong, **fix the script** — a false positive in a validator is worse than a
   missed one, because it teaches everyone to ignore the output.
2. Apply the concrete remediation: which file to create, which key to add,
   which existing tag colour to use.
3. Re-run to confirm clean.

For set-level questions — orphaned gallery directories, thumbnail/filename
parity — use `node scripts/check-gallery-integrity.js` and the
`gallery-integrity-audit` skill.

## Output

Report per file with path, offending key, and concrete remediation. Never
report a PASS you did not get from the script.
