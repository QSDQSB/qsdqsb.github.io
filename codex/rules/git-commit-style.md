# Git Commit Style

Defines the canonical commit message format for this repository.

## Format

```
<emoji> <one-sentence summary>

[optional justification paragraph if the change warrants it]
```

## Rules

- Every commit message **must** begin with a single relevant emoji.
- Follow the emoji with a single space, then a concise one-sentence summary.
- If the change requires further context (e.g. non-obvious rationale, breaking change, migration note), add a blank line after the summary and a short justification paragraph.
- No trailing punctuation after the summary sentence.
- Use present tense, imperative mood (e.g. "Add", "Fix", "Remove", not "Added" or "Fixes").

## Emoji Guide (non-exhaustive)

| Emoji | Use for |
|-------|---------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 🎨 | Style / design change |
| ♻️ | Refactor |
| 📐 | Rules / governance / config |
| 📘 | Documentation |
| 🗑️ | Remove / delete |
| 🔧 | Tooling / scripts |
| 🚀 | Performance |
| 🔒 | Security |
| 🌐 | i18n / language |
| 🧪 | Tests |

## Failure Semantics

- Commit message missing leading emoji: non-compliant.
- Multi-sentence summary (without blank-line separation): non-compliant.

## Related Checks

- `GIT-001` emoji prefix present
- `GIT-002` one-sentence summary on first line
- `GIT-003` justification separated by blank line when present
