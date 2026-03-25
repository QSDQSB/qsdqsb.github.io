---
name: responsive-layout-auditor
description: Enforce desktop-first/mobile-required responsive behavior and mandatory user confirmation for any visual desktop/mobile divergence.
---

# Responsive Layout Auditor

## Use This Skill When
- Editing visual layout, spacing geometry, typography placement, or component arrangement.
- Introducing breakpoint-specific behavior in `_sass` or layout templates.

## Workflow
1. Validate desktop baseline first.
2. Validate mobile-small usability and no horizontal overflow.
3. Detect any visual divergence between desktop and mobile-small.
4. If divergence is detected, require explicit user confirmation and record `confirmation_reference`.
5. Emit `RESP-001`, `RESP-002`, `RESP-003`, and `RESP-CONFIRM-001` results.
6. If intake is conceptual and materially ambiguous (architecture/UX/scope), challenge assumptions, provide recommendations with tradeoffs, provide a phased roadmap, and concretize spec before implementation.
7. If missing governance coverage is identified as significant, emit a governance proposal record and require confirmation before creating a new rule/instruction/skill artifact.

## Mandatory Rule
- For this repo, any visual desktop/mobile difference requires user confirmation (`RESP-CONFIRM-001`).
- Missing confirmation is immediate `FAIL`.

## Enforcement Mapping
- `../../responsive-layout-governance.md`
- `../../quality-gates.md`

## Output Contract
- Must include:
  - `breakpoint_profile`
  - `divergence_detected`
  - `confirmation_required`
  - `confirmation_reference`
- Include governance metadata when triggered:
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
