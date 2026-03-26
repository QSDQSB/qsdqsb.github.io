# CSS Theme Governance

This contract governs CSS theme changes in this repository.

## Authoritative Token Source
- Theme tokens must be defined in `_sass/_variables.scss`.
- For theme-affecting values (color, shadows, gradients, spacing rhythm, border radius, motion timings), do not introduce ad hoc literals in component SCSS when a token can be used.
- Apply tiered token policy from `token-scale-governance.md`:
  - Tier 1 global semantic scale first
  - Tier 2 component semantic token only when Tier 1 is insufficient
  - Tier 3 one-off visual exception only with rationale

## Existing-Class-First Policy
Before adding a new class:
1. Locate relevant existing selectors in `_sass/*.scss`.
2. Extend or adjust existing class behavior if it can satisfy the design intent safely.
3. Only create a new class when existing selectors cannot satisfy semantics, would cause regression, or would overfit unrelated components.

## New Class Allowance Criteria
A new class is allowed only when all are true:
- Existing selectors cannot express intent without harmful coupling.
- New selector has clear semantic purpose.
- Values are token-backed from `_sass/_variables.scss`.
- Change notes include rationale and why existing selectors were insufficient.
- Semantic-scale mapping was attempted before class creation.

## Token Admission Criteria
Before adding a token:
1. Document Tier 1/Tier 2 reuse scan.
2. Document dedup check for near-identical existing values.
3. Add a new token only when existing scales are insufficient.
4. If one-off effect is necessary, tag it as Tier 3 exception with visual-intent rationale.
5. Reject local-tunability one-off variables unless they encode reusable semantic value.

## Literal Value Restrictions
- Disallowed in component SCSS (default): raw hex/HSL/RGB for theme properties.
- Allowed locations:
  - `_sass/_variables.scss` (token definitions)
  - vendor files under `_sass/vendor/**`
  - explicitly documented legacy-exemption regions
- Avoid arbitrary one-off numbers for spacing/sizing/opacity/timing in component SCSS when scale tokens are available.

## Mandatory CSS Change Sequence
1. Audit existing class candidates.
2. Map changed declarations to existing semantic-scale tokens first.
3. Reuse/extend existing selector if feasible.
4. If needed, add/extend token(s) in `_sass/_variables.scss` with dedup + insufficiency evidence.
5. Apply token-backed updates to selectors.
6. Add new class only with documented rationale.
7. If any material choice confidence is below `0.90`, get explicit user approval before repo-mutating edits.

## Compliance Outcome
- `PASS`: token-backed change; existing-class-first respected.
- `WARN`: possible improvement (e.g., class could likely be reused).
- `FAIL`: ad hoc theme literal or unjustified new class.
- `FAIL`: below-threshold confidence choice changed without explicit user confirmation.

## Rollout
- Stage 1 (`warn`): report violations and recommend fixes.
- Stage 2 (`block` for literals): block raw theme literals outside approved paths.
- Stage 3 (`block` for class policy): block unjustified new class additions when reusable selectors exist.
