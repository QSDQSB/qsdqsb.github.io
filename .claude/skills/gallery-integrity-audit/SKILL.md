---
name: gallery-integrity-audit
description: Validate that `gallery_name` frontmatter values resolve to processed photo manifests (so the Photobook isn't empty), that no gallery under `photos/` is orphaned, and that nested parent/sub voyage relationships are consistent. Use whenever `gallery_name` is added or changed in `_voyage/` or `_subvoyage/`, whenever galleries are added, renamed or removed under `photos/` or `_data/photos/`, and whenever the user mentions sub-voyages, parent voyages, or gallery routing.
---

# Gallery Integrity Audit

The Photobook reads one thing: the gallery's merged manifest, `site.data.photo_manifests[<gallery_name with / → _>]`, written by `npm run photos:fetch` before every build. No manifest, or one with no processed photos, and the page renders an empty Photobook — Jekyll won't error. Nested galleries (`parent/child`) add a second failure mode: sibling discovery is path-substring based, so a misnamed folder makes a child invisible in the "Other <parent>" panel.

## Path contracts

For `gallery_name: <name>`:
- `_data/photo_manifests/_index.json` lists `<name>` as processed, with a non-zero count.
- That usually means `photos/<name>/` was pushed (`npm run photos:push`) and processed, and `_data/photos/<name>.yml` holds its captions. `gallery/` and `images/thumbnails/gallery/` are read by nothing — never check them.

For nested `gallery_name: parent/child`:
- The parent voyage exists and is named `parent` — its file basename is the discovery key.
- All siblings live under `_subvoyage/parent/` so the enumerator's path-substring match finds them.
- The "Other <parent>" panel (`_includes/photobook/end.html`) surfaces up to 3 random siblings; orphans don't crash anything but they confuse the sampling.

## Workflow — run the checker, don't hand-verify

Comparing two directory listings by eye is exactly the task a human or a model
does badly and a script does perfectly. **Run the script; your job is
interpretation and remediation.**

```bash
node scripts/check-gallery-integrity.js           # full audit
node scripts/check-gallery-integrity.js --json    # machine-readable
node scripts/check-gallery-integrity.js --strict  # orphans become errors too
```

It reads `_data/photo_manifests/_index.json`; with no index yet it exits 2 —
run `npm run photos:fetch` first.

`npm run check:gallery` is the same thing.

Three finding levels, and the distinction matters:

- **error** — a referenced gallery has no manifest, isn't processed yet, or
  shows no photos (all hidden?). The page renders an empty Photobook. Fix the
  frontmatter, or push and process the photos (`_docs/photos-pipeline.md`;
  a push to R2 waits for the user's explicit go).
- **warn** — the manifest carries a note from the pipeline; read it.
- **orphan** — a gallery under `photos/` no voyage points at. Often the real
  signal is the *opposite* of what it looks like: photos exist and the
  sub-voyage simply forgot its `gallery_name`. Check that before removing
  anything.

Pair this with `node scripts/check-frontmatter.js`, which validates the
per-page contract (required keys, `map:` shapes, parent/child placement). The
two converge: a directory reported orphaned here often shows up there as a
sub-voyage warning about a missing `gallery_name`.

## Then

1. Confirm each finding against the real files before acting.
2. **Never delete or prune photos to satisfy an orphan finding** without
   confirming with the user — an orphan is far more often a missing reference than a dead
   directory.
3. If a finding is wrong, fix the script rather than working around it.

## Output

Report the script's findings grouped by level, each with the concrete
remediation: which key to add, which photos command to run, or which folder
to rename. Never report a PASS you did not get from the script.
