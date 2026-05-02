# `.claude/` — Claude Code Configuration

This directory configures Claude Code for QSD's House of Wonders. The repo's authoring rules and design philosophy live in [`/CLAUDE.md`](../CLAUDE.md); this directory is the *machinery* that makes those rules effective in a Claude Code session.

## What's here

```
.claude/
├── README.md             ← this file
├── settings.json         ← permission allowlist + hooks (committed; team-wide)
├── settings.local.json   ← per-machine overrides (gitignored)
├── commands/             ← slash commands (manual entrypoints)
├── skills/               ← skills that auto-fire based on context
└── agents/               ← specialised subagents with their own context window
```

Plus, in the repo root:

```
scripts/
├── check-responsive-policy.sh        ← raw breakpoint detector
├── check-single-use-variables.py     ← single-use variable detector
├── geocode-maps.js                   ← map data preprocessor
└── hooks/
    ├── post-tool-edit-nudges.sh      ← PostToolUse: file-pattern reminders
    ├── post-tool-variables-check.sh  ← PostToolUse: var-check on _variables.scss edits
    └── stop-variables-check.sh       ← Stop: blocking var-check at end-of-turn
```

## How the pieces work together

Different primitives serve different needs. The mental model:

| Primitive | Triggered by | Use for |
|---|---|---|
| **CLAUDE.md** | Always loaded | Always-relevant rules and philosophy. |
| **Hooks** | File events / turn end | Mechanical, deterministic checks. Either nudges (non-blocking) or gates (blocking). |
| **Skills** | Description-based auto-trigger | Recurring workflows. Claude picks them when the description matches the situation. |
| **Agents** | Explicit invocation | Work that wants its own context window (e.g. surveying every SCSS file). |
| **Slash commands** | User types `/<name>` | Manual entrypoints — when the user wants to *deliberately* run a workflow. |

A typical "edit `_sass/_navigation.scss`" flow:

1. Claude opens the file.
2. **`css-token-steward` skill** auto-fires (description matches `_sass/` edits).
3. Claude makes the edit.
4. **`post-tool-edit-nudges.sh`** fires (PostToolUse), prints "💡 SCSS edited — consider running responsive-policy check".
5. If `_variables.scss` was the file edited, **`post-tool-variables-check.sh`** runs `--new-only` and prints any single-use additions inline.
6. At end of turn, **`stop-variables-check.sh`** fires. If any newly-added variable is single-use, exits 2 → forces Claude to address before yielding.

## Slash commands (9)

Manual entrypoints. Type `/<name>` in Claude Code.

| Command | What it does |
|---|---|
| `/build` | Full pipeline: thumbnails → geocode → jekyll build. |
| `/serve` | Same but ends in `jekyll serve`. |
| `/geocode` | Just `npm run geocode` with before/after `assets/maps/` listing. |
| `/responsive-audit` | Wraps `bash scripts/check-responsive-policy.sh`. |
| `/check-vars` | Wraps `python3 scripts/check-single-use-variables.py --all`. |
| `/style-check` | Manual entrypoint to the `css-token-steward` skill workflow. |
| `/content-check` | Manual entrypoint to the `frontmatter-contract-enforcer` skill workflow. |
| `/js-sync` | Verifies `_main.js` ↔ `main.min.js` are in sync; rebuilds if not. |
| `/commit` | Drafts a properly-formatted (emoji-prefixed) commit message from the current diff. Doesn't run the commit. |

## Skills (5)

Auto-fire based on description matching. Defined under `skills/<name>/SKILL.md`.

| Skill | Auto-fires when |
|---|---|
| `css-token-steward` | Editing `_sass/*.scss`; theme literal added/changed; user mentions tokens. **The multi-use rule lives here.** |
| `css-scss-janitor` | User asks for SCSS cleanup, dedup, refactor; diff has many near-duplicate tokens. |
| `frontmatter-contract-enforcer` | Editing `_posts/`, `_pages/`, `_voyage/`, `_subvoyage/`; touching `gallery_name`, `map_dataset`, etc. |
| `gallery-integrity-audit` | `gallery_name` added/changed; gallery directories touched. |
| `responsive-layout-auditor` | Editing visual layout, spacing, typography, breakpoints. Catches desktop/mobile divergence. |

## Agents (2)

Explicitly invoked, run in their own context window.

| Agent | Purpose |
|---|---|
| `scss-auditor` | Read-only sweep of `_sass/` for single-use vars, near-duplicates, magic numbers, breakpoint violations. Returns a punch list. |
| `voyage-scaffolder` | Generates `_voyage/*.md` or `_subvoyage/**.md` frontmatter for a new voyage, cross-checking tags, gallery dirs, parent linkage. |

## Hooks (3)

Wired in `settings.json`.

| Hook | Fires on | Action |
|---|---|---|
| `post-tool-edit-nudges.sh` | After Edit/Write | Prints reminders for `_main.js`, SCSS, map data, gallery image edits. **Non-blocking.** |
| `post-tool-variables-check.sh` | After Edit/Write | Runs `--new-only` var-check if `_variables.scss` was the edited file. Prints findings inline. **Non-blocking.** |
| `stop-variables-check.sh` | End of turn | Runs `--new-only` var-check. **Exits 2 (blocking) if any newly-added variable is single-use** — forces inline-or-`@keep` resolution before turn yields. |

## Permissions

`settings.json` allowlist covers:

- All build/serve/test commands (`bundle exec jekyll *`, `npm run *`, `npm test *`, `bundle exec rake *`).
- All read-only inspection (`git status/diff/log/show/blame`, `find`, `grep`, `rg`, `ls`, `cat`, `head`, `tail`, `wc`, `diff`, `stat`, `jq`, `sed`, `awk`).
- Project-specific scripts (`scripts/check-responsive-policy.sh`, `scripts/check-single-use-variables.py`, `scripts/geocode-maps.js`).
- `Read(*)` for any file.

`deny` blocks the destructive operations that should always require explicit approval:
- `git push *`
- `git reset --hard *`
- `rm -rf *`

Other write operations (Edit, Write, MultiEdit) are not on the allowlist by design — Claude Code's permission system handles those interactively per-file.

## Adding to this directory

If you're tempted to add a new primitive, decide which kind:

- **A new rule that always applies?** → root `CLAUDE.md`, not a new file here.
- **A workflow that recurs and Claude often gets wrong?** → a skill. Make the description pushy (combat undertriggering); explain the *why* not just the rules.
- **A read-only sweep that would bloat the parent context?** → an agent.
- **A workflow the user wants to deliberately invoke?** → a slash command. Keep it short — a thin entrypoint, not a checklist.
- **A mechanical check that should run automatically?** → a hook (PostToolUse for nudges, Stop for blocks).
- **A check that should work regardless of authoring tool (including by hand)?** → a script in `scripts/` and a git pre-commit hook (the user owns wiring that up).

Don't duplicate logic between primitives. If a slash command and a skill cover the same ground, the command should be a thin invocation that says "run the X skill workflow", not a re-statement of the rules.
