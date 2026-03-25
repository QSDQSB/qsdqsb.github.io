---
name: design-token-steward
description: Enforce token-first CSS theming and prevent ad hoc theme literals in component SCSS. Use when editing styles or reviewing styling diffs.
---

# Design Token Steward

## Use This Skill When
- A task changes `_sass/*.scss` or related styling behavior.
- A PR introduces new color/shadow/gradient/motion literals.
- You need to verify `_sass/_variables.scss` token usage consistency.

## Workflow
1. Inspect touched style files and list theme-affecting changes.
2. Check if values map to existing tokens in `_sass/_variables.scss`.
3. If no token exists, define/extend token in `_sass/_variables.scss` first.
4. Verify existing selectors can be reused or extended before proposing new classes.
5. Replace component literals with token references.
6. Exclude vendor paths (`_sass/vendor/**`) from strict checks.

## Enforcement Mapping
- Follow `../../css-theme-governance.md` and `../../quality-gates.md`.
- Checks covered: `CSS-001`, `CSS-002`, `CSS-003`, `CSS-004`.

## Deliverable
- PASS/WARN/FAIL findings with file evidence and concrete remediation steps.
