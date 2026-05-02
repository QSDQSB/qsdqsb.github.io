---
name: responsive-layout-auditor
description: Enforce desktop-first / mobile-required responsive policy and catch any visual divergence between desktop and mobile-small that needs explicit user sign-off. Use whenever editing `_sass/*.scss` files that change spacing, sizing, typography, or layout geometry; whenever editing `_layouts/` or `_includes/` files that change visible structure; and whenever the user mentions breakpoints, mobile, responsive behaviour, or layout adjustments. Use even for changes the user calls "small" — small CSS changes routinely break mobile silently.
---

# Responsive Layout Auditor

The site is desktop-primary but mobile-required. Every change must remain usable at mobile-small (the narrowest breakpoint), and any *visual* divergence between desktop and mobile-small — different spacing geometry, different card arrangement, different typography placement, different visibility — needs the user to explicitly confirm it. The reason: divergence is usually a deliberate design decision, but it's also the most common way unintended drift sneaks in. Forcing a confirmation makes the decision explicit.

## Policy

- **Desktop is the baseline.** Validate desktop first, then mobile-small.
- **Use breakpoint mixins** from `_sass/_responsive-policy.scss`. Raw `@media`, `@container`, or `@include breakpoint(...)` calls anywhere outside that file are violations — `scripts/check-responsive-policy.sh` catches them. Run it.
- **No horizontal overflow at mobile-small.** Most-common-bug.
- **Visual divergence requires explicit user confirmation.** Examples that count as divergence:
  - Different spacing or alignment geometry between profiles.
  - Different card or list arrangement (e.g. grid → stack with reordering).
  - Different typography scale or placement.
  - Different visibility — elements hidden on one profile but not the other.

## Workflow

1. Validate desktop baseline. Does the change render the way it's supposed to at the wide breakpoint?
2. Validate mobile-small. Usability, no overflow, content readable, controls reachable.
3. Compare the two profiles. If anything *visually differs* (not just scales smoothly), divergence is detected.
4. If divergence is detected, **stop and ask the user to confirm** before committing. Quote what differs and why you think it's intentional. Record their confirmation.
5. Run `bash scripts/check-responsive-policy.sh` to catch raw breakpoint usage. Include the result.

## Output

- `breakpoint_profile` — which profiles you validated (desktop, mobile-small, optionally tablet).
- `divergence_detected` — true / false, and what differs.
- `confirmation_reference` — the user's explicit confirmation message if divergence exists.
- PASS / WARN / FAIL per check, with file:line evidence.
