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

## Workflow

1. List every `gallery_name` value in the touched frontmatter.
2. For each value, check both directories exist and that filenames match between them. The thumbnail directory missing files for some images is the most common failure — it usually means the thumbnail generator wasn't run.
3. For nested values:
   - Confirm the parent voyage file exists with the expected basename.
   - List siblings actually present under `_subvoyage/<parent>/` and confirm they all use the `parent/<sibling>` form.
4. Flag orphans, missing thumbnails, filename mismatches, and parent/child naming drift.

## Output

For each `gallery_name` value, report:
- `RESOLVED` or `MISSING: <expected path>`.
- Filename mismatch count if any (e.g. "3 full images without matching thumbnails").
- For nested galleries: sibling count and any orphans.
- Remediation — usually `bundle exec rake generate_thumbnails` or a folder rename.
