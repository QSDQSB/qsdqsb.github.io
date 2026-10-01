# The plan

One place for where the site is going: the stages, the decisions behind them, what has been found
and what is only an idea. It exists so design, aesthetics and architecture follow one plan and not
whichever session happens to be open.

`CLAUDE.md` says how to work in this repo. `_docs/` says how the site is built. This folder says
**what is being built next and why**.

## Read in this order

1. **[ROADMAP.md](ROADMAP.md)** — the stages, in order, with their status. Start here, every time.
2. **[QUEUE.md](QUEUE.md)** — the calls waiting on the owner. Short by design.
3. **[PRINCIPLES.md](PRINCIPLES.md)** — what the site is, and the owner's standing calls.
4. The stage you are working on, in `stages/`, and the decisions it cites, in `decisions/`.

## What lives where

| Path | Holds | Changes |
|---|---|---|
| `ROADMAP.md` | Stages in order, one line each | When a stage starts, finishes or is re-ordered |
| `QUEUE.md` | Open calls for the owner, each with a recommendation | Added by the design lead; cleared by the owner |
| `PRINCIPLES.md` | Identity, standing calls, what the site refuses | Rarely, and only on the owner's word |
| `decisions/NNNN-*.md` | One decision each: context, options, the choice, consequences | Never edited once accepted; superseded by a new one |
| `stages/NN-*.md` | One stage each: goal, scope, design notes, tasks, exit | As the stage moves |
| `findings/` | Dated audits, and `inbox.md` for one-line observations | Appended; an item leaves the inbox when a stage takes it |
| `ideas/` | Unshaped thoughts, by theme | Freely; promoted to a stage when ready |
| `private/` | Anything not for a public repo | Gitignored |

## Rules

- **A finding gets written down where it is found.** One line in `findings/inbox.md` with the date,
  the page and what was seen. Not in chat, not in a session's memory.
- **A stage is designed before it is built.** Its file says which shared pieces it uses, what is
  new, and what needs the owner. Then the work starts.
- **Work ends with the plan updated.** Tasks ticked, findings closed by id, anything decided on the
  way recorded as a decision.
- **Who decides what** is in [decisions/0001](decisions/0001-who-decides-what.md). Read it before
  asking the owner anything, and before deciding anything visible alone.
- **Statuses:** `idea` → `planned` → `designing` → `building` → `in review` → `done`. Findings are
  `open`, `fix`, `later`, `leave` or `done`.

## Who keeps it

The **design lead** (`.claude/agents/design-lead.md`) keeps this folder: sorts the inbox, writes the
stage briefs, keeps the queue short. The **site reviewer** (`.claude/agents/site-reviewer.md`) is
the gate: nothing reaches the owner until `scripts/gate.sh` passes and the reviewer has checked it
against the decisions here.

## Older notes

`for_agents/` is gitignored and local to one Mac. Its open items, pending issues and the gallery
roadmap were folded in here on 2026-10-01 (`findings/inbox.md`, `ideas/voyage-and-gallery.md`,
`PRINCIPLES.md`). It stays as an archive; new notes go here.
