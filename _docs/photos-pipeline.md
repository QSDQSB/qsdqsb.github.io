# Photo Pipeline

How a photograph travels from the camera to the site. Linked from CLAUDE.md;
read this when touching anything under `scripts/photos/`, `_data/photos/`,
`workers/photos-trigger/`, or the processing workflow.

```
laptop                      Cloudflare                          GitHub                    site build
photos/<gallery>/*.jpg ──▶  R2 qsdqsb-originals (private) ──▶  Actions: process.mjs ──▶  R2 qsdqsb-photos (public)
      npm run photos:push        │ event notification                 Sharp tiers,             img.qsdqsb.com/<gallery>/…
                                 ▼                                    EXIF, thumbhash          │
                            queue photos-uploads                      manifest.json            ▼
                                 ▼                                         │              npm run photos:fetch
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
| Machine | `<gallery>/manifest.json` in the public bucket; `<gallery>/.private.json` in the private bucket | the processor | dimensions, EXIF fields, thumbhash, tint, tier list; GPS and full EXIF only in the private file |
| Authored | `_data/photos/<gallery>.yml` (nested for sub-voyages: `_data/photos/prague/twilight.yml`) | you, by hand | captions, order, stories, featured, hidden |

The site build merges machine + authored into `_data/photo_manifests/<key>.json`
(gitignored) where `<key>` is the gallery with `/` replaced by `_`, the same
key today's thumbnail meta used. Liquid reads
`site.data.photo_manifests[key]`.

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

### Public manifest entry

```json
{ "slug": "dscf1797", "file": "DSCF1797.jpg", "version": "<etag>:<size>",
  "w": 6240, "h": 3512, "ratio": 1.7768,
  "taken": "2023-06-16T18:22:01+01:00", "camera": "FUJIFILM X-T5", "lens": "XF90mmF2 R LM WR",
  "focal": 90, "focal35": 137, "aperture": 4.3, "shutter": "1/2000", "iso": 320, "exposureBias": 0,
  "thumbhash": "…base64…", "tint": "#1a1c20",
  "sizes": { "webp": [480, 960, 1280, 1920, 2560, 4096], "jpg": [480, 960, 1280, 1920, 2560, 4096], "avif": [480, 960, 1280, 1920] } }
```

URL template, the one contract the front end depends on:
`<PHOTOS_PUBLIC_BASE>/<gallery>/<slug>/<size>.<format>`, e.g.
`https://img.qsdqsb.com/london/dscf1797/1920.webp`. Sizes are the long edge.
Nothing public is larger than 4096 px. Every tier is re-encoded, so no EXIF
and no GPS ever reaches the public bucket.

## Commands

| Command | Does | Touches R2 |
|---|---|---|
| `npm run photos:push [-- --gallery x] [--dry-run]` | rclone copy of the diff from `photos/` to the originals bucket. Adds and updates only. | write |
| `npm run photos:plan [-- --gallery x]` | Reports new, changed, orphaned files; refuses orphans still named in YAML. | read |
| `npm run photos:prune -- --gallery x [--yes]` | Moves that gallery's orphans to `trash/<date>/…` in the originals bucket. Asks you to type the gallery name. | write |
| `npm run photos:process [-- --gallery x] [--force] [--dry-run] [--local dir] [--no-avif]` | The processor. Runs in Actions; runs locally against a directory with `--local`. | read + write |
| `npm run photos:fetch [-- --local dir] [--strict]` | Pre-build merge into `_data/photo_manifests/`. Never fails a build. | read (HTTP, public) |
| `npm run photos:bootstrap [-- --gallery x] [--dry-run] [--yaml-only] [--force]` | One-time: `gallery/` → `photos/` with frame-number names and injected EXIF; writes YAML skeletons. | none |

### Removing a photograph, the explicit way

1. Delete it from `photos/<gallery>/` locally (or never, and just mark it `hidden: true`).
2. Remove its slug from `_data/photos/<gallery>.yml` if it is named there.
3. `npm run photos:plan` shows it as an orphan.
4. `npm run photos:prune -- --gallery <gallery>` moves the original to `trash/<date>/`.
5. The processor's next run drops its public tiers and manifest entry.

Trash expires after 30 days by an R2 lifecycle rule (set up below). Until
then, moving the object back out of `trash/` restores it on the next run.

## Cloudflare setup (once)

All in the Cloudflare dashboard or with `wrangler`, logged in as the account owner.

1. **Buckets.** Create `qsdqsb-originals` (keep private) and `qsdqsb-photos`.
   On `qsdqsb-photos` → Settings → Custom Domains, connect `img.qsdqsb.com`.
   Add CORS on `qsdqsb-photos` allowing `GET` from `https://qsdqsb.com`
   and `http://localhost:4000` (only the manifest fetch needs it; images do not).
2. **Lifecycle rule** on `qsdqsb-originals`: prefix `trash/`, delete objects
   after 30 days.
3. **API token.** R2 → Manage API tokens → create one with Object Read & Write
   on both buckets. Note the Access Key ID, Secret Access Key, and your
   Account ID.
4. **Queue + notification.** From `workers/photos-trigger/`:
   ```bash
   npx wrangler queues create photos-uploads
   npx wrangler r2 bucket notification create qsdqsb-originals --event-type object-create --queue photos-uploads
   npx wrangler r2 bucket notification create qsdqsb-originals --event-type object-delete --queue photos-uploads
   ```
5. **GitHub token for the Worker.** GitHub → Settings → Developer settings →
   Fine-grained tokens: this repository only, permission *Contents: Read and
   write* (what `repository_dispatch` requires). Then:
   ```bash
   npx wrangler secret put GITHUB_TOKEN     # paste the token
   npx wrangler deploy
   ```
6. **Deploy hook.** Cloudflare Pages → the site project → Settings → Builds →
   Deploy hooks → create one; copy its URL.
7. **GitHub secrets** on this repository (Settings → Secrets → Actions):
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `CF_PAGES_DEPLOY_HOOK`. Optional repository *variables*
   `PHOTOS_ORIGINALS_BUCKET` / `PHOTOS_PUBLIC_BUCKET` if the names differ.
8. **Pages build.** Nothing to add: the build fetches manifests over plain
   HTTPS from `img.qsdqsb.com`. If the base ever changes, set
   `PHOTOS_PUBLIC_BASE` in the Pages environment and in `.env` locally.

## Local setup (each machine)

```bash
brew install rclone          # or the platform equivalent
rclone config                # new remote: name r2, type s3, provider Cloudflare,
                             # access key + secret from step 3, endpoint
                             # https://<account-id>.r2.cloudflarestorage.com, acl private
gh auth login                # only needed to trigger the workflow by hand
```

`.env` may set `PHOTOS_RCLONE_REMOTE` (default `r2`), the bucket names, and
`PHOTOS_PUBLIC_BASE`.

## Bootstrap order (the local session)

The cloud session that built this pipeline left `gallery/` tracked and
untouched. The cutover happens locally, in this order, verifying each step:

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
   `npm run serve:fast` to see the merged data in Liquid once the front end
   reads it.
5. When every gallery reports processed and the live site serves from
   `img.qsdqsb.com`: `git rm -r --cached gallery && echo 'gallery/' >> .gitignore`,
   retire `scripts/generate-gallery-assets.mjs` and the `generate:gallery`
   script, commit.
6. Re-collect originals voyage by voyage: replace `photos/<g>/<FRAME>.jpg`
   with the camera file, `photos:push`, done. Same slug, same captions.
7. Later, separately: rewrite git history to drop the 600 MB from every clone.

## Adding a voyage after the cutover

1. `mkdir photos/<voyage>` (or `photos/<parent>/<child>`), drop the camera files in.
2. `npm run photos:push -- --gallery <voyage>`.
3. Create `_voyage/<voyage>.md` with `gallery_name: <voyage>` as today.
4. Optionally `_data/photos/<voyage>.yml` with captions. Not required for the
   photographs to show.
5. Commit and push. The processing workflow has already run by the time the
   site builds; if not, the nightly run or the next deploy catches up.

## Guards and tests

- `npm test` covers slug parsing, the manifest merge, and an end-to-end
  processor run over a filesystem store with generated images, including the
  assertion that no EXIF reaches a public tier.
- `npm run photos:fetch` validates authored YAML shape and reports unmatched
  slugs; `--strict` makes that a non-zero exit for CI.
- `scripts/check-gallery-integrity.js` keeps validating `gallery_name`
  against `gallery/` until the cutover; after it, the integrity check should
  read `_data/photo_manifests/_index.json` instead. That change belongs to
  the cutover commit.
