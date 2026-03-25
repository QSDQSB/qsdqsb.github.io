---
name: gallery-integrity-audit
description: Validate `gallery_name` path contracts, thumbnail structure, and parent/subgallery linkage consistency.
---

# Gallery Integrity Audit

## Use This Skill When
- Editing voyage/subvoyage entries with `gallery_name`.
- Touching gallery assets or thumbnail conventions.

## Workflow
1. Enumerate touched `gallery_name` values.
2. Validate path existence for gallery and thumbnails.
3. Validate parent/subgallery relation consistency and avoid orphans.
4. Emit `DATA-002` and relevant `CT-*` findings.

## Enforcement Mapping
- `../../data-integrity.md`
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- Path-level evidence and exact missing/mismatched location.
