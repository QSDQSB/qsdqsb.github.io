---
name: css-theme-refactor
description: "Perform safe class-first CSS refactors: reuse existing selectors, promote values into `_sass/_variables.scss`, and only add new classes with documented necessity."
---

# CSS Theme Refactor

## Use This Skill When
- A style request can likely be satisfied by extending existing classes.
- There is selector sprawl or duplicated visual patterns.
- You need to reduce ad hoc CSS and standardize via tokens.

## Workflow
1. Identify visual goal and target module (`_sass/_navigation.scss`, `_sass/_page.scss`, etc.).
2. Inventory existing selectors that can satisfy the goal.
3. Refactor by extending/reusing existing selectors first.
4. Introduce or normalize tokens in `_sass/_variables.scss`.
5. Add a new selector only if required by semantics or regression safety.
6. Record rationale when adding any new selector.

## Enforcement Mapping
- Primary policy: `../../css-theme-governance.md`.
- Validation: `../../quality-gates.md` (`CSS-001..CSS-004`).

## Output Contract
- Provide:
  - selectors reused/extended
  - tokens added/used
  - any new selector rationale
  - PASS/WARN/FAIL summary
