# 0003 · How the stylesheets and scripts are organised

**Status:** Accepted 2026-10-01 under delegation. Everything here is tier 0: no reader sees a
difference, and the pixel diff must stay clean at every step. The bundle split is **deferred**.
**Answers:** A01, A04, A05, C11, S17 in the [2026-10-01 audit](../findings/2026-10-01-ui-audit.md).

## Context

`assets/css/main.scss` imports 37 partials in the order they were written. One stylesheet, 288 KB
(47 KB compressed), blocks rendering on every page; about 40% of it styles pages the reader is not
on. Two partials are too large to read in one go (`_photobook.scss` 1,922 lines, `_colour.scss`
1,118), and about 700 lines style things no template renders. Eleven scripts load on every page and
most find nothing to do.

Two readers pay for this: the person on a phone, and the session that must read a 1,900-line file
to change one control.

## Decision

### 1. Layer the imports by what a file is

```
variables            Sass scales and tokens
tokens               custom properties on :root: inks, glass, curves   (new, from 0002)
mixins
responsive-policy
components           the shared pieces, before anything that could use them
reset, base
chrome               masthead, navigation, search, footer, subscribe, sidebar, toc
content              page, archive, notices, tables, syntax, code-copy, buttons, forms
pages                home, about, photobook/*, colour/*, map, nocturne, jianfei-treatise
motion-off, print    last, as now
```

`components` emits only mixins and two custom properties, so moving it changes no output.

### 2. Split the two giants by part

`_sass/photobook/` as `_cover`, `_bar`, `_book`, `_sheet`, `_colophon`, `_lightbox`, `_specs`;
`_sass/colour/` as `_palette`, `_reverie`, `_drift`, `_ridgway`, `_shared`. Same rules in the same
order, so the output is byte-identical. Before splitting, confirm every guard walks subfolders
(`check-responsive-policy.sh`, the house-style and `!important` checks, the hooks' `case` patterns).

### 3. Delete what nothing renders

`_footer.scss` in full; the unused part of `_forms.scss`; comments CSS in `_page.scss`; the
Philosopher `@font-face` blocks; modal, well and the dead helpers in `_utilities.scss`;
breadcrumbs; `.author__profile`; `.card .tags`; `%tab-focus`. In script: `bumpIt`,
`stickySideBar`, the author toggle. `_includes/ticker-tape.html`. One pass, each removal traced
across all of `_sass/**` first, as `CLAUDE.md` requires.

### 4. Load scripts where they are used

`_includes/scripts.html` gates each script by layout or page flag, as the treatise's already is.
The Photobook's modules get `modulepreload`, as the colour pages' do.

### 5. One shared module for the colour pages

Arrow-key guards, the masthead's way back and rendition choice are written three or four times
across `palette.js`, `reverie.js`, `drift.js` and `ridgway.js`, each slightly differently. One
module, used by all four and by the lightbox where it applies.

### 6. New pages are built on the Photobook shell

A new page uses `layout: default` with `body_class: photobook …` and the shared pieces, as the
colour pages and `/utils/` do. It is never built on `single` or `archive`; those are the layouts
being retired page by page.

## Deferred: page bundles

A base stylesheet for every page, plus one each for the Photobook, the colour pages, the map, Home
and the treatise, loaded by layout. A post would stop downloading roughly 40% of today's CSS.

Not now, because it changes the build and every page's `<head>` at once, and its saving shrinks
once step 3 lands and the stylesheet is cached after the first page. **Revisit** after stage 2,
with a measured number: if the first-page stylesheet is still over 200 KB raw, do it.

## Consequences

- Steps 1 to 3 make every later stage cheaper to read and to review.
- Step 2 changes file paths: update `_docs/components.md`, `_docs/layouts.md` and the Repo Map in
  `CLAUDE.md` in the same change.
- The order is 1, 3, 4, 2, 5: the import move unblocks the vocabulary; deleting first means less
  to split.
