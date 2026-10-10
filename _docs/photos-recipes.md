# Photos: recipes

The task-first guide: what to run to add, change or remove photographs and voyages. The reasons,
the data shapes and every flag live in `_docs/photos-pipeline.md`; read that when a recipe below
isn't enough or something misbehaves.

## The model in six lines

1. **Originals** live in `photos/<gallery>/` (gitignored), one folder per voyage, nested for parts
   (`photos/prague/twilight/`). A photo's **slug** is its camera frame number: `DSCF1797.jpg` → `dscf1797`.
2. `photos:push` (or `ingest`, `recollect --push`) copies them to R2 **qsdqsb-originals** (private).
3. The upload triggers **GitHub Actions** (`photos-process.yml`): sized WebP/AVIF/JPEG tiers go to
   **img.qsdqsb.com**, and the sun and the weather are worked out **once per photo**. A private manifest
   goes back to the originals bucket, and the D1 database is updated. Place names come earlier, from
   `photos:locate` on this machine (`_data/photo_locations/`). Expect minutes for a few
   photos, around an hour for a forced run over everything.
4. **Words** live in `_data/photos/<gallery>.yml` (committed): order, captions, stories, place overrides.
5. Every build runs `photos:fetch`, which reads the private manifests with an R2 key (local: the rclone
   remote `r2:`) and merges them with the YAML into `_data/photo_manifests/`. Never commit that folder,
   or any image bytes.
6. The voyage page (`_voyage/*.md`, `_subvoyage/**`) names its gallery with `gallery_name:`. The Photobook
   does the rest.

## Ground rules (agents: read these first)

- **Never push, prune or restore in R2 without the owner's explicit go in this session.** Those commands
  ask for a typed `QSD`; the owner types it. Dry runs and `photos:status` are always fine. The one
  other go is **Bring them in** on the command centre, for exactly the album set it was tapped on
  (`photos:harvest`, below).
- **Apple Photos is open to a session only through the album Voyage-of-QSDQSB** (the owner, 2026-10-10):
  `npm run photos:harvest`, nothing else. A hook refuses `osascript`, enrich, ingest, the library's files
  and computer use on Photos. Enrich and ingest stay the owner's own commands.
- In Apple Photos, export **as edited** (File → Export), because the site publishes the owner's crop.
  That export strips the Fujifilm record (film simulation, settings, shutter count). `photos:enrich`
  (part of `ingest`) copies it back from the library's unedited original. Don't export *Unmodified
  Original*: that would throw the edit away.
- Keep a file's name as `photos/` already has it. R2 keys are case-sensitive, so `DSCF1797.JPG` and
  `.jpg` are different photos.
- GPS never leaves the private side. Only place *names* are committed (`_data/photo_locations/`).
- Nothing about sun, weather or place is typed by hand; the processor computes it. Only override a wrong
  place (`place:` in the YAML).
- Changing only `_data/` doesn't need the pixel diff. Anything under `_sass/`, `_layouts/` or
  `_includes/` does (see CLAUDE.md).

## Recipes

### Bring in the album (the usual way now)

The owner drops the photographs they want on the site into the Apple Photos album **Voyage-of-QSDQSB**.
Then, in a session, `/harvest` (`.claude/commands/harvest.md`), or the command centre's **Bring them in**:

```bash
npm run photos:harvest                                   # look: export as edited, restore camera records, place, propose
npm run photos:harvest -- set DSCF3744 london --why "…"  # judgement, or hold; a new gallery by its name
#   the command centre shows each photo and its voyage; the owner's tap is the yes
npm run photos:harvest -- go '<the stored document>'     # record that yes (refused if the plan changed since)
npm run photos:harvest -- bring                          # pull the voyages whole → ingest (no enrich) → push → tag in Photos
```

Where each photo goes: beside the published photo taken nearest in time when that is within 12 hours
in the same country (`sure`), else the voyage of its city (`likely`), else judged by eye (`open`: a
city in parts, a new trip). Galleries are places, not trips: a later visit joins its city.

After `bring`: each photo carries the Photos keyword `qsdqsb: <gallery>` and is skipped from then on;
its voyage's `updated:` is now. Commit those pages and `_data/photo_locations/` in a pull request.
Photos' scripting cannot take a photo out of an album, so nothing is: once all of the album is on the
site, the owner empties it (⌘A, Delete → Remove from Album; never ⌘⌫, which deletes from the library).
The photographs stay in the library. The album name can be changed with `PHOTOS_ALBUM`.

### Add photographs to an existing voyage, by hand

The owner's own way, in their terminal: `ingest` runs `enrich`, which searches the whole Photos
library, so a session never runs either (the scope hook refuses them). A session brings photographs
in through the album, above.

```bash
# 1. The owner drops the camera files into the inbox, one folder per gallery:
#      ~/Desktop/voyage originals/<gallery>/DSCF….JPG     (PHOTOS_INBOX overrides the path)
npm run photos:ingest -- --dry-run      # shows what would come in, and where
npm run photos:ingest                   # import → enrich → locate → check, then the owner types QSD → push
```

`ingest` handles only the galleries that changed. It copies files in by frame number or by picture,
restores stripped camera records, names places from GPS, checks nothing captioned would vanish, then pushes.
Once the workflow finishes (`gh run list --workflow photos-process.yml -L 3`), run `npm run photos:status
-- --gallery <g>`. It should say `no problems`. Then set the voyage's `updated:` to now
(`2026-09-28 21:00`: the time settles a day's ties, a new voyage later than one given a few frames) in
its `_voyage/` front matter, the parent's for a part (the board reads `_voyage/` only): the landing's
Recent Updates ranks voyages by it (a voyage's `date` is the trip's, not when it came to the site).

### Start a new voyage

1. Photos: an inbox folder named for the new gallery (kebab-case, e.g. `lake-como`), then
   `npm run photos:ingest` as above.
2. Page: use the **voyage-scaffolder** agent, or write `_voyage/<g>.md` with `title`, `date`, `excerpt`,
   `tags` and `gallery_name: "<g>"`.
3. Cover: once the photos are processed, `npm run covers:focus`: pick the photo, click where its subject
   sits, Save. That writes `cover: { photo: dscf…, focus: [x, y] }` into `_data/photos/<g>.yml`; no image
   file, no frontmatter. `check:frontmatter` reports a voyage with no cover.
4. Optional words: `npm run photos:captions -- --gallery <g>` adds an empty entry per slug to fill in.
   Pin the opening frames with `order: [dscf…, dscf…]`.
5. `npm run check:frontmatter` and `npm run check:gallery`, then commit the `.md`, the YAML and the cover.

**A voyage in parts** (e.g. Prague): the parent `_voyage/<p>.md` sets `subgalleries: true` and no
`gallery_name`. Each part is `_subvoyage/<p>/<child>.md` with `gallery_name: "<p>/<child>"`, its photos in
`photos/<p>/<child>/`. The parent's file name must equal the `_subvoyage/<p>/` folder name.

### Change what a photo shows

All of these go in `_data/photos/<g>.yml` (`npm run photos:fetch` validates it):

| Want | YAML |
|---|---|
| Open the book on particular frames | top level `order: [dscf0958, dscf1797]` (the rest follow by capture time) |
| Correct a wrong place name (a stale GPS fix) | `dscf6440: { place: "The Monument, London" }` |
| Add a caption, alt text or story | `caption:`, `alt:`, `story: \|` (plus `_zh` variants) |
| Hide a photo but keep it | `hidden: true` |
| Set or move the cover | `npm run covers:focus` (http://localhost:4400): pick the photo, click where the subject sits, Save. Or by hand, top level `cover: { photo: dscf7406, focus: [0.5, 0.48] }`: the photo, and the subject's x, y (0–1 from its top-left). Every shape (card, Photobook, hero, phone, link preview) is cut around that point. `crops: { "4:3": [x, y] }` only for a shape whose subject sits elsewhere. A voyage in parts: `_data/photos/<parent>.yml`, `photo: <part>/<slug>` |
| Prefer a photo for the book's opening frame, with no cover set | `featured: true` (the first featured landscape) |
| A flight or aerial set (no place or sun; temperature at altitude) | top level `aerial: { altitude_ft: 33000 }` |

No reprocessing needed: rebuild (`npm run build`/`serve`) to see it. Top-level keys allowed: `title`,
`order`, `aerial`, `cover`, `photos`. Per photo: `place`, `caption`, `caption_zh`, `alt`, `story`, `story_zh`,
`featured`, `hidden`.

### Replace a photo with a new edit

Re-export the edited photo (as edited) with its original file name, then:

```bash
npm run photos:import -- --replace-originals        # keeps the name, so slug and captions stay; a new crop is
                                                    # accepted when camera and capture time match (a warning)
npm run photos:recollect -- --gallery <g>           # the check
npm run photos:recollect -- --gallery <g> --push    # owner's go; the old file moves to trash/<date>/
```

### Remove a photo

Temporarily: `hidden: true` in the YAML. For good:

```bash
mv photos/<g>/DSCF4226.JPG ~/.Trash/
#   delete its entry from _data/photos/<g>.yml, if it has one
npm run photos:plan -- --gallery <g>       # lists it as an orphan
npm run photos:prune -- --gallery <g>      # owner types QSD; the original moves to trash/<date>/ for 30 days
```

To undo: `npm run photos:trash -- restore trash/<date>/<g>/<file>`.

### Photos show no film, settings or shutter count

Photos' edited export dropped their maker notes, and enrich didn't restore them. Run
`npm run photos:enrich -- --gallery <g>` (add `--by-time` for renamed files). It finds each item in Photos,
reads its unedited camera file, and copies the record into our edited file. Then `recollect --push` (owner's
go). If the library holds no camera original for a photo (only an edited export was ever imported),
the record can't be recovered and the photo simply shows without it.

### Photos show no colours

The colophon's Colours row, the specs palette, the sheet's colour order, QSD's Palette, Reverie and `/drift/` need
each photo's `palette`. The processor adds it (on the next run for older photos: owner's go, it
writes the manifest). To see colours locally before that, `node scripts/photos/palettes.mjs`, then
`npm run photos:fetch`: a git-ignored sidecar, nothing written to R2.

## When something looks wrong

| Symptom | Likely cause | Do |
|---|---|---|
| Voyage page says the photographs are "still on their way" | `gallery_name` matches no processed gallery, or processing hasn't finished | `npm run photos:status -- --gallery <g>`; `npm run check:gallery` |
| A new photo is missing | not pushed, or the workflow is still running or failed | `photos:status`; `gh run list --workflow photos-process.yml` |
| Build log: `photo manifests: … no access to the private manifests` or `the private read failed (…)` | no R2 key there, or a wrong one (the Access Key ID is 32 characters, the secret 64). On Cloudflare the build then fails and the last good site stays live; elsewhere each gallery keeps its previous merge | set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` for that Cloudflare Pages environment (Production and Preview are separate), or configure the `r2:` rclone remote locally |
| Wrong place under a photo | stale GPS | `place:` override in the YAML |
| `photos:import` refuses a file | not a camera original, the wrong picture for that frame, or it would overwrite an original | read its reason; `--replace-originals` only for a deliberate re-edit |
| Sun or weather missing on a photo | no GPS within 6 h of a sibling, or an aerial set | expected; nothing to type |

## Where things are

| What | Where |
|---|---|
| Scripts | `scripts/photos/` (`harvest`, `ingest`, `import`, `enrich`, `locate`, `recollect`, `push`, `plan`, `prune`, `trash`, `status`, `captions`, `process`, `fetch-manifests`) |
| Authored words | `_data/photos/<g>.yml`; places `_data/photo_locations/<g>.yml` |
| Page templates | `_includes/photobook/*.html`, `_sass/_photobook.scss`, `assets/js/photobook/` (see `_docs/layouts.md`) |
| Book logic at build | `scripts/photos/lib/book.mjs` (rows, cover, colophon, sun and weather phrases, film letters, colours) |
| Colours | `scripts/photos/lib/palette.mjs` (palette, distance, swatches), `lib/atlas.mjs` (across voyages); pages `_pages/light.html`, `_pages/drift.html`, `_pages/palette.html` (QSD's Palette, `/palette/#<gallery>`), `assets/js/colour/`, `_sass/_colour.scss` |
| Database | D1 `qsdqsb-photos`, worker `workers/photos-db/` (api.qsdqsb.com) |
| Full reference | `_docs/photos-pipeline.md` |
