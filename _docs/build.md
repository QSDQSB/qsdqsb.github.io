# Build & Serve

Reference for the build pipeline. Linked from CLAUDE.md; `package.json` is the
source of truth for the scripts themselves — this file explains *why* each one
exists and when to reach for it.

## Commands

```bash
# Canonical local flow — both run the full pipeline:
#   1. npm run generate:gallery   (Sharp: 1×/2× JPEG + WebP + LQIP)
#   2. npm run geocode            (map data → geojson cache)
#   3. jekyll build/serve         (with RUBYOPT=-E utf-8:utf-8)
npm run build
npm run serve

# Faster iteration — generates only LQIPs + meta YAML, skips JPEG/WebP/2×.
# Useful when you don't need the full image-format matrix locally.
npm run generate:gallery:lqip

# Skip the gallery pipeline entirely — for CSS/HTML/JS iteration when
# `gallery/**` hasn't changed. Still runs `geocode` + jekyll. The thumbnail
# generator is also incremental: warm runs over an unchanged gallery tree
# finish in < 1 s (per-image work skipped when meta YAML is fresher than
# the source), so plain `npm run serve` is also cheap on warm trees.
npm run serve:fast
npm run build:fast

# JS: source is assets/js/_main.js → minified to assets/js/main.min.js
npm run build:js

# Hero depth maps (Lontananza parallax) — AUTHORING-TIME, run locally when a
# hero overlay_image is added/changed, then COMMIT the outputs. Scans
# frontmatter for header.overlay_image and writes one neural depth map per
# image to images/depth/<mirrored-path>.depth.jpg (~25 KB each, tracked in
# git). CI never runs the model; visitors download only the finished JPEG.
# Incremental (mtime); --only <substring> filters; --force regenerates.
npm run generate:depth

# Tests
npm test
```

## Checks

```bash
npm run check:responsive-policy   # raw @media / breakpoint usage outside _responsive-policy.scss
npm run check:seo                 # meta-description coverage per page
npm run check:house-style         # generic-AI register in prose + code
npm run check:js-sync             # main.min.js rebuilt from its sources?
npm run check:important           # !important count vs HEAD (ratchet)
python3 scripts/check-single-use-variables.py --all
```

Most of these also run automatically via hooks — see the Guards section in
CLAUDE.md.

## Rake shim

`bundle exec rake generate_thumbnails`, `bundle exec rake build`, and
`bundle exec rake serve` all still work — they delegate to the corresponding
`npm run …` scripts (compatibility shim in `Rakefile`). New code / docs should
call `npm run` directly.

## Thumbnails are not tracked

Every variant (1×/2× JPEG, 1×/2× WebP) plus per-image LQIP + dimensions YAML is
produced from `gallery/**` by `scripts/generate-gallery-assets.mjs` and
gitignored.

The hosting build (Cloudflare Pages) regenerates the full set on every deploy,
running the generator before `jekyll build`. Locally the same script runs as a
prerequisite of `npm run build|serve`; subsequent local runs are near-instant
due to mtime checks.

AVIF is intentionally skipped — see the script header for rationale.

## Slash commands

`/build`, `/serve`, `/geocode`, `/responsive-audit`, `/style-check`,
`/content-check`, `/js-sync`, `/check-vars`, `/house-style`, `/commit`.
