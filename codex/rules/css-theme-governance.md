# CSS Theme Governance

This contract governs CSS theme changes in this repository.

## Authoritative Token Source
- Theme tokens must be defined in `_sass/_variables.scss`.
- For theme-affecting values (color, shadows, gradients, spacing rhythm, border radius, motion timings), do not introduce ad hoc literals in component SCSS when a token can be used.

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

## Literal Value Restrictions
- Disallowed in component SCSS (default): raw hex/HSL/RGB for theme properties.
- Allowed locations:
  - `_sass/_variables.scss` (token definitions)
  - vendor files under `_sass/vendor/**`
  - explicitly documented legacy-exemption regions

## Mandatory CSS Change Sequence
1. Audit existing class candidates.
2. Reuse/extend existing selector if feasible.
3. If needed, add/extend token(s) in `_sass/_variables.scss`.
4. Apply token-backed updates to selectors.
5. Add new class only with documented rationale.

## Compliance Outcome
- `PASS`: token-backed change; existing-class-first respected.
- `WARN`: possible improvement (e.g., class could likely be reused).
- `FAIL`: ad hoc theme literal or unjustified new class.

## Rollout
- Stage 1 (`warn`): report violations and recommend fixes.
- Stage 2 (`block` for literals): block raw theme literals outside approved paths.
- Stage 3 (`block` for class policy): block unjustified new class additions when reusable selectors exist.
