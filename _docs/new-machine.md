# A new machine

Everything the site needs is in git or in Cloudflare, except a handful of credentials and the
notes Claude keeps between sessions. This page is what to install, what to put where, and what
not to bother copying. Nothing secret is written here: only the names of things and where to get
them.

## 1. Tools

```bash
brew install ruby node rclone gh exiftool
git clone https://github.com/QSDQSB/qsdqsb.github.io.git && cd qsdqsb.github.io
npm ci
bundle install
npx playwright install chromium webkit   # the pixel diff (Chromium) and the iPhone check (WebKit)
```

- **Ruby:** `.ruby-version` names 3.4.4 for Cloudflare (→ `build.md`, *Ruby on Cloudflare*);
  locally, Homebrew's Ruby builds the site as well (put it on `PATH` as `brew` says; macOS's own
  Ruby is too old).
- **Node:** 18 or newer.
- **wrangler** needs no install: every command runs as `npx wrangler@4`.
- **exiftool** is only for `photos:enrich` (the Fujifilm record for new exports).

## 2. Credentials: put these in place, never commit them

| What | Lives at | Where it comes from | Needed for |
|---|---|---|---|
| rclone remote `r2` | `~/.config/rclone/rclone.conf` | Cloudflare → R2 → Manage API tokens (Object Read & Write, `qsdqsb-originals` and `qsdqsb-photos`). Written by `bash scripts/photos/setup-secrets.sh <account-id>`, which takes the two keys from `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` in `.env` when they are there, else asks. Answer no to replacing GitHub's R2 secrets unless this key can write both buckets; Enter skips the rest. A read-only key reads fine and fails every push with 403 | `photos:fetch` (every build), push, pull, prune, trash |
| Cloudflare login | wrangler's own store | `npx wrangler@4 login` (a browser sign-in) | Workers, D1, R2 admin; `whoami` gives the account id |
| GitHub login | gh's own store | `gh auth login` | PRs, `gh workflow run photos-process.yml` |
| `.env` at the repo root | `.env` (gitignored) | `GEOAPIFY_API_KEY=` from the Geoapify dashboard. Optional: without it `photos:locate` falls back to Nominatim. `RESEND_API_KEY=` from the Resend dashboard (API Keys) for `scripts/send-letter.mjs`; Cloudflare's copy can't be read back. `R2_ACCESS_KEY_ID=` / `R2_SECRET_ACCESS_KEY=` (and optionally `R2_ACCOUNT_ID=`) for `setup-secrets.sh`, above. May also set `PHOTOS_DIR` for originals on an external drive (→ `photos-pipeline.md`, *Local setup*) | `photos:locate`, letters, `setup-secrets.sh` |

Already in the cloud, nothing to do: the GitHub Actions secrets (`R2_*`, `CF_PAGES_DEPLOY_HOOK`),
the Cloudflare Pages variables, and the Worker's `GITHUB_TOKEN`.

The first `photos:enrich` asks macOS to let the terminal control Photos; allow it.

## 3. Check it works

```bash
npm run build
npm test
npm run photos:status            # every gallery processed
```

## 4. The photographs

The camera originals are in the R2 originals bucket. The site builds without a local copy; fetch
them only to add, replace or recolour photographs:

```bash
npm run photos:pull              # about 7 GB into photos/, never overwrites
```

## 5. Don't copy these: they rebuild themselves

| Path | Rebuilt by |
|---|---|
| `_site/`, `_data/photo_manifests/`, `_data/cover_sizes.json`, `images/cover/sized/` | `npm run build` |
| `tests/visual/current/`, `tests/visual/diff/` | `visual:capture` / `visual:diff` |
| `lab/` | `node scripts/photos/dots-lab.mjs` (templates in `scripts/photos/lab/`) |
| `.photos-local/` | caches and logs of the photo scripts. `reverse-geocode.json` holds coordinates, so it never goes to git; `photos:locate` rebuilds it, and the place names it produced are committed in `_data/photo_locations/` |

## 6. Carried by hand: Claude's notes

Two things live outside the repo and are carried over as a folder, not through git:

- **Claude's memory:** `~/.claude/projects/<the repo's path, / as ->/memory/`. On the new machine,
  open Claude Code in the clone once so the folder exists, then copy the files in.
- **`for_agents/`:** handover notes for sessions yet to start (gitignored, → CLAUDE.md,
  *Prior Art*). Copy the folder to the repo root.
