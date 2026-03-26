# Decision Confidence Governance

Defines how decisions are escalated when confidence is low, and prevents maintainability drift from over-tunable CSS/SCSS changes.

## Confidence Threshold Rule

- Use `0.90` as the explicit confidence threshold for material implementation choices.
- If estimated confidence is below `0.90`, obtain explicit user approval before any repo-mutating action for that choice.
- "Material choice" includes decisions that can affect architecture, visual system behavior, selector/token structure, or long-term maintenance cost.

## Explicit Approval Protocol

When confidence is below `0.90`, provide:
1. The decision to be made.
2. Recommended option and rationale.
3. Tradeoffs or risks.
4. Explicit approval reference from the user before mutation.

## Anti-Tunability Principle

- Do not mistake local tunability for good architecture.
- Every new variable increases maintenance cost unless it encodes a genuinely reusable design decision.
- Prefer reuse of existing tokens, mixins, utilities, placeholders, and component patterns.

## New Variable Admission Criteria

A new token/variable is allowed only when all are true:
1. Reusable in multiple places (not a single selector patch).
2. Represents a meaningful semantic design decision.
3. Cannot be expressed cleanly with existing tokens.
4. Improves maintainability versus inline/local alternatives.

Disallowed examples:
- selector- or page-specific variables that expose internal visual knobs.
- one-off offset/opacity/blur/timing variables for a single element.

## Magic Number Discipline

- Avoid arbitrary one-off values for spacing/sizing/opacity/radius/timing when an existing scale token is close enough.
- If a custom literal is unavoidable, document the concrete visual or technical constraint and why existing scales fail.

## Visual Delta Confirmation Gate

- For cleanup/refactor replacements that change numeric design values, treat the change as major when either is true:
  - relative delta `>= 20%`, or
  - absolute delta `>= 0.25rem` (or equivalent domain threshold for non-rem units).
- Major deltas require explicit user confirmation before mutation.
- Minor deltas that preserve intent (for example `0.21rem -> 0.2rem`) are acceptable.

## Required Change Reporting

For each CSS/SCSS or design-system-affecting change, report:
- Existing tokens/patterns reused.
- New variables introduced (if any).
- Why each new variable was required.
- Remaining magic numbers and why they could not be removed.
