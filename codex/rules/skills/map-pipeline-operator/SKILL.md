---
name: map-pipeline-operator
description: Validate map dataset integrity from `_data/maps` through generated geojson cache and include/runtime wiring.
---

# Map Pipeline Operator

## Use This Skill When
- Editing map datasets, map pages, map include, or map renderer.

## Workflow
1. Verify referenced `map_dataset` values map to `_data/maps/*.yml`.
2. Verify generated cache expectations in `assets/maps/*.geojson` after preprocess.
3. Verify include/runtime linkage remains valid (`_includes/map.html`, `assets/js/map.js`).
4. Emit `DATA-001` and related `CT-*` findings with remediation.

## Enforcement Mapping
- `../../data-integrity.md`
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- PASS/WARN/FAIL with dataset id, missing artifact, and fix sequence.
