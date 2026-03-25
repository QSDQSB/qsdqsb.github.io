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

## 9. Output Contract

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
