# Preference Classification

Use this document to classify user preferences into `rule`, `instruction`, or `skill`.

## Decision Tests

### `Rule`
Classify as a `rule` when the preference is:
- Durable (expected to persist across tasks)
- Cross-feature (applies to many pages/components/workflows)
- Default behavior (should be followed unless explicitly overridden)

### `Instruction`
Classify as an `instruction` when the preference is:
- Task/session scoped
- Sequence/priority specific (order of work, one-off implementation direction)
- Not intended as a repository-wide default

### `Skill`
Classify as a `skill` when the preference requires:
- Repeatable multi-step workflow
- Repo-specific heuristics/validation
- Reusable process that can be run across many tasks

## Tie-Break Rules
- If durable and cross-feature, prefer `rule` over `instruction`.
- If procedural complexity is the core value, prefer `skill`.
- If temporary and non-reusable, keep as `instruction`.

## Interface Schema

```yaml
preference_id: string
input_text: string
classification: rule | instruction | skill
scope: repo | subsystem | task
durability: persistent | temporary
enforcement_level: advisory | warn | block
owner_doc: path-to-canonical-doc
```

## Gap Discovery & Proposal Protocol

When an agent discovers missing governance that would materially improve iteration reliability, it must propose it and request user confirmation before adding it.

### Trigger Criteria (Significant Gap)
Trigger this protocol when both are true:
- The gap is reusable across multiple tasks/subsystems, and
- The gap prevents known failure classes (`WF/CT/DATA/CSS/RESP/CONCEPT`) or removes repeated manual steps.

### Mandatory Proposal Payload

```yaml
proposal_id: string
detected_gap: string
proposed_artifact_type: rule | instruction | skill
expected_impact: string
risk_if_missing: string
confirmation_reference: string | n/a
```

### Enforcement Intent
- If trigger criteria are met, user confirmation is required before introducing the new governance artifact.
- This protocol applies to new rules/instructions/skills, not routine edits to existing approved artifacts.

## Concept Ambiguity Clarification Protocol

Use this protocol before finalizing a plan or writing code when a request is conceptual and ambiguous enough to materially change architecture, UX, or scope.

### Trigger Condition
Trigger this protocol when both are true:
- The request is conceptual/design-oriented.
- Key decisions are ambiguous enough to affect architecture, UX, or scope.

### Mandatory Behavior
When triggered, agents must do all of the following before implementation:
- Explicitly challenge assumptions in the request.
- Provide 2-4 concrete recommendations with tradeoffs.
- Propose a phased roadmap.
- Produce a concrete spec that includes:
  - goal
  - success criteria
  - in-scope/out-of-scope
  - constraints
  - acceptance criteria

### Protocol Payload

```yaml
ambiguity_detected: true | false
assumptions_challenged: true | false
recommendations_provided: true | false
roadmap_provided: true | false
spec_concretized: true | false
clarification_reference: string | n/a
```

### Enforcement Intent
- If triggered, clarification and concrete spec are required before final plan lock and before any repo-mutating code change.
- Non-conceptual or already-concrete implementation requests do not trigger this protocol.

## Repo-Mapped Examples

| input_text | classification | why | owner_doc |
|---|---|---|---|
| "Site should be dark editorial boutique with restrained luxury" | `rule` | Durable cross-site design default | `design-language.md` |
| "Use `_sass/_variables.scss` tokens for theme values" | `rule` | Global styling default | `css-theme-governance.md` |
| "Modify existing class before creating a new one" | `rule` | Persistent CSS authoring policy | `css-theme-governance.md` |
| "Implement map docs first, then navigation docs" | `instruction` | Task order only | task thread |
| "In this PR, skip gallery refactors" | `instruction` | Temporary scoping | task thread |
| "Run thumbnails + geocode before build" | `rule` | Workflow-wide default behavior | `quality-gates.md` |
| "When adding voyage posts, validate `gallery_name` and thumbnails" | `skill` | Repeatable repo-specific flow | `skills/layout-include-contract-audit/SKILL.md` |
| "Normalize tag color mappings against `_data/tag_colours.yml`" | `skill` | Reusable taxonomy validation process | `skills/layout-include-contract-audit/SKILL.md` |
| "For this bugfix, only touch `_sass/_navigation.scss`" | `instruction` | Single-task implementation constraint | task thread |
| "Detect one-off hex values outside token file" | `skill` | Reusable validation routine | `skills/design-token-steward/SKILL.md` |
| "Allow cinematic hero motion only as explicit exception" | `rule` | Persistent motion policy | `design-language.md` |
| "Refactor selector reuse before adding new CSS class" | `skill` | Repeatable class-first refactor workflow | `skills/css-theme-refactor/SKILL.md` |
