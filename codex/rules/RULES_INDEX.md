# Codex Rules Index

This directory is the canonical source for repo-specific rules, instructions, and skills.

## Core Rule Packs
- `preference-classification.md`: Classifier for deciding whether a user preference is a `rule`, `instruction`, or `skill`.
- `design-language.md`: Visual and motion language contract for the site.
- `css-theme-governance.md`: CSS theming governance; token-first and existing-class-first policy.
- `token-scale-governance.md`: Tiered token admission policy (global-first, exception-only) with dedup and evidence requirements.
- `decision-confidence-governance.md`: 0.90 confidence threshold, explicit approval protocol, and anti-tunability guardrails.
- `workflow-contract.md`: Canonical AI execution flow (`prepare -> serve/build -> verify`).
- `content-contracts.md`: Frontmatter contracts by collection and touched-file enforcement.
- `data-integrity.md`: Map/gallery/tag consistency checks.
- `voyage-subvoyage-gallery-behavior.md`: Canonical execution/parameter contract for voyage/subvoyage gallery layout behavior.
- `implementation-notes-contract.md`: Post-implementation tiny note contract under `for_agents/IMPLEMENTATIONS`.
- `responsive-layout-governance.md`: Desktop-first + mobile-required responsive policy and confirmation gate.
- `quality-gates.md`: Validation outcomes and warn-then-block rollout plan.
- `agent-style-checklist.md`: Required execution sequence for style/theme changes.
- `validation-scenarios.md`: Deterministic test cases for gate behavior.

## Skills
- `skills/design-token-steward/SKILL.md`
- `skills/css-theme-refactor/SKILL.md`
- `skills/layout-include-contract-audit/SKILL.md`
- `skills/workflow-orchestrator/SKILL.md`
- `skills/frontmatter-contract-enforcer/SKILL.md`
- `skills/map-pipeline-operator/SKILL.md`
- `skills/gallery-integrity-audit/SKILL.md`
- `skills/js-bundle-guardian/SKILL.md`
- `skills/release-smoke-runner/SKILL.md`
- `skills/responsive-layout-auditor/SKILL.md`
- `skills/exec-plan-maintainer/SKILL.md`
- `skills/token-scale-curator/SKILL.md`
- `skills/css-scss-janitor/SKILL.md`

## Scope Baseline
- Enforcement scope: shell-level globally, strict checks for touched files.
- Rollout: warn-then-block by default.
- Exception: `RESP-CONFIRM-001` is a mandatory confirmation gate.
- Exception: `GOV-CONFIRM-001` is a mandatory confirmation gate.
- Exception: `CONCEPT-CONFIRM-001` is a mandatory confirmation gate.
- Exception: `CONF-CONFIRM-001` is a mandatory confirmation gate.
- CSS token authority: `_sass/_variables.scss`.
- Path reference convention for rule/skill docs: use repo-relative paths (for example `_includes/page__hero.html`), not absolute filesystem paths.
