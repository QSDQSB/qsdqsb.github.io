---
name: layout-include-contract-audit
description: Audit Jekyll layout/include/frontmatter contracts and verify existing-class-first behavior for style changes touching layout surfaces.
---

# Layout Include Contract Audit

## Use This Skill When
- Editing `_layouts/*`, `_includes/*`, or frontmatter-heavy pages.
- Changing UI shells that may require CSS selector updates.
- Validating archive/gallery/map/page composition behavior.

## Workflow
1. Validate frontmatter/layout/include contract compatibility.
2. For any style-related change in layout surfaces, verify:
   - Existing selector reuse was evaluated first.
   - New selectors, if any, have rationale.
   - Theme values remain token-backed.
3. Cross-check data-driven dependencies (`_data/navigation.yml`, `_data/tag_colours.yml`, map dataset wiring).
4. If task intake is conceptual and materially ambiguous, challenge assumptions, provide recommendations with tradeoffs, define a phased roadmap, and concretize the implementation spec before code.
5. If a significant missing governance control is found, propose a new rule/instruction/skill and request explicit user confirmation before adding it.

## Enforcement Mapping
- Follow `../../css-theme-governance.md`, `../../quality-gates.md`, and `../../agent-style-checklist.md`.
- Checks covered: `CSS-002`, `CSS-004`, plus contract-level WARN findings.

## Deliverable
- Contract findings with impacted paths and remediation guidance.
- Include governance metadata for significant-gap findings:
  - `proposal_required`
  - `proposal_id`
  - `proposed_artifact_type`
  - `confirmation_required`
  - `confirmation_reference`
- Include concept-clarification metadata when triggered:
  - `ambiguity_detected`
  - `assumptions_challenged`
  - `recommendations_provided`
  - `roadmap_provided`
  - `spec_concretized`
  - `clarification_reference`

## Quick Reference: Page Overlay Hero (Current State)
- Current behavior snapshot:
  - Overlay hero is active when `has-overlay-hero` is present on `<body>` (set from page overlay/swiper conditions in layout).
  - Swiper path renders `div.swiper.page-overlay-swiper.page-overlay-swiper--hero` with slide-level `.page__hero--overlay.page__hero--overlay-home`.
  - Non-swiper path renders `.page__hero--overlay` with the same core copy/media shell.
  - Excerpt reveal/opening scene is runtime-driven by `overlay-opening-scene.js` via `overlay-opening-*` body classes.
- Concise design-choice rationale:
  - Premium readability over heavy effects: stable title/excerpt hierarchy on overlay image.
  - Token-first spacing and motion controls in shared variables.
  - Swiper/non-swiper parity is intentional (including title/excerpt spacing rhythm).
  - Reduced-motion users bypass animated opening flow.
- Essential components map:
  - `_includes/page__hero.html`
  - `_sass/_page.scss`
  - `assets/js/overlay-opening-scene.js`
- Runtime hooks note:
  - `overlay-opening-scene.js` emits `qsd:overlay-opening` (`start`, `finish`, `cancel`) and toggles `overlay-opening-*` classes.
  - `masthead-intent.js` listens to `qsd:overlay-opening` and adjusts nav visibility/lock during the opening sequence.
