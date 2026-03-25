# Quality Gates

Defines output interface, check families, and rollout behavior.

## Outcome Interface

```yaml
status: PASS | WARN | FAIL
check_id: string
file: path
evidence: string
remediation: string
stage: 1 | 2 | 3
breakpoint_profile: desktop | tablet | mobile-small | n/a
divergence_detected: true | false
confirmation_required: true | false
confirmation_reference: string | n/a
proposal_required: true | false
proposal_id: string | n/a
proposed_artifact_type: rule | instruction | skill | n/a
ambiguity_detected: true | false
assumptions_challenged: true | false
recommendations_provided: true | false
roadmap_provided: true | false
spec_concretized: true | false
clarification_reference: string | n/a
plan_required: true | false
plan_path: string | n/a
milestone_count: number | 0
checkpoint_count: number | 0
```

## Check Families

### Preference Classification
- `PREF-001`: Persisted preference has `classification` and `owner_doc`.
- `PREF-002`: Durable cross-feature preference is not left as task-scoped instruction.

### Workflow
- `WF-001`: Canonical sequence applied (`prepare -> serve/build -> verify`).
- `WF-002`: `prepare` includes both thumbnail and geocode preprocess.
- `WF-003`: JS source/artifact sync (`_main.js` -> `main.min.js`) when touched.

### Content Contracts
- `CT-001`: Required frontmatter keys for collection.
- `CT-002`: Conditional-key compatibility (e.g., map/gallery/subgallery modes).
- `CT-003`: Touched-file contract enforcement applied.

### Data Integrity
- `DATA-001`: map dataset-to-cache consistency.
- `DATA-002`: `gallery_name` path/thumbnail consistency.
- `DATA-003`: tag-to-color mapping consistency.

### CSS Theme Governance
- `CSS-001`: Theme literals outside `_sass/_variables.scss` are flagged (exemptions apply).
- `CSS-002`: New classes require rationale and selector-insufficiency evidence.
- `CSS-003`: Theme-affecting values use `_sass/_variables.scss` tokens.
- `CSS-004`: Existing-class-first analysis documented.

### Responsive
- `RESP-001`: Desktop baseline maintained.
- `RESP-002`: Mobile-small layout remains readable/usable.
- `RESP-003`: No horizontal overflow in mobile-small profile.
- `RESP-CONFIRM-001`: Any visual desktop/mobile divergence requires explicit user confirmation.

### Governance Meta-Confirmation
- `GOV-001`: Significant missing governance gap was detected and formally proposed.
- `GOV-CONFIRM-001`: User confirmation exists before introducing a new rule/instruction/skill for a significant gap.

### Concept Ambiguity Clarification
- `CONCEPT-001`: Ambiguity was detected and assumptions were explicitly challenged.
- `CONCEPT-002`: Recommendations with tradeoffs and a phased roadmap were provided.
- `CONCEPT-CONFIRM-001`: Concrete spec was completed before implementation step when concept protocol was triggered.

### Long-Term Execution Plan Governance
- `PLAN-001`: Multi-stage long-term initiatives (with multiple milestones/checkpoints) have a canonical markdown plan under `for_agents/`.
- `PLAN-002`: Plan includes required sections (`Context`, `Scope`, `Milestones`, `Checkpoints`, `Execution Phases`, `Risks & Mitigations`, `Decision Log`, `Progress Ledger`).
- `PLAN-003`: Plan tracks at least 2 milestones and at least 2 checkpoints.
- `PLAN-004`: Plan status is updated when implementation scope/progress changes.

### Safety Scope
- `SCOPE-001`: Ignore `_sass/vendor/**` for strict CSS token checks.
- `SCOPE-002`: No forced global retrofit on untouched legacy files.

## Rollout Policy

### Stage 1 (Warn default)
- Most checks emit `WARN`/`PASS`.
- Provide deterministic remediation with file evidence.

### Mandatory Gate Exception
- `RESP-CONFIRM-001` is enforced immediately.
- If divergence is detected and confirmation is missing, emit `FAIL`.
- `GOV-CONFIRM-001` is enforced immediately.
- If a significant gap is detected and confirmation is missing, emit `FAIL`.
- `CONCEPT-CONFIRM-001` is enforced immediately.
- If ambiguity protocol is triggered and concrete spec is missing before implementation, emit `FAIL`.

### Stage 2 (Block selected high-signal checks)
- Promote to blocking: `WF-001`, `WF-002`, `CT-001`, `DATA-001`, `DATA-002`, `CSS-001`, `CSS-003`, `RESP-002`, `RESP-003`, `PLAN-001`, `PLAN-002`.

### Stage 3 (Block advanced governance checks)
- Promote to blocking: `WF-003`, `CT-002`, `DATA-003`, `CSS-002`, `CSS-004`, `GOV-001`, `CONCEPT-001`, `CONCEPT-002`, `PLAN-003`, `PLAN-004`.
- Keep `RESP-CONFIRM-001` blocking.
- Keep `GOV-CONFIRM-001` blocking.
- Keep `CONCEPT-CONFIRM-001` blocking.

## Regression Safety
- Enforce strictness on touched files first.
- Preserve warn-then-block rollout except explicit mandatory confirmation gates.
