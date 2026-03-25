---
name: release-smoke-runner
description: Run a minimal representative smoke pass across key layout types and surface contract/runtime regressions quickly.
---

# Release Smoke Runner

## Use This Skill When
- Preparing a significant content/theme/layout iteration.
- You need fast confidence before broader verification.

## Workflow
1. Select representative pages for `single`, `gallery`, and map-enabled contexts.
2. Validate baseline render assumptions and no obvious contract breakage.
3. Validate responsive checks at desktop and mobile-small for touched surfaces.
4. Emit `RESP-*`, `CT-*`, and `DATA-*` findings as applicable.
5. If intake is conceptual and materially ambiguous, ensure assumptions are challenged, recommendations + tradeoffs are captured, phased roadmap is present, and concrete spec is finalized before implementation.
6. If a significant cross-task governance gap is identified, create a formal proposal record and require user confirmation before introducing a new governance artifact.

## Enforcement Mapping
- `../../quality-gates.md`
- `../../validation-scenarios.md`

## Output Contract
- Short smoke matrix with PASS/WARN/FAIL and impacted routes/files.
- Include governance metadata when applicable:
  - `proposal_required`
  - `proposal_id`
  - `proposed_artifact_type`
  - `confirmation_required`
  - `confirmation_reference`
- Include concept-clarification metadata when applicable:
  - `ambiguity_detected`
  - `assumptions_challenged`
  - `recommendations_provided`
  - `roadmap_provided`
  - `spec_concretized`
  - `clarification_reference`
