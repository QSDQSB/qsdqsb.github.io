Draft a git commit message for the currently staged (or unstaged-but-modified) changes, following this repo's conventions.

## Format

```
<emoji> <one-sentence imperative summary>

<optional 1-2 sentence justification paragraph if the change warrants it>
```

## Emoji guide

| Emoji | Use for |
|-------|---------|
| ✨ | New feature |
| 🐛 | Bug fix |
| 🎨 | Style / design change |
| ♻️ | Refactor (no behaviour change) |
| 📐 | Rules / governance / config |
| 📘 | Documentation |
| 🗑️ | Remove / delete |
| 🔧 | Tooling / scripts |
| 🚀 | Performance |
| 🔒 | Security |
| 🌐 | i18n / language |
| 🧪 | Tests |

## Workflow

1. Run `git status` and `git diff --staged` (fall back to `git diff` if nothing is staged).
2. Identify the dominant kind of change (feature / fix / refactor / docs / etc.) and pick the right emoji. If multiple kinds are mixed, pick the dominant one and mention the others briefly in the justification paragraph.
3. Write a one-sentence imperative summary (≤72 chars including emoji).
4. If the change has non-obvious rationale (a workaround, a migration step, a constraint that drove the design choice), add a blank line and a 1–2 sentence justification.
5. Present the draft message to the user for review. Do **not** run `git commit` until the user approves.

## What to avoid

- Past-tense verbs ("Added", "Fixed") — use imperative ("Add", "Fix").
- Trailing punctuation on the summary.
- Multi-sentence summaries without the blank-line + paragraph separation.
- Reciting *what* changed when the diff already shows it; explain *why* it changed if non-obvious.
- Mentioning the current task or AI assistance in the body.
