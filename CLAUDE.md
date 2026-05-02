# CLAUDE.md — QSD's House of Wonders

## What This Is

A heavily customised Jekyll site (forked from Minimal Mistakes / Academic Pages) serving as QSD's personal blog, travel gallery, and portfolio. Hosted on GitHub Pages at `qsdqsb.github.io`.

## Repo Map

```
_config.yml          Jekyll config — collections, defaults, plugins, site vars
_layouts/            Page layouts (10 — see "Layouts & Gallery System" below)
_includes/           50+ partials — masthead, gallery, map, hero, sidebar…
_sass/               SCSS partials — _variables.scss is the token authority
assets/js/           Custom JS (_main.js → main.min.js) + vendor (jQuery, Three.js, Swiper)
_posts/              Blog posts
_pages/              Static pages (about, cv, portfolio…)
_voyage/             Travel voyage collection
_subvoyage/          Nested sub-voyages
_data/               YAML data: navigation, UI text, maps, tag colours, gallery SVGs
gallery/             Full-size gallery images
images/              Site images + thumbnails (images/thumbnails/gallery/…)
scripts/             Build scripts (geocode-maps.js, check-responsive-policy.sh, check-single-use-variables.py) + hooks/
tests/               Node-test files (`node --test tests/*.test.js` via `npm test`)
for_agents/          Prior implementation notes + long-running execution plans (gitignored — local only)
```

## Build & Serve

```bash
# Full build sequence (always in this order)
bundle exec rake generate_thumbnails   # gallery thumbnail preprocessing
npm run geocode                        # map data → geojson cache
bundle exec jekyll build               # site build

# Dev serve
bundle exec jekyll serve

# JS: source is assets/js/_main.js → minified to assets/js/main.min.js
npm run build:js

# Tests
npm test
```

Convenience slash commands: `/build`, `/serve`, `/geocode`, `/responsive-audit`, `/style-check`, `/content-check`, `/js-sync`, `/check-vars`, `/commit`.

**Rule:** Never hand-edit `main.min.js`. Edit `_main.js`, then run `npm run build:js`.

## Commit Style

Every commit message starts with a single emoji, then a concise imperative summary.

| Emoji | Meaning |
|-------|---------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 🎨 | Style/design |
| ♻️ | Refactor |
| 📐 | Rules/config |
| 📘 | Docs |
| 🗑️ | Remove |
| 🔧 | Tooling |
| 🚀 | Performance |

Example: `✨ Add bilingual toggle to masthead`

## Design Philosophy

- **Dark editorial boutique** — near-black surfaces, glass-lite depth cues, generous negative space.
- **Typography:** Didot/Playfair for display headings, Barlow for UI/meta labels.
- **Colour palette:** muted & melancholic — oxblood, antique gold, verdigris, lapis, smoke-violet, ivory. No neon.
- **Motion:** Apple-smooth defaults (short eased transitions). Cinematic only for explicit hero/landing. Always respect `prefers-reduced-motion`.
- **Glassmorphism:** subtle depth cue, not decoration — restrain blur/transparency.

## Responsive Policy

Desktop is the primary baseline; every change must also work at mobile-small. Any *visual* divergence between desktop and mobile-small (different geometry, arrangement, typography, visibility) requires explicit user confirmation before committing.

## Decision Confidence

For material implementation choices (architecture, visual system, token structure): if confidence is below ~90%, present the decision with rationale and tradeoffs and get explicit approval before changing files. The point isn't ceremony — it's catching the cases where you're about to commit a structural decision that the user would have made differently.

---

## SCSS Authoring

### The core rule — variables are for multi-use

`_sass/_variables.scss` is the home for *shared* design decisions: the type scale, the breakpoint scale, the spacing rhythm, the surface tones, the motion timings used across multiple components. **It is not a parking lot for component-specific knobs.**

If a value is used in exactly one selector in one file, **leave it inline at that selector**. Do not preemptively hoist it into `_variables.scss`. Promote on the second use, not the first.

This site has historical drift in the wrong direction — the latter half of `_variables.scss` contains many entries (`$nav-action-sweep-duration`, `$overlay-hero-mobile-aspect-ratio`, `$search-panel-offset-y`, etc.) used in exactly one place. Those are component-specific knobs that should have stayed inline. Don't add to that pile.

### Token families that *are* legitimately shared

Use these, extend them when adding to a scale, but don't fragment them with parallel one-offs:

- **Type scale** — `$type-size-1` through `$type-size-8` (largest to smallest)
- **Breakpoints** — `$small`, `$medium`, `$medium-wide`, `$large`, `$x-large` (rem-based)
- **Sidebar widths** — `$right-sidebar-width-narrow` / `$right-sidebar-width` / `$right-sidebar-width-wide`
- **Motion** — `$global-transition`, `$global-transition-time`, `$cubic-bezier-default`, `$cubic-bezier-smooth`, `$intro-transition`
- **Surfaces & text** — `$primary-color`, `$text-color`, `$border-color`, `$body-color`, `$background-color`
- **Shadows** — `$box-shadow`, `$shadow-soft`, `$shadow-floating`, `$box-shadow-fancy`
- **Radius** — `$border-radius`

When in doubt, grep `_variables.scss` for the value or its near-neighbours before adding anything.

### Authoring rules

1. **Use existing shared scales first.** Raw hex/rgb/hsl, hard-coded shadows, gradients, and timing literals that match an existing scale are a violation — use the scale.
2. **Single-use values stay inline.** Don't invent `$component-foo-bar: 0.42rem` for a one-off. Write the literal at the callsite.
3. **Existing-class-first.** Search for reusable selectors before creating new classes. If you must add one, document why existing selectors were insufficient.
4. **No magic numbers when a scale fits.** If a value is an exact multiple of a token, prefer arithmetic: `$global-transition-time * 2` instead of a new variable.
5. **Dedup before adding any new token** — search `_variables.scss` for values within 5% relative or 0.1rem absolute of what you're considering.
6. **`_sass/vendor/**` is exempt** — third-party code, leave it alone.

### When a *new* variable is justified

All of the following must be true:

- The value is used in **two or more places** today, or extends a global scale already shared across many components.
- The name encodes a design **role**, not a value or a single component's name. `$shadow-soft` good. `$nav-action-sweep-duration` bad.
- A reasonable future change to that design role would propagate sensibly to all callsites.

If any of those fails, the value belongs inline.

### Breakpoints

`_sass/_responsive-policy.scss` owns all breakpoint mixins. Raw `@media`, `@container`, or `@include breakpoint(...)` calls anywhere else are violations — `scripts/check-responsive-policy.sh` enforces this. Use the existing mixin conventions; don't introduce parallel breakpoint systems.

### Cleanup discipline

When removing a deprecated token from `_variables.scss`, you must trace it across **all** of `_sass/**` (not just touched files) and replace every reference before mutation lands. Janitor mistakes always come from incomplete traces.

**Inlining single-use variables back to their callsites is the dominant cleanup task here** and it has no visual delta — it's a structural simplification, not a redesign.

### Visual delta gate

Any cleanup *replacement* that drifts a value by ≥ 20% relative or ≥ 0.25rem absolute counts as a major delta and needs explicit user confirmation before mutation. Pure inlining (no value change) doesn't trigger this gate.

### Mechanical enforcement

`scripts/check-single-use-variables.py` audits `_variables.scss` for variables used in fewer than 2 places. Two modes:

- `--all` — full audit. Used by `/check-vars` and the `scss-auditor` agent.
- `--new-only` — only checks variables newly added in the working tree (vs `git HEAD`). Used by hooks.

Two hooks wire this in automatically:

- **PostToolUse** — when `_variables.scss` is edited, prints `[var-check] …` findings inline. Non-blocking; informational.
- **Stop** — at end-of-turn, exits 2 (forcing the issue back to Claude) if any newly-added variable in this session is single-use.

#### The `// @keep` opt-out

If you genuinely need to scaffold a variable ahead of its second use (e.g. you're building a multi-component feature and adding the token first), mark the definition line with `// @keep`:

```scss
$shared-future-radius: 0.42rem; // @keep — used by upcoming card + tile components
```

The check skips `// @keep` entries. Use sparingly — every `@keep` is a promise that the second callsite is coming.

#### Honest limit

Hooks only fire during Claude Code sessions. To make this true CI enforcement (catching the same mistake regardless of authoring tool), wire `python3 scripts/check-single-use-variables.py --new-only` into `.git/hooks/pre-commit`. The hook design and the pre-commit gate are complementary — the user owns the latter.

---

## Frontmatter Contracts

Enforced on touched files only — no global retrofit of untouched legacy files.

### Required keys per collection

| Collection | Required | Strongly expected / conditional |
|---|---|---|
| `_posts` | `title`, `date` | `permalink`, `tags`, `header` |
| `_pages` | `title` | `layout` (non-default), `permalink` (routable), `map_dataset` (map-enabled pages) |
| `_voyage` | `title`, `date`, `header` | exactly one of: `gallery_name` OR `subgalleries: true`; optional `map_dataset` |
| `_subvoyage` | `title`, `date`, `header` | `gallery_name` (typically required for gallery routing) |

### Conditional pairings (these are where things break)

- **`gallery_name: <name>`** must resolve to two real directories:
  - `gallery/<name>/` (full images)
  - `images/thumbnails/gallery/<name>/` (thumbnails — these don't generate themselves; run `bundle exec rake generate_thumbnails`)
- **`map_dataset: <name>`** must match `_data/maps/<name>.yml`. If it doesn't, the map block silently renders empty.
- **`subgalleries: true`** puts a voyage in enumerator mode. Parent voyage basename must align with `_subvoyage/<basename>/` so the enumerator can discover children — they're matched by path substring, not by an explicit reference.
- **`tags`** should resolve to entries in `_data/tag_colours.yml`. Missing entries don't break rendering, but the tag will display without its accent colour.

### Voyage frontmatter cheatsheet

```yaml
---
title: "Barcelona, Autumn 2024"
date: 2024-10-15
header:
  overlay_image: /images/headers/barcelona.jpg
  overlay_filter: 0.5
  caption: "..."
gallery_name: barcelona-2024     # gallery viewer mode
# OR
subgalleries: true               # enumerator mode
tags:
  - europe
  - spain
map_dataset: barcelona           # optional, must match _data/maps/<name>.yml
---
```

### Sub-voyage placement & nested galleries

Sub-voyages are children of a parent voyage that has `subgalleries: true`. Routing: `/voyage/:path/` (set by `_config.yml`).

The folder structure is the discovery mechanism:

```
_subvoyage/
└── <parent-basename>/
    ├── child-one.md
    ├── child-two.md
    └── ...
```

`<parent-basename>` **must equal** the parent voyage's file basename (e.g. parent file `_voyage/europe-2024.md` → folder `_subvoyage/europe-2024/`).

For nested galleries (`gallery_name: parent/child`):
- **Path resolution** — same as flat `gallery_name`: `gallery/parent/child/` and `images/thumbnails/gallery/parent/child/`.
- **Sibling discovery** for the related-panel works on the first segment. All siblings should live under `_subvoyage/parent/` and use `gallery_name: parent/<sibling>`.
- The related-panel surfaces up to 3 random siblings.

### Common traps

- Adding `gallery_name` but forgetting to run `bundle exec rake generate_thumbnails` → empty grid.
- Sub-voyage placed in `_subvoyage/` root instead of `_subvoyage/<parent>/` → invisible to enumerator.
- Folder name drifts from parent basename (e.g. `_voyage/europe-2024.md` but folder `_subvoyage/europe/`) → invisible to enumerator.
- `gallery_name` first segment doesn't match the parent → siblings won't link to each other.
- Using `map_dataset` without running `npm run geocode` → empty map.

### Scaffolding

When adding a new voyage, the `voyage-scaffolder` agent (under `.claude/agents/`) handles all the dependency cross-checks (tag colours, gallery directory existence, parent linkage).

---

## Layouts & Gallery System

10 layouts. The two with the most behaviour are `gallery.html` and the page hero overlay.

### `gallery.html` — two execution modes

Mutually exclusive. The branch is decided by frontmatter:

| Condition | Mode | What renders |
|---|---|---|
| `page.subgalleries == true` | **Enumerator** | Sub-voyage card list via `_includes/archive-single.html`. No thumbnail grid, no JS viewer. |
| Otherwise (default) | **Gallery viewer** | Thumbnail grid + fullscreen JS viewer (`assets/js/gallery.js`). |

Enumerator children are discovered by path-substring match on the parent voyage basename — see "Frontmatter Contracts" above for the alignment rules.

Gallery viewer asset contracts:
- Full images: `gallery/<gallery_name>/<file>`
- Thumbnails: `images/thumbnails/gallery/<gallery_name>/<file>`
- Filenames must match between the two directories.

Map block (`_includes/map.html`) is included after main content when `map_dataset` is set.

Gallery viewer keyboard: Backspace=parent, Shift=cover/contain toggle, Esc=fullscreen, arrows=navigate.

### Page hero overlay (`_includes/page__hero.html`)

Active when `has-overlay-hero` is on the body (set from page overlay/swiper conditions). Two render paths:

- **Swiper path** — `div.swiper.page-overlay-swiper.page-overlay-swiper--hero` with slide-level `.page__hero--overlay.page__hero--overlay-home`.
- **Non-swiper path** — `.page__hero--overlay` with the same core copy/media shell.

Both paths share spacing rhythm and title/excerpt hierarchy. **Maintaining parity is intentional** — divergence between them is a regression unless explicitly approved.

Excerpt reveal / opening scene is runtime-driven by `assets/js/overlay-opening-scene.js`, which:
- Toggles `overlay-opening-*` body classes.
- Emits the `qsd:overlay-opening` event with `start`, `finish`, `cancel` phases.
- `assets/js/masthead-intent.js` listens to that event and adjusts nav visibility/lock.

Reduced-motion users (`prefers-reduced-motion`) bypass the animated opening flow.

### Other layouts

- `default.html` — base wrapper (masthead, search, scripts).
- `single.html` — post/page view with sidebar + TOC.
- `splash.html` — hero/landing.
- `archive.html`, `archive-taxonomy.html` — tag/category archives.
- `talk.html`, `search.html`, `multiverse.html`, `compress.html` — specialised.

### When editing layouts

1. Layout/include changes that affect visible structure trigger the `responsive-layout-auditor` skill — validate desktop *and* mobile-small.
2. Style changes embedded in layouts must still respect the SCSS authoring rules above.
3. Cross-check `_data/navigation.yml` and `_data/tag_colours.yml` if the layout consumes them — drift between layout assumptions and data shape silently breaks rendering.

---

## Prior Art

Before scaffolding new work in domains where the site already has a system (maps, voyages, design tokens, motion, governance), check:

- `for_agents/IMPLEMENTATIONS/` — tiny notes on completed functionality batches.
- `for_agents/PROJECT_TRACKER.md` and similar — long-running execution plans.
- `for_agents/MAP_SETUP_GUIDE.md` and other domain guides.

These capture decisions and constraints that aren't recoverable from `git log` alone. Note: `for_agents/` is gitignored — it's a local-only scratch space, so a fresh clone won't have it.
