# Build & Serve

Reference for the build pipeline. Linked from CLAUDE.md; `package.json` is the
source of truth for the scripts themselves — this file explains *why* each one
exists and when to reach for it.

## Commands

```bash
# Canonical local flow — both run the full pipeline:
#   1. npm run photos:fetch       (R2 manifests + _data/photos/*.yml → _data/photo_manifests/)
#   2. npm run geocode            (map data → geojson cache)
#   3. jekyll build/serve         (with RUBYOPT=-E utf-8:utf-8)
npm run build
npm run serve

# Kept as aliases. Since the gallery pipeline left, they run the same steps
# as build/serve; photos:fetch is one HTTP pass and never fails a build.
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
npm run check:important           # !important count vs HEAD (ratchet, the stylesheet uses none); `--list`
npm run check:frontmatter         # collection contracts; gallery_name must be known to the photo pipeline
npm run check:gallery             # every gallery_name has a processed manifest; orphans under photos/
python3 scripts/check-single-use-variables.py --all
```

Most of these also run automatically via hooks — see the Guards section in
CLAUDE.md.

## Visual regression

```bash
npm run visual:build        # seeded Jekyll build of _site/ (see below)
npm run visual:capture      # (re)write tests/visual/baseline/*.png
npm run visual:diff         # render again, pixel-diff, exit 1 on any delta
npm run visual:audit        # under motion-off, nothing may still animate
```

`scripts/visual-baseline.mjs` shoots a fixed page set (home, a TOC post, the
Jianfei treatise, a bilingual post, a post with `{: .notice}` paragraphs,
`/voyage/`, `/voyage/prague/`, `/voyage-by-tags/`, about, portfolio, 404,
and the search overlay) at 1440×900 and 390×844, full page,
with `?motion=off` so animations land on their final frame; the motion-heavy
pages are shot a second time with the OS reduced-motion preference on. Map
tiles are blanked before the shot — they come from the network and would
drift the diff. Baselines are committed; `current/` and `diff/` are
gitignored. Runs against the pre-installed Chromium (`CHROMIUM_PATH`
overrides). Re-capture only after a change that is *meant* to be visible,
and commit the new PNGs with it.

Use `visual:build`, not `build:fast`, before a diff: several layouts pick
content with Liquid's `sample` (the QSD logo, related and random posts, the
word card), so an ordinary build never matches the previous one.
`visual:build` seeds Ruby's PRNG first.

`visual:audit` is the behavioural half. It loads every page under motion-off
and lists each element whose computed style still carries a running
animation or a live transition; the list must be empty. That is the
guarantee the motion kill switches used to make with `!important`: the
universal `html.motion-off *` floor is (0,1,1), and any motion rule written
with more specificity owns a `html.motion-off` counterpart beside it in its
component file. Add one, run the audit.

## Rake shim

`bundle exec rake build` and `bundle exec rake serve` still work — they
delegate to the corresponding `npm run …` scripts (compatibility shim in
`Rakefile`). The old `generate_thumbnails` task is gone. New code / docs
should call `npm run` directly.

## Photographs are not in the repo

Photographs live in R2 and reach the page from `img.qsdqsb.com`. The build
only fetches their manifests (`npm run photos:fetch`) and merges them with the
committed captions; the Photobook's rows, cover, colophon and per-photo layer
are worked out at that step by `scripts/photos/lib/book.mjs`. The sitemap's
image entries come from the same manifests (the 1920 px JPEG, titled with the
place). The old `gallery/` tree is retired and no thumbnails are generated;
`gallery/`, `images/thumbnails/gallery/` and `_data/gallery_meta/` stay in
`.gitignore` so a stale copy never comes back. → `_docs/photos-pipeline.md`.

## Slash commands

`/build`, `/serve`, `/geocode`, `/responsive-audit`, `/style-check`,
`/content-check`, `/js-sync`, `/check-vars`, `/house-style`, `/commit`.

## Ruby on Cloudflare

`.ruby-version` names **3.4.4**, the Ruby that Cloudflare Pages' v3 build image carries ready-made.
Naming any other version makes every deploy compile it from source (about three minutes). Ruby 3.4
no longer ships `csv`, `base64`, `bigdecimal`, `logger` and `ostruct` as default gems, so the
Gemfile names them. When Cloudflare moves its default, move `.ruby-version` with it.
