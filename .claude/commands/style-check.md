Run the `css-token-steward` skill workflow against the current git diff (or working-tree changes if there's no diff).

Specifically:

1. List every theme-affecting declaration in the diff (colour, shadow, gradient, radius, spacing, timing).
2. For each, check whether an existing token in `_sass/_variables.scss` already covers it. If yes, recommend replacing the literal.
3. Flag any newly-added variables in `_variables.scss` and verify the multi-use rule (≥2 callsites or extends a global scale).
4. Flag any new classes without selector-reuse evidence.
5. Run `bash scripts/check-responsive-policy.sh` and fold its result into the report.
6. Run `python3 scripts/check-single-use-variables.py --new-only` and fold its result into the report.

Report PASS / WARN / FAIL with file:line evidence and concrete remediation. Group findings by category so the user can act on them one batch at a time.

This is the manual entrypoint for the same checks the `css-token-steward` skill auto-fires for during `_sass/` edits — use it when you want a deliberate audit pass over what you've already changed.
