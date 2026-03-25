# Responsive Layout Governance

This repository is desktop-primary and mobile-required.

## Baseline Policy

- Desktop (PC) layout is the primary design baseline.
- Every UI change must also support mobile-small widths.
- Designs must fit multiple screen sizes without breaking core readability/actions.

## Breakpoint Policy

- Prefer existing SCSS breakpoint mixin conventions (e.g., `@include breakpoint($x-large)` and sibling tokens).
- Align responsive behavior with breakpoint tokens in `_sass/_variables.scss`.
- Avoid introducing disconnected ad hoc breakpoint systems.

## Mandatory Confirmation Gate

### `RESP-CONFIRM-001`
Any visual desktop/mobile layout difference requires explicit user confirmation.

This includes (non-exhaustive):
- Different spacing/alignment geometry
- Different card/list arrangement
- Different typography scale/placement
- Different visibility/styling of interface blocks

If divergence exists and no confirmation reference is present, the change is non-compliant.

## Responsive Validation Requirements

For touched UI surfaces, verify at least:
- `desktop`
- `mobile-small`

Recommended when relevant:
- `tablet`

## Related Checks

- `RESP-001` desktop baseline preserved
- `RESP-002` mobile-small usability
- `RESP-003` no horizontal overflow on mobile-small
- `RESP-CONFIRM-001` divergence confirmation present
