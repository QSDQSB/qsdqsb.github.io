---
name: token-scale-curator
description: Enforce global-first semantic token reuse and controlled token/class admission for CSS changes.
---

# Token Scale Curator

## Use This Skill When
- A task touches `_sass/_variables.scss` or component SCSS theme/layout styling.
- New CSS classes or new design tokens may be introduced.
- You need evidence that global semantic scales were considered first.

## Workflow
1. Inventory Tier 1 global semantic token candidates in `_sass/_variables.scss`.
2. Map changed declarations to existing semantic-scale tokens first.
3. Evaluate existing selector reuse/extension before creating any new class.
4. If new token is still needed, perform insufficiency and dedup checks.
5. If one-off visual effect is required, record exception rationale (Tier 3).
6. Emit gate-aligned results for `TOKEN-001` to `TOKEN-004`.

## Enforcement Mapping
- `../../token-scale-governance.md`
- `../../css-theme-governance.md`
- `../../quality-gates.md`

## Output Metadata
- `token_tier_used`
- `reuse_candidates_checked`
- `new_token_required`
- `new_class_required`
- `exception_rationale`
