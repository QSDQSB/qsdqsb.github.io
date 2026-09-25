---
name: gallery-integrity-audit
description: Validate that `gallery_name` resolves to a processed photo manifest, and parent/subgallery linkage consistency.
---

# Gallery Integrity Audit

## Use This Skill When
- Editing voyage/subvoyage entries with `gallery_name`.
- Adding, renaming or removing galleries under `photos/` or `_data/photos/`.

## Workflow
1. Enumerate touched `gallery_name` values.
2. Run `npm run check:gallery`: each `gallery_name` needs a processed manifest with photos in `_data/photo_manifests/_index.json` (run `npm run photos:fetch` first); galleries under `photos/` no voyage references are orphans.
3. Validate parent/subgallery relation consistency and avoid orphans.
4. Emit `DATA-002` and relevant `CT-*` findings.

## Enforcement Mapping
- `../../data-integrity.md`
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- Path-level evidence and exact missing/mismatched location.
