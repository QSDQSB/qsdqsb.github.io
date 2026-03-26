# Implementation Notes Contract

Defines the required tiny implementation note that must be written after functionality completion.

## Applicability

Applies when:
- A functionality change is implemented (behavioral or feature-level repo mutation).
- Work reaches a completion point for that functionality batch.

Does not apply to:
- Pure discussion/planning-only turns.
- No-op or formatting-only changes with no behavior impact.

## Canonical Location

- Write notes under `for_agents/IMPLEMENTATIONS/`.
- One note per completed functionality batch.

## Required Tiny Note Format

Each note must include:
- `Behavior`: what the built functionality does.
- `Main Change`: short summary of key implementation delta.
- `File References`: relative paths to relevant changed files.

Recommended filename:
- `YYYY-MM-DD-short-slug.md`

## Minimal Template

```md
# <short title>

- Behavior: <what users/system can do now>
- Main Change: <key implementation change>
- File References:
  - `relative/path/one`
  - `relative/path/two`
```

## Related Checks

- `IMPL-001` implementation note presence
- `IMPL-002` note content completeness
