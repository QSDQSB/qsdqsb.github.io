---
name: js-bundle-guardian
description: Guard JavaScript source/artifact discipline; ensure `_main.js` is treated as source and minified artifacts remain synchronized.
---

# JS Bundle Guardian

## Use This Skill When
- Any task edits files under `assets/js/`.

## Workflow
1. Detect whether source JS behavior changed (`assets/js/_main.js` or plugin sources).
2. Verify minified artifact update expectations (`assets/js/main.min.js`).
3. Flag hand-edited artifact-only changes.
4. Emit `WF-003` findings with remedial command path.

## Enforcement Mapping
- `../../workflow-contract.md`
- `../../quality-gates.md`

## Output Contract
- PASS/WARN/FAIL with source/artifact diff summary.
