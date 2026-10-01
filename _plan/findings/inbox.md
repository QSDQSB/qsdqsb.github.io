# Findings inbox

One line each: the date, the page, what was seen. Anyone files here, the moment they notice
something: a session, the daily run, the owner. The design lead sorts it into stages; an item
leaves this list when a stage takes it or it is closed.

Format: `- YYYY-MM-DD · where · what was seen · (who reported)`

## Waiting

- 2026-10-01 · `/reverie/?c=…#colour` · viewing a colour, the vat is not full screen; the lightbox's colour frame is drawn at a fixed 200×112 (owner) → audit P01
- 2026-10-01 · `/reverie/?…#colour` · the `#colour` address did not open the lightbox on load in the audit's browser; may be a second bug (audit)
- 2026-10-01 · a post at 375 px · tag pills' emoji overlap the first letters of the label; seen once in a half-scale screenshot, needs a second look (audit) → audit P11
- 2026-09-29 · Home · back to the landing always re-opens on the hero; reviewers suggested skipping it on back and forward (owner's call)
- 2026-09-29 · Recent Updates · a voyage that gained frames could link its card to the first new frame (owner's call)
- 2026-09-29 · palette colophon · says "QSD's Palette for London" three times on hover (taste)
- 2026-09-29 · Reverie's lightbox colour frame · shows the hex three times and counts as frame 01 (taste)
- 2026-09-29 · palette page at 1440 · about 110 px of space under the title (taste)
- 2026-09-29 · palette overview · Rigi sits alone between Prague and Rome; keep or drop the overview's short lede (taste)
- 2026-09-29 · Reverie on a phone · the dye takes 416 of 664 px, so the first print is below the fold (taste)
- 2026-09-29 · Ridgway on a phone · about 36 screens with no jump to a plate
- 2026-09-29 · lightbox at 320 px · the back label shrinks to "‹ #…"
- 2026-09-29 · palette at 320 px · "7% · accent" runs into "16%"
- 2026-09-29 · `/voyage-by-tags/` · the tag dock covers card titles → audit X14
- 2026-09-29 · Home's Wonders at 320×640 · overflows by about 27 px
- 2026-09-29 · a palette card to the book · the first system Back lands on `/voyage/london/`, not the palette
- 2026-09-29 · weight · `colour-atlas.json` carries about 37 KB (compressed) Reverie does not read; `frames.json` is fetched whole on the first lightbox; the Reverie lightbox shifts layout (CLS 0.07) → audit A07
- 2026-09-29 · SEO · `/utils/` description is thin; portfolio stubs and Venice are still in `sitemap.xml`
- 2026-09-29 · Jianfei's table overflows by 1 px; `_subvoyage/japan/tokyo.md` says "bustling" (house style)
- 2026-09-28 · palettes · salient colour is under-weighted (Porto DSCF7059: the orange roofs and yellow parasol are missing from the signature). A backfill is an R2 write: the owner's go first
- 2026-09-28 · The Colour of Light page · orphaned: its only door, the colophon link, was removed; the owner has not been asked
- 2026-09-26 · Venice · four parts show "still on their way"; `photos/venice/gondola/` has 5 processed photographs no page uses. The owner chose to leave this
- 2026-09-26 · photographs · about 20 without GPS, 8 with no camera record; needs the owner's input or re-exports
- 2026-09-26 · pixel harness · phone shots differ run to run (intermittent masks, image load timing)
- 2026-07-28 · search · a result's snapshot double-escapes `<` and shows `&lt;!`; the fix and its checklist are in `for_agents/PENDING_ISSUES.md`

## Taken

*(items a stage has taken or that were closed, with where they went)*
