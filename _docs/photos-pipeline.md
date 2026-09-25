# Photo Pipeline

How a photograph travels from the camera to the site. Linked from CLAUDE.md;
read this when touching anything under `scripts/photos/`, `_data/photos/`,
`workers/photos-trigger/`, or the processing workflow.

```
laptop                      Cloudflare                          GitHub                    site build
photos/<gallery>/*.jpg ──▶  R2 qsdqsb-originals (private) ──▶  Actions: process.mjs ──▶  R2 qsdqsb-photos (public)
      npm run photos:push        │ event notification                 Sharp tiers ─────────▶   img.qsdqsb.com/t/<hash>/…
                                 ▼                                    manifest.json, GPS ──▶   back into qsdqsb-originals
                            queue photos-uploads                      (private)                │
                                 ▼                                         │              npm run photos:fetch (R2 key)
                            Worker photos-trigger ──repository_dispatch──▶ ┘              merges with _data/photos/*.yml
                                                                                          → _data/photo_manifests/*.json
_data/photos/<gallery>.yml  (captions, order, stories — committed) ───────────────────────┘        → Liquid
```

Design goals, in order: adding a photograph is one folder drop and one
command; the repo carries no image bytes; nothing generated is committed;
every step is re-runnable and idempotent.

## The three layers of data

| Layer | Where | Written by | Holds |
|---|---|---|---|
| Originals | `photos/<gallery>/<FRAME>.jpg` locally, mirrored to the private bucket | you, via `photos:push` | camera files, EXIF intact |
| Machine | `<gallery>/manifest.json` and `<gallery>/.private.json`, both in the private originals bucket (the public bucket serves image tiers only) | the processor | dimensions, EXIF fields, thumbhash, tint, tier list, sun, weather; GPS and full EXIF only in `.private.json` |
| Authored | `_data/photos/<gallery>.yml` (nested for sub-voyages: `_data/photos/prague/twilight.yml`) | you, by hand | captions, order, stories, featured, hidden |

The site build merges machine + authored into `_data/photo_manifests/<key>.json`
(gitignored) where `<key>` is the gallery with `/` replaced by `_`. Liquid reads
`site.data.photo_manifests[key]`: the voyage's Photobook
(`_includes/photobook.html`) and the sitemap's image entries. The same step
adds the Photobook's layer (rows, cover, colophon, and per photo the place,
light, glow and lightbox record) through `scripts/photos/lib/book.mjs` —
`_docs/layouts.md` has the page side.

### Photo identity

A photograph's slug is its camera frame number, lowercased: `DSCF1797.jpg`
becomes `dscf1797`. A re-collected original of the same frame keeps the same
slug, so captions, pinned order, and shared links survive re-collection. Two
files in one gallery with the same frame get `-2`, `-3` and a warning in the
processor log.

### Authored YAML

```yaml
title: London                # optional display override
order: [dscf1797, dscf0958]  # pinned first, in this sequence; the rest follow by capture time
photos:
  dscf1797:
    caption: East Smithfield, London
    caption_zh: 东史密斯菲尔德
    alt: Rain on a bus window with the Tower behind
    story: |
      Taken between two buses.
    featured: true
  dscf6533:
    hidden: true             # processed but not shown
```

Every key is optional. A photograph with no entry still shows, sorted by
capture time, captioned by nothing. `npm run photos:fetch` validates the
shape and reports slugs that no processed photo matches.

### Manifest entry (private; the build reads it with an R2 key)

```json
{ "slug": "dscf1797", "file": "DSCF1797.jpg", "version": "<etag>:<size>",
  "w": 6240, "h": 3512, "ratio": 1.7768,
  "taken": "2023-06-16T18:22:01+01:00", "camera": "FUJIFILM X-T5", "lens": "XF90mmF2 R LM WR",
  "focal": 90, "focal35": 137, "aperture": 4.3, "shutter": "1/2000", "iso": 320, "exposureBias": 0,
  "thumbhash": "…base64…", "tint": "#1a1c20",
  "sizes": { "webp": [480, 960, 1280, 1920, 2560, 2880, 4096], "jpg": [480, 960, 1280, 1920, 2560, 2880, 4096], "avif": [480, 960, 1280, 1920] } }
```

URL template, the one contract the front end depends on:
`<PHOTOS_PUBLIC_BASE>/t/<hash>/<size>.<format>`, e.g.
`https://img.qsdqsb.com/t/93fa06e0cb81cdfd/1920.webp`, where `<hash>` is the
first 16 hex of the original's SHA-256 (a replaced original is a new URL, so
`immutable` caching holds). The merged manifest gives each photo its `url`
(`<base>/t/<hash>`) and its `sizes`. Sizes are the long edge.
Nothing public is larger than 4096 px. Every tier is re-encoded, so no EXIF
and no GPS ever reaches the public bucket.

## Commands

| Command | Does | Touches R2 |
|---|---|---|
| `npm run photos:push [-- --gallery x] [--dry-run]` | rclone copy of the diff from `photos/` to the originals bucket. Adds and updates only; every original it replaces moves to `trash/<date>/` first. | write |
| `npm run photos:pull [-- --gallery x] [--dry-run]` | The reverse of push: fetches originals `photos/` lacks from the bucket. Never overwrites a local file; skips `trash/`. | read |
| `npm run photos:ingest [-- --dry-run] [--from <dir>]` | The whole routine for new photographs: import (`--move`), enrich, locate and check each gallery touched, then one confirmation (type `QSD`) and push. `--dry-run` shows what would come in. | write (after the confirmation) |
| `npm run photos:import [-- --dry-run] [--move] [--from <dir>]` | The gateway: sorts every file in the Desktop inbox into its voyage by frame number or by picture, verifies it, copies it into `photos/` (`--move` then removes it from the inbox). Files that match nothing stay and are listed. `--discard "<file>"` moves one to the Trash. | none |
| `npm run photos:locate -- --gallery x \| --all [--sheets] [--set slug="place"] [--accept [slugs]]` | Suggests where each photo was taken (a well-known landmark, square, park or inn, else the road) into `_data/photo_locations/`; `--accept` writes suggestions into captions nobody wrote by hand. | none (OpenStreetMap, HTTP) |
| `npm run photos:collect [-- --gallery x] [--dry-run]` | Replaces compressed copies with the edited originals straight from Apple Photos: exact-name lookups, best candidate by date, verified by the gateway. Resumable, memory-guarded, one run at a time. | none (Apple Photos) |
| `npm run photos:plan [-- --gallery x]` | Reports new, changed, orphaned files; refuses orphans still named in YAML. | read |
| `npm run photos:prune -- --all` / `--gallery x [--gallery y]…` `[--dry-run]` | Moves orphans to `trash/<date>/…` in the originals bucket. Lists every file first; one confirmation (type `QSD`) covers them all. `--all` skips galleries this machine has no `photos/` folder for. | write |
| `npm run photos:process [-- --gallery x] [--force] [--dry-run] [--local dir] [--no-avif]` | The processor. Runs in Actions; runs locally against a directory with `--local`. | read + write |
| `npm run photos:fetch [-- --local dir] [--strict]` | Pre-build merge into `_data/photo_manifests/`. Never fails a build. | read (HTTP, public) |
| `npm run photos:bootstrap [-- --gallery x] [--dry-run] [--yaml-only] [--force]` | One-time: `gallery/` → `photos/` with frame-number names and injected EXIF; writes YAML skeletons. | none |
| `npm run photos:status [-- --gallery x] [--offline] [--no-fetch] [--json]` | One row per gallery: local, bucket, pending, processed, compressed, captioned, unlisted, orphans, last processed, formats. Exits 1 on anything out of place. | read |
| `npm run photos:dashboard [-- --serve] [--open]` | The migration on one page: pipeline readiness, the Desktop inbox (and its non-matches), stage per photo per gallery. `--serve` keeps it live at `http://127.0.0.1:4460`, rebuilt when the inbox, `photos/` or the captions change. | read |
| `npm run photos:captions -- --gallery x [--dry-run]` | Appends an empty `caption:` entry for every slug the YAML lacks, in capture-time order. Never rewrites what is there. | none |
| `npm run photos:recollect -- --gallery x [--rename] [--allow-drop] [--push] [--offline]` | The check before pushing re-collected files: matched, new, renamed, vanishing. Refuses while captioned work would vanish. | read (+ write with `--push`) |
| `npm run photos:trash -- list [--gallery x]` / `restore <key\|prefix/> [--dry-run] [--bucket-only]` | Shows `trash/` with prune and expiry dates; moves an object back and copies it into `photos/` if missing there. | read / write |

### Removing a photograph from a voyage

To take it off the page but keep it, set `hidden: true` under its slug in
`_data/photos/<gallery>.yml`. To remove it for good:

```bash
mv photos/<gallery>/DSCF4226.JPG ~/.Trash/          # 1. take the original out of photos/
#                                                     2. delete its slug from _data/photos/<gallery>.yml, if named there
npm run photos:plan -- --gallery <gallery>           # 3. lists it as an orphan, and refuses while the YAML still names it
npm run photos:prune -- --gallery <gallery>          # 4. type QSD: the original moves to trash/<date>/ (--all: every gallery at once)
```

The rest follows by itself: the move fires the bucket's notification, the
processor drops the photo's manifest entry (D1 marks it removed), and the site
rebuilds without it. Its public tiers stay until `process.mjs --gc` (they
are shared by content hash). Commit the YAML change with the next push.

The original stays restorable for 30 days:
`npm run photos:trash -- restore trash/<date>/<gallery>/<file>` puts it back
in the bucket and in `photos/`, and the processor renders it again.

## Day-to-day

### Read the status report

```bash
npm run photos:status              # every gallery; refreshes _data/photo_manifests/ first
npm run photos:status -- --gallery prague
npm run photos:status -- --offline # no rclone: bucket columns show –
```

A clean report ends `no problems` and exits 0. Under each gallery, `✗` lines
are problems and `·` lines are notes. The problems:

| Problem | Meaning | Fix |
|---|---|---|
| orphan(s) in the bucket, not in photos/ | an original you removed locally is still in the bucket | `photos:plan`, then `photos:prune` |
| orphan(s) still named in the YAML | as above, and a caption or pin still points at it | delete the slug from the YAML, or put the file back |
| not processed yet | the bucket (or, offline, `photos/`) holds originals the manifest lacks | wait for the workflow, or `gh workflow run photos-process.yml -f gallery=<x>` |
| no photograph exists for it anywhere | a voyage's `gallery_name` points at nothing | add the photos, or fix the frontmatter |
| YAML entries that match no photo | a typo in a slug, or a photo since removed | correct or delete the entry |

Notes (not failures): files not pushed yet, sub-gallery slug collisions, a
gallery no voyage names yet.

### Add a voyage

1. `mkdir photos/<voyage>` (or `photos/<parent>/<child>`), drop the camera files in.
2. `npm run photos:push -- --gallery <voyage>`.
3. Create `_voyage/<voyage>.md` with `gallery_name: <voyage>` (the `voyage-scaffolder` agent writes it).
4. `npm run photos:captions -- --gallery <voyage>` and fill in the blanks.
5. Commit and push. `npm run photos:status -- --gallery <voyage>` should read clean once the workflow has run.

### Caption a voyage

`npm run photos:captions -- --gallery <voyage>` appends every slug the YAML
does not mention yet, in capture-time order, each with an empty `caption:`:

```yaml
photos:
  dscf1797:
    caption: East Smithfield, London     # already written: untouched
  dscf1802:
    caption:                             # new: fill in, or leave blank
```

Existing entries, comments, and other keys stay byte for byte; the result
is re-parsed and validated before it is written. A blank `caption:` shows
the photo uncaptioned. The edit hook shape-checks the file on every save
(`photos:fetch -- --strict --shape <file>`).

### Re-collect a voyage

Replacing compressed copies with camera files, or adding frames to a
voyage that already has some:

1. Export camera files from iCloud Photos into the inbox,
   `~/Desktop/voyage originals` (`PHOTOS_INBOX`), in any folders or none;
   folder names are hints, not trusted. `npm run photos:import -- --dry-run`,
   then `npm run photos:import -- --move`. For each file the gateway:
   - **matches by name**: galleries holding the same frame number,
     confirmed by picture, since frame numbers repeat across years;
   - **else by picture**: the closest of every published photograph by
     fingerprint (48×48 greyscale, correlation ≥ 0.95; true pairs score
     ≥ 0.99, different frames of one beach ≤ 0.76). A match is imported
     under the published frame's name, so a typo in an old name (the old
     `DSCF3921` was really frame 3951) keeps its slug and captions;
   - **verifies** it: decodes whole, carries camera make and capture time,
     no bootstrap stamp, same aspect ratio as the published copy;
   - **copies** it over its compressed copy (or adds a new frame when the
     file sits in a voyage's folder and nothing published matches), and with
     `--move` removes it from the inbox once the copy is byte-identical.
   Files that match nothing, fail a check, or duplicate another staged file
   stay in the inbox, are listed in the output and on the dashboard, and
   leave only when you say so (`--discard`, to the Trash).

   Round one runs the bulk of the exports through this. Round two sweeps
   the non-matches one by one: a wrong export is discarded; an unpublished
   frame worth keeping is moved into its voyage's folder in the inbox and
   imported as a new frame.
2. `npm run photos:recollect -- --gallery <voyage>` and read the report:
   - **matched**: frames the gallery already had; the count says how many
     are now originals and how many still carry the bootstrap stamp.
   - **new**: frames the gallery did not have.
   - **renamed**: same frame, different name from the bucket's. The Fuji
     writes `DSCF1797.JPG`; the bootstrap wrote `DSCF1797.jpg`. R2 keys are
     case-sensitive, so pushing both leaves the site showing the old copy
     beside the new one as `dscf1797-2`. Re-run with `--rename` to give the
     local file the bucket's name: same key, same slug, same captions. A
     real format change (`.tif` for `.jpg`) is not renamed; push it and prune
     the old file straight after.
   - **vanishing**: frames the gallery had and `photos/` no longer does.
     Any with a caption, story, featured or hidden flag, or a pinned place
     block the push until their files are back, their YAML entries are
     removed, or you pass `--allow-drop`.
3. `npm run photos:recollect -- --gallery <voyage> --rename --push` pushes
   once the report is clean.
4. If anything vanished: `npm run photos:plan -- --gallery <voyage>`, then
   `npm run photos:prune -- --gallery <voyage>`.
5. `npm run photos:captions -- --gallery <voyage>` gives any new frame an
   empty caption to fill in.

### Collect from Apple Photos (unattended)

The originals live in the Photos library (30,000+ items, many in iCloud
only). `npm run photos:collect` finds and imports them without the Desktop:

1. For every photo still on its compressed copy, it asks Photos for items
   with exactly that file name (`DSCF1148.JPG`), 25 names per call. Exact
   names are cheap; never let anything ask Photos for a date range or a
   name prefix: those make it load the whole library (it reached 66 GB once).
2. Frame numbers repeat about every 10,000 shots, so a name has a few
   candidates. It exports the one shot nearest the voyage's other originals,
   **as edited in Photos** (the site publishes your crop; an unedited
   camera file fails the aspect check), 20 at a time.
3. The gateway verifies each export by picture and imports the match;
   the rest of the batch is deleted from `.photos-local/collect/stage/`
   (Photos itself is never touched). Up to three rounds: the next
   candidate only for photos still unmatched.
4. When done it runs `photos:locate --all`, and lists what is left in
   `.photos-local/collect/unresolved.txt`: usually files whose frame
   number was changed by hand, for round two.

It runs for as long as it needs: state in `.photos-local/collect/state.json`
(a stopped run resumes), a lock (one run at a time), Photos restarted past
6 GB, failed lookups and exports retried with a pause and otherwise left for
the next run, a log in `.photos-local/collect/log.txt` that the dashboard
shows. The first run asks macOS to let this app control Photos.

### A short session

Re-collection does not need a whole voyage at once. Three photos of one
voyage is a complete unit of work:

1. Put the three camera files in the staging folder, `photos:import`.
2. `photos:recollect -- --gallery <voyage> --push`. The push is the
   backup: from that moment the original is in the bucket, and the
   compressed copy it replaced sits in `trash/` for 30 days.
3. Stop. The rest of the voyage stays on its compressed copies, live and
   captioned; `photos:status` and the dashboard show the split.

Every step is idempotent, so the next session starts wherever this one
stopped. Anything imported but not yet pushed is only on this machine (and
in your camera library); `photos:status` lists it as *not pushed yet*.

### Restore photos/ on another machine

The bucket holds every pushed original, so a new machine (or this one,
after losing `photos/`) gets the collection back with:

```bash
git clone https://github.com/QSDQSB/qsdqsb.github.io && cd qsdqsb.github.io && npm ci
brew install rclone && rclone config     # the r2 remote, same token as before
npm run photos:pull -- --dry-run         # what would come down
npm run photos:pull                      # every original photos/ lacks
npm run photos:status                    # should read no orphans, nothing pending
```

Pull never overwrites a local file and leaves `trash/` and the processor's
private manifests in the bucket. The stamp comes down with each file, so
the restored tree knows which frames are still compressed. Anything that was
only on the lost machine (imported, never pushed) is not in the bucket;
that is what the camera library is for.

### Name where a photo was taken

The captions from the old file names are coarse ("City of London, London"
for a dozen different streets). `photos:locate` suggests better ones, as a
reader would place them, in each voyage's own caption style:

| Photo | Source | Suggestion |
|---|---|---|
| a camera original with GPS | OpenStreetMap: Geoapify (address; `GEOAPIFY_API_KEY` in `.env`, else Nominatim) and Overpass (landmarks) | `Tower of London, London`, `Middlesex Street, London`, `Minack Theatre, Penzance, UK` |
| a camera original without GPS | a visual guess (contact sheets, `--sheets`), recorded as `gps: missing`, `source: visual guess` | imprecise by design |
| a compressed copy | none yet: `source: awaiting original`; its old caption stands until the original arrives with GPS | — |

What may name a photo, from GPS: a landmark with a Wikidata or Wikipedia
link, in two tiers (castles, palaces, cathedrals, monuments, famous
bridges, squares, parks, viewpoints, beaches, peaks and airports up to
300 m away, measured to their outline, or when the photo was taken inside
them; churches, historic buildings, inns, markets and stations only within
120 m), else the road. Never museums, theatres, clubs, shops, cafés,
memorials or plaques: a caption naming the plaque beside the camera
confuses more than it places. A city voyage keeps two parts
(`Tower of London, London`); a regional one names the town between
(`Porthcurno Beach, Penzance, UK`), following the tail its captions
already use.

```bash
npm run photos:locate -- --all                     # geocode every original with GPS (cached, ~1 request a second)
npm run photos:locate -- --all --sheets            # contact sheets of originals without GPS, to guess from
npm run photos:locate -- --gallery london --set dscf3141="Oxford Street, London"
npm run photos:locate -- --gallery london --accept # suggestions into captions
```

`--accept` replaces a caption only while it is empty or still the old
file-name place the bootstrap recorded; a caption written by hand is
listed and kept. It edits the one caption line, so stories, order and
comments stay as written.

Privacy: `_data/photo_locations/*.yml` is committed and holds names only.
Coordinates stay in the originals' EXIF, the private bucket's
`.private.json`, and the gitignored lookup cache
`.photos-local/reverse-geocode.json`. Place names shown on the site are
OpenStreetMap data: credit "© OpenStreetMap contributors".

### Remove a photo

See *Removing a photograph from a voyage* above.

### Restore from trash

```bash
npm run photos:trash -- list                                  # grouped by prune date, with expiry
npm run photos:trash -- restore trash/2026-09-23/london/DSCF1797.jpg
npm run photos:trash -- restore trash/2026-09-23/london/      # everything pruned from london that day
```

A restore refuses to overwrite an original already back in place, and
copies the file into `photos/` when it is missing there, so the next
`photos:plan` does not flag it as an orphan again (`--bucket-only` skips
that). The upload event re-runs the processor.

## Photo database (D1)

Every photograph is one row in the D1 database `qsdqsb-photos`, under a
permanent id (`p_` + a ULID) that no rename, move or re-collection changes.
Files and folders are just where a photo's bytes happen to be.

| Table | Holds |
|---|---|
| `photos` | the picture (size, thumbhash, tint, tiers), the exposure, the camera's own rendering from the Fujifilm maker notes (film simulation, dynamic range, grain, colour chrome, tones, focus and drive modes, shutter type, stabilisation, shutter count), the place, and your caption, story, featured and hidden |
| `memberships` | which galleries a photo sits in, and its pinned position in each: a photo can live in several |
| `sources` | originals-bucket keys (`london/DSCF1797.jpg`) → photo id |
| `photo_private` | exact GPS and the whole camera record (serial numbers stripped). Never served |
| `audit` | every change to a caption, place, flag or pin, written by triggers |

How a file finds its photo, in order: its source key (a re-collected
original keeps the same key); its camera key, camera model with shutter
count (no serial is kept), one exposure for ever (a moved or renamed file); its content hash
(the same bytes elsewhere); otherwise a new id.

Images are content-addressed: `img.qsdqsb.com/t/<hash>/<size>.<format>`,
where the hash is the original's. A new original is a new URL, so caching
them as immutable is true by construction. `process.mjs --gc` deletes only
tiers no manifest references any more.

The database follows the pipeline, it is never refetched: the processor
writes a gallery's `manifest.json` and `.private.json` (both in the originals bucket),
R2 sends an event to the `photos-manifests` queue, and the
`qsdqsb-photos-db` Worker upserts only the rows whose version changed. The
same Worker serves a read-only API of public fields:

```
GET https://api.qsdqsb.com/v1/galleries
GET https://api.qsdqsb.com/v1/photos?gallery=london       in order: pinned, then taken
GET https://api.qsdqsb.com/v1/photos?since=<ISO time>     changed rows only
GET https://api.qsdqsb.com/v1/photos/<id>
```

Setup (done once, `workers/photos-db/`): `npx wrangler d1 create qsdqsb-photos`,
`CI=true npx wrangler d1 migrations apply qsdqsb-photos --remote` (CI=true:
a migration that drops tables otherwise waits on a prompt), `npx wrangler
queues create photos-manifests`, a notification on `qsdqsb-originals` with
`--suffix .private.json` (written with each manifest), `npx wrangler deploy`.

**The manifests are private.** The site's build reads them with a read-only
R2 key: in the Cloudflare Pages project → Settings → Variables and secrets
(Production and Preview), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, from an R2 API token with **Object Read only** on
`qsdqsb-originals`. Locally, `photos:fetch` uses the `r2:` rclone remote.

## Cloudflare setup (once)

Everything that has a CLI goes through `wrangler` (logged in once with
`npx wrangler@4 login`); three things only the dashboards can make; one
script stores every credential without printing it.

**1. With wrangler** (from `workers/photos-trigger/`; `<zone-id>` is on the
`qsdqsb.com` overview page in the Cloudflare dashboard):

```bash
npx wrangler@4 r2 bucket create qsdqsb-originals
npx wrangler@4 r2 bucket create qsdqsb-photos
npx wrangler@4 r2 bucket domain add qsdqsb-photos --domain img.qsdqsb.com --zone-id <zone-id> --min-tls 1.2 -y
npx wrangler@4 r2 bucket lifecycle add qsdqsb-originals trash-30d trash/ --expire-days 30 -y
npx wrangler@4 r2 bucket cors set qsdqsb-photos --file cors.json -y   # GET from qsdqsb.com and localhost:4000
npx wrangler@4 queues create photos-uploads
npx wrangler@4 r2 bucket notification create qsdqsb-originals --event-type object-create object-delete --queue photos-uploads
npx wrangler@4 deploy
```

CORS only matters once the browser fetches a manifest itself; the build
reads manifests from Node, which ignores CORS.

**2. In the dashboards** (no CLI or API covers these):

| What | Where | Scope |
|---|---|---|
| R2 API token | Cloudflare → R2 → Manage API tokens → Create | Object Read & Write, `qsdqsb-originals` and `qsdqsb-photos` only. Copy the Access Key ID and Secret Access Key. |
| Pages deploy hook | Cloudflare → Workers & Pages → the site → Settings → Builds → Deploy hooks | Branch `master`. Copy the URL. |
| GitHub token for the Worker | GitHub → Settings → Developer settings → Fine-grained tokens | This repository only; *Contents: Read and write* (what `repository_dispatch` needs). |

**3. Store them**, in your own terminal (hidden prompts; Enter skips one):

```bash
bash scripts/photos/setup-secrets.sh <account-id>   # account id: npx wrangler@4 whoami
```

It configures the `r2` rclone remote on this machine, sets the four GitHub
secrets (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`CF_PAGES_DEPLOY_HOOK`), and puts the GitHub token into the Worker as
`GITHUB_TOKEN`. Optional repository *variables* `PHOTOS_ORIGINALS_BUCKET` /
`PHOTOS_PUBLIC_BUCKET` only if the bucket names ever change.

**4. Check.** `npm run photos:dashboard -- --open`: the pipeline strip at
the top goes green link by link (rclone remote, bucket, `img.qsdqsb.com`,
secrets, Worker, last processing run). The Pages build needs nothing: it
fetches manifests over plain HTTPS from `img.qsdqsb.com`; if that base ever
changes, set `PHOTOS_PUBLIC_BASE` in the Pages environment and in `.env`.

## Local setup (each machine)

```bash
brew install rclone          # or the platform equivalent
bash scripts/photos/setup-secrets.sh <account-id>   # answers only the R2 key prompts on a second machine
gh auth login                # only needed to trigger the workflow by hand
```

`.env` at the repo root may set `PHOTOS_RCLONE_REMOTE` (default `r2`), the
bucket names, `PHOTOS_PUBLIC_BASE`, and `PHOTOS_DIR` (default `photos`, for
originals kept on an external drive). Every photo script loads it; variables
already set in the shell win.

## Bootstrap order (the local session)

The cloud session that built this pipeline left `gallery/` tracked and
untouched. The cutover ran locally, in this order. Steps 1–5 are done; the
last check of step 5, a live Cloudflare Pages build logging
`photo manifests: N galleries`, comes with the merge.

1. `npm run photos:bootstrap` — copies every `gallery/<g>/<legacy>.jpg` to
   `photos/<g>/<FRAME>.jpg`, writing the exposure encoded in the old
   filenames into real EXIF (lossless, pixels untouched). The YAML skeletons
   in `_data/photos/` were already generated and committed with `--yaml-only`;
   the bootstrap keeps them.
2. `npm run photos:push -- --dry-run`, then `npm run photos:push`. About 600 MB.
3. Watch *Actions → Photos · process originals*. The first run renders every
   tier for 577 photographs and takes roughly an hour; later runs only touch
   what changed.
4. `npm run photos:fetch` locally and confirm `_data/photo_manifests/` fills;
   `npm run serve:fast` to see the merged data in Liquid.
5. Done: `gallery/` is untracked, gitignored, and gone from disk (moved to
   the macOS Trash on 2026-09-24 once every picture in it was in
   `photos/`); `scripts/generate-gallery-assets.mjs`, the `generate:gallery`
   scripts and the Rakefile's `generate_thumbnails` are gone, so `build` is
   `photos:fetch → geocode → jekyll`; the Photobook replaced the gallery
   viewer. Left: confirm the Pages build log shows `photo manifests: N galleries`.
6. Re-collect originals voyage by voyage (see *Re-collecting the originals*).
7. Later, separately: rewrite git history to drop the 600 MB from every clone.

## Re-collecting the originals (transitional)

The bootstrap's files are the site's old compressed copies: no capture
time, no camera, no GPS, exposure recovered from the old file names. Until
a voyage is re-collected its photos sort by frame number and carry no
location. Re-collection runs voyage by voyage over weeks, through
*Day-to-day → Re-collect a voyage*.

**How a compressed copy is marked.** The bootstrap writes
`qsdqsb bootstrap: compressed copy` into every copy's EXIF `Software` tag
(`BOOTSTRAP_STAMP` in `lib/config.mjs`). The mark travels with the bytes:
local file → originals bucket → the processor, which records
`"compressed": true` on that photo's manifest entry. A camera file never
carries it, so dropping the original in its place clears the mark with no
list to update. Metadata alone could not do this: one of the 577 copies
(`prague/charles-bridge/DSCF4235.jpg`) kept its capture time. A re-run of
the bootstrap never overwrites an unstamped file, so it cannot undo a
re-collection.

**Tracking it.** `photos:status` has a `compressed` column;
`npm run photos:dashboard -- --open` draws every photo in one of four
stages: original and live, compressed and live, pushed and awaiting
render, local only. A gallery is re-collected when its bar is all
verdigris and it carries a ✓.

**Retiring it.** When every gallery reads `compressed 0`, remove the
scaffolding: `BOOTSTRAP_STAMP`, the processor's `compressed` flag,
`isCompressedCopy` in `lib/inventory.mjs`, the `compressed` column and
stage counts in `photos:status`, `photos:dashboard`, the "still the
compressed copy" count in `photos:recollect`, the
`photos/**/.bootstrap-map.json` files, `scripts/photos/bootstrap.mjs` with
its `photos:bootstrap` script and `lib/exif-write.mjs` (if nothing else uses
it), and this section.

## Backups: where each thing lives

Nothing in the migration's progress needs backing up on its own: which
photos are re-collected is written into the files themselves (the stamp),
and everything else is either in git or rebuilt from the originals.

| Thing | Primary | Copy | Lost if |
|---|---|---|---|
| Camera originals | your camera library / cards | `photos/` locally, then the originals bucket after `photos:push` (back down with `photos:pull`) | library, `photos/` and the bucket all go at once |
| Compressed copies | `gallery/` in git history | `photos/`, the bucket | never, while git history keeps them |
| Captions, order, stories | `_data/photos/*.yml` in git | GitHub | never, once committed and pushed |
| Tiers, manifests | rebuilt by the processor | — | nothing: `gh workflow run photos-process.yml -f force=true` |
| GPS, full EXIF (`.private.json`) | rebuilt by the processor from originals | — | nothing |
| Merged manifests | rebuilt every build | — | nothing |

What protects the originals bucket:

- **Removals** go through `plan` → `prune` → `trash/<date>/`, 30 days.
- **Replacements**: R2 keeps no object versions, so `photos:push` runs
  rclone with `--backup-dir trash/<date>/`: an original a push overwrites
  (a compressed copy replaced by its camera file, or a mistake) is moved to
  trash first and restorable with `photos:trash` for 30 days. Two
  overwrites of the same file on one day keep only the later backup.
- **Nothing syncs deletions**: push is `rclone copy`, never `sync`.

The gap is between dropping camera files into `photos/` and pushing them.
`photos/` sits inside the repo, gitignored, so `git clean -fdx` or deleting
the clone removes it. Push soon after each re-collection, and keep the
camera library itself until the voyage reads re-collected on the dashboard.
A second, independent copy of the originals (Time Machine or an external
drive holding `photos/`) is cheap insurance: the bucket is one provider, one
account, one set of credentials.

## Guards and tests

- `npm test` covers slug parsing, the manifest merge, and an end-to-end
  processor run over a filesystem store with generated images, including the
  assertion that no EXIF reaches a public tier.
- `npm test` also covers the bootstrap stamp becoming `compressed: true`,
  push moving replaced originals to trash, `photos:status` row building,
  stage counts and orphan classification, the dashboard's totals and
  escaping, the captions scaffold (text-level append, capture-time
  order, idempotence), the re-collection comparison and `--rename`, and
  trash list/restore. The recollect and trash CLI tests run real rclone
  against a local-directory remote, and skip when rclone is not installed.
- `npm run photos:fetch` validates authored YAML shape and reports unmatched
  slugs; `--strict` makes that a non-zero exit for CI.
- Editing `_data/photos/**.yml` in a Claude Code session runs
  `photos:fetch -- --strict --shape <file>` through the edit hook: shape
  only, no network.
- `scripts/check-gallery-integrity.js` validates every `gallery_name`
  against `_data/photo_manifests/_index.json` (a processed manifest with
  photos, or the Photobook renders empty) and reports galleries under
  `photos/` that no voyage references. `scripts/check-frontmatter.js`
  errors on a `gallery_name` with neither `_data/photos/<name>.yml` nor a
  fetched manifest, and warns on one with no processed photos.
