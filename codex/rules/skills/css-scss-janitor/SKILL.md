---
name: css-scss-janitor
description: Use when auditing or cleaning CSS/SCSS entropy in an existing repo without changing intended visual behavior; focus on deduplication, variable unification, and maintainability.
---

# CSS/SCSS Janitor

## Mission
- Act as a cleanup and deduplication specialist for existing styling systems.
- Reduce stylistic entropy without redesigning intended visual behavior.
- Prefer smaller, clearer, more semantic styling with lower maintenance cost.

## Use This Skill When
- A task requests CSS/SCSS cleanup, deduplication, variable unification, or token consolidation.
- Styling diffs contain one-off variables, repeated literals, or arbitrary values.
- A module shows high entropy from deep nesting, redundant breakpoints, or duplicated declarations.

## Detect
1. Variables used only once.
2. Overly local or element-specific variable names.
3. Near-identical variables that represent the same intent.
4. Magic numbers that should map to existing scales.
5. Repeated hard-coded values that should map to existing tokens.
6. Deeply nested selectors that can be simplified safely.
7. Redundant breakpoint overrides.
8. Duplicate animation, spacing, radius, blur, shadow, or opacity definitions.

## Cleanup Rules
1. Reuse, merge, or delete before adding.
2. Do not add tokens during cleanup unless needed to unify repeated patterns.
3. Prefer deleting one-off variables over preserving local tuning knobs.
4. Collapse near-duplicate tokens and keep the most semantic name.
5. Preserve documented/public theme hooks unless compatibility handling is explicitly planned.

## Mandatory Execution Protocol
1. Build a removed/deprecated variable map from `_sass/_variables.scss` diff first.
2. Run a full trace across `_sass/**` (not only touched files) for every deprecated token before mutation.
3. Replace deprecated usage in all matching `_sass/**` files with:
   - canonical unified variable name first,
   - existing semantic token second,
   - literal only when no safe token mapping exists and visual-delta gate passes.
4. Re-run the full deprecated-variable trace after mutation and prove zero references.
5. Run `bundle exec jekyll build` and report exact status explicitly on every janitor execution.
6. If build is blocked by non-CSS upstream errors, report blocker explicitly and continue CSS-specific regression checks.
7. Run `bash scripts/check-responsive-policy.sh` and include result in final report.

## Visual-Delta Gate (Must Confirm)
- Treat replacement as major discrepancy when either is true:
  - relative delta `>= 20%`, or
  - absolute delta `>= 0.25rem` (or equivalent domain threshold).
- Major discrepancy requires explicit user confirmation before mutation.
- Minor discrepancies (for example `0.21rem -> 0.2rem`) are acceptable when intent is preserved.

## Confidence Gate
- If confidence in a mapping/replacement decision is `< 0.90`, obtain explicit user approval before mutation.

## Required Output Format

### A. Audit Summary
- Approximate count of one-off variables.
- Duplicate groups.
- Magic-number hotspots.
- Selectors/components with highest entropy.

### B. Proposed Cleanup Plan
- What will be merged.
- What will be deleted.
- What will be mapped to existing tokens.
- What will remain and why.

### C. Implementation
- Apply cleanup in small, reviewable steps.
- Avoid broad unrelated refactors.
- Explicitly list deprecated-variable usage replacements across `_sass/**`.
- Include value-delta report for replacements and mark any major discrepancies.

### D. Final Report
- List removed variables.
- List merged variables.
- List remaining exceptions.
- Note areas requiring human design judgment.

## Constraints
- Do not perform aesthetic redesign.
- Do not normalize away intentional component variation.
- Do not introduce a parallel architecture.
- Do not replace token spam with a new giant token layer.

## Governance Mapping
- `../../token-scale-governance.md`
- `../../css-theme-governance.md`
- `../../decision-confidence-governance.md`
- `../../quality-gates.md`

## Gate Focus
- `TOKEN-001` to `TOKEN-006`
- `CSS-001` to `CSS-004`
- `CONF-001` and `CONF-CONFIRM-001`
- `JAN-001` to `JAN-004`
- `DELTA-CONFIRM-001`
