---
name: gallery-integrity-audit
description: Validate that `gallery_name` frontmatter values resolve to real image and thumbnail directories with matching filenames, and that nested parent/sub voyage relationships are consistent. Use whenever `gallery_name` is added or changed in `_voyage/` or `_subvoyage/`, whenever files are added or removed under `gallery/` or `images/thumbnails/gallery/`, and whenever the user mentions sub-voyages, parent voyages, or gallery routing.
---

# Gallery Integrity Audit

The gallery viewer pulls images from `gallery/<gallery_name>/` and thumbnails from `images/thumbnails/gallery/<gallery_name>/`. If either directory is missing or has filenames that don't match, the viewer renders an empty grid — Jekyll won't error. Nested galleries (`parent/child`) add a second failure mode: sibling discovery is path-substring based, so a misnamed folder makes a child invisible in the related-panel.

## Path contracts

For `gallery_name: <name>`:
- `gallery/<name>/` exists and contains the full images.
- `images/thumbnails/gallery/<name>/` exists and contains thumbnails with **matching filenames** (the renderer pairs them by name).

For nested `gallery_name: parent/child`:
- The parent voyage exists and is named `parent` — its file basename is the discovery key.
- All siblings live under `_subvoyage/parent/` so the enumerator's path-substring match finds them.
- The related-panel surfaces up to 3 random siblings; orphans don't crash anything but they confuse the runtime sampling.

## Workflow — run the checker, don't hand-verify

Comparing two directory listings by eye is exactly the task a human or a model
does badly and a script does perfectly. **Run the script; your job is
interpretation and remediation.**

```bash
node scripts/check-gallery-integrity.js           # full audit
node scripts/check-gallery-integrity.js --json    # machine-readable
node scripts/check-gallery-integrity.js --strict  # orphans become errors too
```

`npm run check:gallery` is the same thing.

Three finding levels, and the distinction matters:

- **error** — a referenced gallery is missing or empty. The page renders a
  broken grid. Content bug; fix the frontmatter or add the images.
- **warn** — thumbnails absent or not matching. Thumbnails are gitignored and
  regenerated on every deploy, so this almost always means "run
  `npm run generate:gallery`", not "the content is wrong".
- **orphan** — a gallery directory no voyage points at. Dead weight shipped on
  every deploy. Often the real signal is the *opposite* of what it looks like:
  images exist and the sub-voyage simply forgot its `gallery_name`. Check that
  before deleting anything.

Pair this with `node scripts/check-frontmatter.js`, which validates the
per-page contract (required keys, `map:` shapes, parent/child placement). The
two converge: a directory reported orphaned here often shows up there as a
sub-voyage warning about a missing `gallery_name`.

## Then

1. Confirm each finding against the real files before acting.
2. **Never delete images to satisfy an orphan finding** without confirming with
   the user — an orphan is far more often a missing reference than a dead
   directory.
3. If a finding is wrong, fix the script rather than working around it.

## Output

Report the script's findings grouped by level, each with the concrete
remediation: which key to add, which generator to run, or which folder to
rename. Never report a PASS you did not get from the script.
