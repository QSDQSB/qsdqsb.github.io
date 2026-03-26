# Validation Scenarios

Deterministic scenarios for current gate families.

## 1. Preference Classification

### Scenario A
- Input: "Site should stay dark editorial by default"
- Expected: `rule`
- Check: `PREF-001`, `PREF-002`

### Scenario B
- Input: "In this ticket, only update map docs"
- Expected: `instruction`
- Check: `PREF-001`

## 2. Workflow

### Scenario C (Missing preprocess)
- Change touches map data and gallery assets, but `prepare` omits one preprocess step.
- Expected: `WF-002` fails at blocking stage.

### Scenario D (JS drift)
- `assets/js/_main.js` touched and `assets/js/main.min.js` unchanged.
- Expected: `WF-003` warning (Stage 1), blocking (Stage 3).

## 3. Content Contracts

### Scenario E (Missing required keys)
- Touched `_voyage/*.md` missing `title` or `date`.
- Expected: `CT-001` warning (Stage 1), blocking (Stage 2).

### Scenario F (Invalid conditional pairing)
- `map_dataset` set but page contract incompatible.
- Expected: `CT-002` warning/block by stage.

## 4. Data Integrity

### Scenario G (Map cache mismatch)
- `map_dataset: rome` referenced, missing `assets/maps/rome.geojson` after preprocess.
- Expected: `DATA-001` warning (Stage 1), blocking (Stage 2).

### Scenario H (Gallery mismatch)
- `gallery_name` points to missing gallery/thumb structure.
- Expected: `DATA-002` warning (Stage 1), blocking (Stage 2).

### Scenario I (Tag color drift)
- Active touched tag has no corresponding mapping.
- Expected: `DATA-003` warning (Stage 1), blocking (Stage 3).

## 5. CSS Theme Governance

### Scenario J (Literal token violation)
- Add `color: #ff00aa;` in `_sass/_navigation.scss`.
- Expected: `CSS-001` warning (Stage 1), blocking (Stage 2).

### Scenario K (Unjustified new class)
- Add `.new-chip-style` with no selector-reuse analysis.
- Expected: `CSS-002` warning (Stage 1), blocking (Stage 3).

## 6. Responsive Governance

### Scenario L (Desktop/mobile divergence, no confirmation)
- Desktop and mobile visuals differ in spacing/alignment.
- No user confirmation reference included.
- Expected: `RESP-CONFIRM-001 = FAIL` immediately.
- Output fields:
  - `divergence_detected: true`
  - `confirmation_required: true`
  - `confirmation_reference: n/a`

### Scenario M (Divergence with confirmation)
- Visual divergence present and user confirmation is linked.
- Expected: `RESP-CONFIRM-001 = PASS`.

### Scenario N (Mobile overflow)
- Mobile-small viewport shows horizontal overflow.
- Expected: `RESP-003` warning (Stage 1), blocking (Stage 2).

## 7. Governance Meta-Confirmation

### Scenario O (Significant gap, no proposal)
- A cross-task reliability gap is detected, but no proposal record is emitted.
- Expected: `GOV-001 = FAIL` at blocking stage.

### Scenario P (Proposal without confirmation)
- Significant gap is proposed, but no user approval reference exists.
- Expected: `GOV-CONFIRM-001 = FAIL` immediately.
- Output fields:
  - `proposal_required: true`
  - `proposal_id: <value>`
  - `confirmation_required: true`
  - `confirmation_reference: n/a`

### Scenario Q (Proposal with explicit confirmation)
- Significant gap is proposed and user approval reference is present.
- Expected: `GOV-001 = PASS`, `GOV-CONFIRM-001 = PASS`.

### Scenario R (Minor local improvement)
- Improvement does not meet significant-gap trigger criteria.
- Expected: no `GOV-CONFIRM-001` fail.

## 8. Concept Ambiguity Clarification

### Scenario S (Ambiguous concept request, no assumption challenge)
- Conceptual design request goes straight to implementation planning/code.
- Expected: `CONCEPT-001 = FAIL` at blocking stage.

### Scenario T (Recommendations or roadmap missing)
- Ambiguity is acknowledged, but recommendations/tradeoffs or phased roadmap are omitted.
- Expected: `CONCEPT-002 = WARN` in Stage 1, `FAIL` in Stage 3.

### Scenario U (No concrete spec before implementation)
- Concept protocol trigger exists, but no concrete spec is completed before repo-mutating changes.
- Expected: `CONCEPT-CONFIRM-001 = FAIL` immediately.
- Output fields:
  - `ambiguity_detected: true`
  - `spec_concretized: false`
  - `clarification_reference: n/a`

### Scenario V (Full clarification path)
- Assumptions challenged, recommendations + tradeoffs provided, roadmap provided, and concrete spec finalized before implementation.
- Expected: `CONCEPT-001 = PASS`, `CONCEPT-002 = PASS`, `CONCEPT-CONFIRM-001 = PASS`.

### Scenario W (Non-trigger request)
- Request is already concrete implementation detail with no material concept ambiguity.
- Expected: no `CONCEPT-*` fail.

## 9. Long-Term Execution Plan Governance

### Scenario X (Triggered project, missing plan artifact)
- Work is clearly long-term and multi-stage, but no canonical plan exists in `for_agents/`.
- Expected: `PLAN-001 = WARN` (Stage 1), `FAIL` (Stage 2).

### Scenario Y (Plan exists but missing required sections)
- Plan file exists, but one or more mandatory sections are absent.
- Expected: `PLAN-002 = WARN` (Stage 1), `FAIL` (Stage 2).

### Scenario Z (Insufficient milestones/checkpoints)
- Plan has fewer than 2 milestones or fewer than 2 checkpoints.
- Expected: `PLAN-003 = WARN` (Stage 1), `FAIL` (Stage 3).
- Output fields:
  - `plan_required: true`
  - `milestone_count: <value>`
  - `checkpoint_count: <value>`

### Scenario AA (Stale plan after scope/progress change)
- Implementation progressed or scope changed, but `Progress Ledger` / `Decision Log` not updated.
- Expected: `PLAN-004 = WARN` (Stage 1), `FAIL` (Stage 3).

### Scenario AB (Non-trigger short task)
- One-off/single-stage task with no meaningful milestone/checkpoint model.
- Expected: no `PLAN-*` fail.

## 10. Implementation Notes

### Scenario AC (Functionality done, no note)
- Functionality implementation is completed, but no note exists in `for_agents/IMPLEMENTATIONS/`.
- Expected: `IMPL-001 = WARN` (Stage 1), `FAIL` (Stage 2).

### Scenario AD (Note exists, incomplete content)
- Note exists but misses one required element (`Behavior`, `Main Change`, or file references).
- Expected: `IMPL-002 = WARN` (Stage 1), `FAIL` (Stage 3).

### Scenario AE (Compliant tiny note)
- Note includes behavior, main change, and relative file references.
- Expected: `IMPL-001 = PASS`, `IMPL-002 = PASS`.

### Scenario AF (Non-trigger planning turn)
- No implementation occurred (planning/discussion only).
- Expected: no `IMPL-*` fail.

## 11. Token Reuse Governance

### Scenario AG (Semantic scale reuse path)
- A style change reuses existing global semantic spacing/radius/type tokens and existing selectors.
- Expected: `TOKEN-001 = PASS`, `TOKEN-003 = PASS`.

### Scenario AH (New token justified)
- No existing semantic-scale token fits; insufficiency and dedup evidence are provided.
- Expected: `TOKEN-002 = PASS`.

### Scenario AI (Per-class custom value despite reusable token)
- Change introduces class-specific padding/size while suitable semantic token exists.
- Expected: `TOKEN-001 = WARN` (Stage 1), `FAIL` (Stage 2).

### Scenario AJ (One-off effect missing rationale)
- A one-off visual effect value is introduced without explicit exception rationale.
- Expected: `TOKEN-004 = WARN` (Stage 1), `FAIL` (Stage 3).

### Scenario AK (New class without selector-reuse evidence)
- New class is added and selector-insufficiency evidence is missing.
- Expected: `TOKEN-003 = WARN` (Stage 1), `FAIL` (Stage 3).

## 12. Output Contract

Each gate output must include:
- `status`
- `check_id`
- `file`
- `evidence`
- `remediation`
- `stage`
- `breakpoint_profile`
- `divergence_detected`
- `confirmation_required`
- `confirmation_reference`
- `proposal_required`
- `proposal_id`
- `proposed_artifact_type`
- `ambiguity_detected`
- `assumptions_challenged`
- `recommendations_provided`
- `roadmap_provided`
- `spec_concretized`
- `clarification_reference`
- `plan_required`
- `plan_path`
- `milestone_count`
- `checkpoint_count`
- `implementation_note_required`
- `implementation_note_path`
- `token_tier_used`
- `reuse_candidates_checked`
- `new_token_required`
- `new_class_required`
- `exception_rationale`
