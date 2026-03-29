# Token Scale Governance

Defines global-first token reuse policy to reduce variable/class sprawl while preserving deliberate visual craft.

## Authority and Objective

- `_sass/_variables.scss` is the authoritative theme token source.
- Default behavior is reuse of shared semantic scales before creating new tokens or classes.
- Local tunability is not a goal by itself; maintainability and reusable semantics are the goal.

## Token Tiers

### Tier 1: Global Semantic Scale (preferred default)
- Use shared reusable tokens for common styling intent:
  - spacing rhythm (padding/margin/gap/inset)
  - radius
  - shadows/elevation
  - type scale
  - key border/surface/text tones
- Most layout and component styling should map to Tier 1.

### Tier 2: Component Semantic Token (allowed when needed)
- Allowed only when Tier 1 cannot represent intent safely.
- Token must still be semantically named and reusable for that component family, not one-selector only.
- One-off element-specific "knob" variables are disallowed.

### Tier 3: One-Off Visual Effect Exception (restricted)
- Allowed only for deliberate visual effect not representable by Tier 1/Tier 2 without regression.
- Requires explicit rationale and must be recorded as an exception in change notes.

## Admission Criteria (New Token/Class)

Before introducing a new token:
1. Scan Tier 1/Tier 2 candidates and document what was checked.
2. Run dedup review for near-identical values already present.
3. Justify why existing tokens are insufficient.
4. For Tier 3, include visual-intent rationale and risk note.
5. Confirm token is reusable in multiple places and improves maintainability.

Before introducing a new class:
1. Perform existing-selector-first analysis.
2. Document why selector reuse/extension is insufficient.
3. Keep values token-backed and mapped to tiers.

## Magic Number Discipline

- Avoid arbitrary literals for spacing/sizing/opacity/radius/timing when semantic scales already provide a close fit.
- If a custom literal remains, include concrete constraint rationale and why scale-based options fail.
- If a desired value is an exact multiple of an existing token, compose it via arithmetic instead of introducing another token.
  Example: use `$transition-time * 2` for `1s` when `$transition-time` is `0.5s`.

## Confidence Escalation

- Apply `decision-confidence-governance.md` to material token/class decisions.
- If confidence in a material choice is below `0.90`, explicit user approval is required before mutation.

## Related Checks

- `TOKEN-001` semantic-scale mapping when available
- `TOKEN-002` new-token insufficiency + dedup evidence
- `TOKEN-003` new-class selector-reuse evidence
- `TOKEN-004` one-off effect exception rationale
- `TOKEN-005` one-off/local-tunability variable rejection
- `TOKEN-006` magic number rationale enforcement
