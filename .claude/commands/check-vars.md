Run the single-use variable audit on `_sass/_variables.scss`.

By default, runs in `--all` mode and lists every variable in the file with fewer than the required number of callsites. To check only variables newly added in the working tree, run `python3 scripts/check-single-use-variables.py --new-only`.

```bash
python3 scripts/check-single-use-variables.py --all
```

Report the findings, grouped by component family if patterns emerge (e.g. `$nav-action-*`, `$overlay-hero-*`). For each violation, suggest either:
- inlining the value at the single callsite (the dominant remediation), or
- marking the definition with `// @keep` if the variable is intentionally scaffolded ahead of a planned second use.

If the user wants a full cleanup pass rather than just an audit, switch to the `css-scss-janitor` skill workflow.
