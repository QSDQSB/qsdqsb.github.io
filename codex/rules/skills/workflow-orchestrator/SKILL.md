---
name: workflow-orchestrator
description: Run and validate the canonical repository flow (`prepare -> serve/build -> verify`) with preprocess completeness and stage-specific reporting.
---

# Workflow Orchestrator

## Use This Skill When
- A task modifies maps, galleries, JS bundles, or build behavior.
- You need deterministic execution order and compliance evidence.

## Workflow
1. Plan execution as `prepare -> serve/build -> verify`.
2. Enforce `prepare` includes:
   - `bundle exec rake generate_thumbnails`
   - `npm run geocode`
3. Execute `serve` or `build` path depending on task intent.
4. Emit gate results for `WF-001`, `WF-002`, `WF-003` with evidence.
5. If task intake is conceptual and materially ambiguous for architecture/UX/scope, run clarification before final plan or code:
   - challenge assumptions
   - provide recommendations with tradeoffs
   - provide phased roadmap
   - concretize spec before implementation
6. If a significant missing governance gap is discovered, emit a proposal record and request user confirmation before adding a new rule/instruction/skill artifact.
7. After completed functionality implementation, write a tiny note under `for_agents/IMPLEMENTATIONS/` with behavior, main change, and relative file references.

## Enforcement Mapping
- `../../workflow-contract.md`
- `../../quality-gates.md`

## Output Contract
- Provide PASS/WARN/FAIL and failed stage with remediation.
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
- Include implementation-note metadata when applicable:
  - `implementation_note_required`
  - `implementation_note_path`
