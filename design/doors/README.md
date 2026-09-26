# Voyage doors: prototypes

Sketches for how the site presents its **doors**: the cards on `/voyage/` and on a parent voyage
(Prague, Rome, Japan, Dolomites, Venice) that lead into each Photobook. Nothing here ships: these
are standalone pages outside the Jekyll build. `design/` is gitignored, so these files were added
with `git add -f`. Add new files the same way.

## Where we are (2026-09-27)

**Current direction: `cards.html`, today's card view refined, plus the door opening.**

- **The cards stay the page.** Stacked 3.5:1 doors, each the voyage's own hand-cropped cover.
  - Refined: full colour (today's cards sit under a 32% dark wash), square corners, no shadow, no
    lift-and-scale on hover.
  - The name and the poetic excerpt sit at the foot and are always visible, phones included.
  - An atmosphere line (light · air · month) appears on hover.
  - Phones: 2:1 cards instead of today's ~96 px strips. This is **pending the owner's sign-off**,
    because the phone differs from desktop.
- **Approach:** the card's picture breathes with its depth map (Lontananza, one door alive at a time).
- **The door opening:**
  - A click grows the card into exactly where the book's cover sits (full width,
    `max(100vw/3, 26rem)`; phones `120vw`).
  - Meanwhile the camera leans into the cover's depth (near things surge, then settle) and the page
    falls to dark.
  - It then navigates. A cross-document view transition (`view-transition-name: cover`) hands the
    picture to the book's cover. Back morphs it into the card again.
  - A second click during the opening goes straight in. Reduced motion means an instant navigation.
- **Open question for the owner:** does the ~0.75 s opening feel like a moment or a delay?

## The owner's calls so far

- **Doorways withhold.** One magnificent cover plus the inviting poem. Never preview a door's
  pictures, never stats or counts at the door. Curiosity carries the visitor inside. Data belongs
  inside the book.
- **Several doors in view at once.** Comparing two or three lets visitors imagine: the montage.
- The site is immersive, not storytelling. Stories and captions are parked; the Photobook stays
  English-only for now.
- **Rejected:**
  - `design/volumes/` A (contents list), B (square-cover grid), C (one continuous book): read as
    information, not impression.
  - P3 "by the light" (`p3-light.html`): labels beside plates, hung by the hour, catalogue look.
    Definite no.
  - Any "hour of the visitor" ordering.
- **Not extraordinary:** P1 "hang" (`p1-hang.html`, spread · pair rhythm with wings for multi-part
  voyages) and P2 "cinema" (`p2-cinema.html`, full-bleed scenes, the one in view lit).
- **"Through the doors"** (`walk.html`): scroll walks the camera through each cover's depth into the
  next place. The opening is liked, but it **must not replace the card view**, and the owner declined
  it as an optional "walk" mode.
- Covers are moving to *a photo from the voyage plus a focal point*. That work happens in
  another session (the covers handoff). Until it lands, the sketches crop the 3:1 JPEGs around the
  centre.

## Files

| File | What |
|---|---|
| `cards.html` | **Current**: refined cards and the door opening |
| `room.html` | Stub of the far side: the Photobook cover, and a link to the real book |
| `p1-hang.html`, `p2-cinema.html`, `p3-light.html`, `walk.html` | Earlier sketches, kept for reference |
| `doors.css`, `doors.js` | Shared tokens, door markup, the prototype switcher, view-transition naming, "one door alive" |
| `depth.js` | A local copy of `assets/js/hero-depth-parallax.js`: no auto-run; `setup()` returns `{ destroy }` |
| `extract.mjs` | Builds `data.js` (every voyage and part: cover, depth map, poem, atmosphere) |
| `data.js` | **Not committed** (derived from the private manifests). Rebuild it; see below |

The first round, `design/volumes/` (a contents list, a covers grid, one continuous book), is kept
beside this folder for the record. Its `data.js` is also rebuilt, not committed.

## Run it

From the repository root:

```bash
npm run photos:fetch              # the merged manifests (needs the r2: rclone remote)
node design/doors/extract.mjs     # → design/doors/data.js
node design/volumes/extract.mjs   # → design/volumes/data.js (only for the old sketches)
python3 -m http.server 8138       # serve the repo root: pages load ../../images/
```

Then open `http://127.0.0.1:8138/design/doors/cards.html?at=prague` (or `?at=index`, `rome`,
`japan`, `dolomites`, `venice`) in Chrome or Safari. Firefox has no cross-document view transitions.
The dashed pill at the bottom switches sketch and page; it is prototype chrome, not design.

For screenshots, use Playwright via
`require('module').createRequire(<repo>/package.json)('playwright-core')` with `channel: 'chrome'`.

## If this goes to production

- **Home:** one door include for `/voyage/`, parent pages and the Photobook's end cards.
- **The door opening:**
  - lives in `assets/js/`, with a single WebGL context;
  - preloads the depth map on hover, focus or touch;
  - is named in `pageswap` / `pagereveal`, only for the clicked door.
- **Performance:** the first covers load eagerly with `fetchpriority="high"`; the rest are lazy
  WebP/AVIF with `content-visibility: auto` on cards below the fold.
- **House rules:** breakpoints only via `_responsive-policy.scss`; no `!important` (the sketches use
  one in a reduced-motion reset); pixel diff before committing `_sass/`, `_layouts/` or `_includes/`.
