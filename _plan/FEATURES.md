# Features

Every thing the site does, where its code lives, and which journey proves it still works. This is
the map a session reads instead of searching: find the row, open the files it names.

`scripts/check-plan.mjs` checks that every path here exists and every journey id is real, so the
table cannot quietly go stale. A feature with no journey is a feature the gate cannot defend: the
check counts them. Add the row when a feature ships; add its journey to
`scripts/check-journeys.mjs` in the same change.

| Feature | Where a reader meets it | Code | Journey | Standing calls and notes |
|---|---|---|---|---|
| Masthead and navigation | Every page | `_includes/masthead.html` `_sass/_masthead.scss` `_sass/_navigation.scss` `assets/js/masthead-intent.js` `assets/js/plugins/jquery.greedy-navigation.js` `_data/navigation.yml` | `home` `masthead-touch` `masthead-keys` | Immersive without losing direction: away while reading, back on a hint of looking for it. Audit X01, X02, X22. Stage 3. |
| Search | The magnifier, every page | `_includes/search/search_form.html` `_sass/_search.scss` `assets/js/lunr/lunr-en.js` `assets/js/lunr/lunr-store.js` `assets/js/_main.js` | `search` | Audit S03, S04, X09, X10. |
| Home | `/` | `_layouts/home.html` `_includes/home/index.html` `_includes/home/whats-new.html` `_sass/_home.scss` | `home` | Three snap panels. No full-screen gate. |
| The monogram and the bubbles | Home's hero | `assets/js/qsd-mark.js` `assets/js/qsd-bubbles.js` | | Loops by the owner's choice (2026-07-19). |
| Hero and depth parallax | Every page with a hero | `_includes/page__hero.html` `assets/js/hero-depth-parallax.js` `_sass/_page.scss` | | Depth maps made by `npm run generate:depth`. Audit S02. |
| Opening scene | Hero pages, on load | `assets/js/overlay-opening-scene.js` | `masthead-touch` `masthead-keys` | Holds the bar away for three seconds; yields to a reader looking for it. Audit X02. |
| Voyage index and cards | `/voyage/`, parent voyages, Posts | `_portfolio/voyage.html` `_includes/archive-single.html` `_sass/_archive.scss` `assets/js/card-covers.js` | `voyages` | A card is a magazine cover. Doorways withhold. Stage 4. |
| The Photobook | A voyage | `_layouts/gallery.html` `_includes/photobook.html` `_includes/photobook/book.html` `_includes/photobook/frame.html` `_includes/photobook/cover.html` `_sass/_photobook.scss` `assets/js/photobook/index.js` `assets/js/photobook/book.js` | `book` | The canonical design. Immersive, English only. |
| Film dial and view switch | A voyage's cover seam | `_includes/photobook/filmbar.html` `assets/js/photobook/dial.js` | | Minimal translucent dial; first tap opens on touch. No journey yet. |
| Lightbox and specs | A print, opened | `_includes/photobook/lightbox.html` `assets/js/photobook/lightbox.js` `_includes/photobook/sun.html` | `book` `deeplink` | Specs pinned by default. The sun diagram is the flagship. Never clock times. |
| Colophon | The end of a book | `_includes/photobook/colophon.html` `_includes/photobook/end.html` | | Hours without clock times; the voyage's vat. |
| Photo pipeline | Not seen: every photograph | `scripts/photos/process.mjs` `scripts/photos/lib/book.mjs` `scripts/photos/fetch-manifests.mjs` | | Photographs live in R2. `_docs/photos-recipes.md`. R2 writes are the owner's. |
| Palette | `/palette/` | `_pages/palette.html` `assets/js/colour/palette.js` `assets/js/colour/vat.js` `assets/js/colour/cards.js` `_sass/_colour.scss` | `palette` | The vat stays misty. No glass panel. |
| Reverie | `/reverie/` | `_pages/reverie.html` `assets/js/colour/reverie.js` `assets/js/colour/reverie-parts.js` | `reverie` `reverie-unheld` | Keyed on the colour; one nothing holds opens on the closest photograph. Audit X04, X05, P01. |
| Drift | `/drift/` | `_pages/drift.html` `assets/js/colour/drift.js` | `drift` | Plain Drift has no door, by choice. Escape is the way back to its colour, after search. Audit S06, X07. |
| Ridgway's plates and utilities | `/utils/`, `/utils/ridgway/` | `_pages/utils.html` `_pages/utils-ridgway.html` `assets/js/colour/ridgway.js` | | Reached by address alone. |
| Colour figures in a post | A post that speaks of the colour pages (`/posts/in-the-naming-of-light/`) | `_includes/colour-figure.html` `_includes/colour-code.html` `assets/js/colour/figures.js` `assets/js/colour/reverie-parts.js` `assets/js/photobook/specs.js` `_sass/_colour.scss` | `post-figures` | Drawn from the site's own data by the Palette's and Reverie's own code, never a screenshot. Reverie's rules are shared with its page (`reverie-parts.js`), not copied. The palette, the frames and the Reverie each stand on a plate, which does nothing under the pointer (the palette's vat stirs); the chips stand bare, centred; the frames fold. One frame can stand alone with its specs: the lightbox's own panel (`specs.js`), under the print. |
| Map and atlas | `/voyage/`, voyages in parts | `_includes/map.html` `assets/js/map.js` `_sass/_map.scss` `scripts/geocode-maps.js` | | A veil before interaction, so scroll is never taken. Audit S14, X18, X19. |
| Posts and reading | `/year-archive/`, a post | `_layouts/single.html` `_pages/year-archive.html` `_sass/_page.scss` `_includes/toc.html` `assets/js/toc-scroll-spy.js` | `post` `anchor` `post-spread` | The old layout. Stage 6. In-page links are plain links that glide. |
| Bilingual switch | Posts with two languages | `assets/js/bilingual-switch.js` `_sass/_bilingual-switch.scss` | | Posts only; the Photobook is English only. |
| Code copy | Code blocks in posts | `assets/js/code-copy.js` `_sass/_code-copy.scss` | | Audit X18. |
| Tags | `/tags/`, `/voyage-by-tags/` | `_pages/tag-archive.html` `_pages/tag-voyage.html` `_data/tag_colours.yml` | | Audit X14. |
| Tarot cards and the random jump | Lower corners of several pages | `_includes/tarots.html` `_includes/random_voyage.html` | | Hidden until the pointer finds them. Audit X10. |
| Word card | The end of a post, Home | `_includes/word-card.html` | | |
| Subscribe | The slip at the end of a page | `_includes/subscribe.html` `assets/js/subscribe.js` `_sass/_subscribe.scss` `functions/api` | | D1 and Resend behind it. Never submitted by a journey. Audit X11, X18. |
| About and CV | `/about/`, `/cv/` | `_pages/about.md` `_pages/cv.md` `_layouts/about.html` `_sass/_about.scss` | | Stage 6. The CV's way in is the end of About. |
| Bestiary | `/bestiary/` | `_pages/bestiary.md` | | Not built. Until it is, a designed holding page, kept in the navigation (the owner, Q5, 2026-10-01): to be chosen from prototypes. Stage 5. |
| 404 | A wrong address | `_pages/404.md` | `lost` | |
| The Jianfei treatise | One post | `assets/js/jianfei-treatise.js` `_sass/_jianfei-treatise.scss` `_includes/jianfei/weight-figure.html` | | Its CSS ships on every page: audit A04. |
| Motion switches | Everywhere | `_includes/head/custom.html` `_sass/_motion-off.scss` | | `?motion=off` for screenshots; `prefers-reduced-motion` per component. `npm run visual:audit`. |
| View transitions | Between pages | `_sass/_view-transitions.scss` | | Out 0.3s, in 0.4s. |
