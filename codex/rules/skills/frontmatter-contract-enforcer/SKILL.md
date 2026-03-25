---
name: frontmatter-contract-enforcer
description: Validate touched markdown/frontmatter files against collection contracts and conditional map/gallery/subgallery requirements.
---

# Frontmatter Contract Enforcer

## Use This Skill When
- Editing `_posts`, `_pages`, `_voyage`, or `_subvoyage`.
- Adding pages with map/gallery/subgallery behavior.

## Workflow
1. Identify collection type for each touched content file.
2. Validate required keys and conditional pairings.
3. Validate map/gallery related keys where present.
4. Report `CT-001`, `CT-002`, `CT-003` outcomes with file-level evidence.

## Enforcement Mapping
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- Deterministic key-missing and key-incompatibility findings.
