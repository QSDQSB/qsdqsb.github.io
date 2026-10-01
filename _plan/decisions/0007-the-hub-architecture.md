# 0007 · The hub's architecture

**Status:** Accepted 2026-10-01 under delegation ([0001](0001-who-decides-what.md)); the structure is
tier 0. Two switches in it are the owner's: the daily run, and whether that run may push. The owner
switched both on on 2026-10-01 (Q10, option A): daily, and it may push a branch that touches only the
plan; never `master`, never a pull request.
**Date:** 2026-10-01
**Deciders:** the owner (the switches, and anything that leaves this machine); Claude (the rest)
**Builds on:** [0006](0006-the-hub-keeps-itself.md), which says why the hub must keep itself. This
record says how, with the options weighed and the ways it can fail.

## Context

The hub has to do four things for years, across many sessions that share no memory:

| It must be | Meaning | The force against it |
|---|---|---|
| **Automatic** | It runs without anyone remembering to run it | Sessions start cold; hooks exist only inside Claude Code; nothing runs between sessions |
| **Interactive** | The owner decides from one page, on any device | A published page cannot write to git; the owner is not at a terminal |
| **Scalable** | It grows with features, findings and sessions without rotting | Single files conflict when two sessions append; hand-kept indexes drift; ids collide |
| **Long-lived** | It still tells the truth in a year | Plans go stale silently; a check that cries wolf gets muted |

Constraints: a static site on Cloudflare Pages; one owner, who approves every push; a public repo;
Claude Code sessions on a Mac and in the cloud; an existing `@claude` GitHub Action and a Claude
review on every pull request.

## Decision

**Git holds the truth. Everything else is a view of it or a way into it.**

```
                 ┌───────────────────────── the owner ─────────────────────────┐
                 │   command centre (Artifact)        choice pages (Artifact)  │
                 └──────▲───────────────┬──────────────────▲──────────┬────────┘
              generated │               │ answers          │ shots    │ picks
              from git  │               ▼ (page's store)   │          ▼
 ┌──────────────────────┴───────────────────────────────────────────────────────┐
 │  _plan/  roadmap · queue · principles · language · decisions · stages ·      │
 │          features · changelog · findings · ideas · studies      (git, truth) │
 └───▲───────────▲──────────────▲──────────────▲───────────────▲────────────────┘
     │ brief     │ plan.mjs     │ check-plan   │ reviewer      │ /hub-daily
 SessionStart   sessions      the gate       before the      scheduled
 hook           write here    (and CI)       owner sees it   upkeep
```

1. **State:** Markdown and JSON in `_plan/`, one file per stage, decision and study. Written through
   `scripts/plan.mjs` wherever the edit is routine, so every session writes the same shape.
2. **Triggers:** four layers, each catching what the one before can miss: the SessionStart hook
   (every session), the gate (every change), CI on push (every tool), the daily run (no session at
   all).
3. **The owner's side:** one generated page. Answers are stored with the page, keyed by ids that
   are never reused, and pulled into git by the next session or the daily run.
4. **Scale:** ids never reused and checked for duplicates; append-only files merged by union; views
   generated, never hand-kept; size and age warned about, not failed.

## Options considered

### Where the state lives

| | A · Git files in this repo | B · A tracker (GitHub Issues, Notion) | C · The page's own database | D · Session memory |
|---|---|---|---|---|
| Complexity | Low | Medium: a second system and its login | Low | None |
| Cost | A few lines of context per session | A connector authorised in every session | None | None |
| Scalability | Good with one file per thing and union merges | Good: built for it | Poor: no history, no review | None: per machine |
| Familiarity | The repo's own conventions | New | New | Already failed once here |

**A, chosen.** A change and its record land in one commit, the plan is present in every clone, and
it can be checked against the code. **B** has the better interface and notifications, but lives
outside the clone: a session without the connector has no plan, which is the failure this hub
exists to prevent. **C** is where answers wait, never where they are kept. **D** is how a stale
index line produced a wrong audit finding on the first day (X06).

### What triggers upkeep

| | Hooks in Claude Code | The gate, by discipline | CI on push | A scheduled agent | Local git hooks |
|---|---|---|---|---|---|
| Fires when | A session starts, edits, ends | A session runs it | Anything is pushed | Daily | A commit is made on one machine |
| Misses | Other tools; no session | A session that forgets | Unpushed work | Nothing, if it is on | Other clones; not versioned |
| Cost | Seconds | Seconds to minutes | Free minutes | Tokens daily | Seconds |

**The first four, layered.** No single trigger is enough: hooks are blind outside Claude Code, the
gate depends on being run, CI sees only what is pushed, and a schedule sees nothing between runs.
Local git hooks are left out: they live outside the repo and would have to be installed on every
clone.

### How the owner's answers come back

| | Chat | The page's store, pulled by sessions | The page writes to the repo | An issue comment to `@claude` |
|---|---|---|---|---|
| The owner's effort | A message, and waiting | A tap | A tap | A comment |
| Delay | None | Until the next session or the daily run | None | Minutes |
| Risk | Lost in a transcript | Answers wait unread | A page holding write access to a public repo | A second place to look |

**The page's store, chosen**, with the delay stated openly on the page and in the brief. A page
that commits would need a token with write access to the repo sitting in a published page: not
worth an immediacy nobody has asked for. The `@claude` route already exists and stays available for
anything urgent.

## Trade-off analysis

- **Truth in git costs immediacy.** The owner's tap is not the plan changing; it is a request the
  next session honours. Accepted: the owner's calls are design calls, not incidents.
- **Layered triggers cost moving parts.** Seven scripts, one hook, three agents, six commands. Each
  is a plain file with an exit code, and `ARCHITECTURE.md` lists them in one table. The alternative,
  one clever trigger, has one way to fail silently.
- **Checks that fail versus checks that warn.** Structure fails the gate (a dead link, a missing
  changelog line, a duplicate id). Size and age only warn (a long queue, an old roadmap). A warning
  that failed would be muted within a week, and then the structural checks go with it.
- **Generated views cost a publish step.** The command centre must be republished to change. A
  hook cannot publish, so the plan records what was last published and the brief says when the
  page is behind.

## Failure modes

| What breaks | What a session or the owner sees | What catches it |
|---|---|---|
| The SessionStart hook does not run (another tool, no Node) | No brief | `CLAUDE.md`, always loaded, routes to `_plan/` itself |
| A change ships with no record | Nothing, at first | `check-plan` in the gate; CI on push; the review on the pull request |
| The plan names a file that moved | `check-plan` fails, naming the row | The gate, on the change that moved it |
| Two sessions append to the changelog | A clean merge | `merge=union` on that file |
| Two sessions append to the inbox | A conflict, settled by hand: a union would hide two findings given the same id | `plan.mjs` refuses to give out an id while the daily run's branch holds ids this checkout lacks |
| Two sessions take the same id | `check-plan` fails, naming the id | The gate after the merge |
| The owner's answers sit unread | The brief repeats it every session | The daily run reads them |
| The command centre is behind the plan | The brief says so; the page shows its build date | `/hub page`, the daily run |
| The daily run is off | The roadmap's review date ages; the brief warns after a month | The owner's switch |
| The gate cries wolf (pixel noise, a build's lockfile) | A red gate on a clean tree | Fixed the same day, or the check goes: a muted gate protects nothing |
| The reviewer misses a fault | A reader meets it | The fault adds a journey or a check, every time |
| The page's address is lost | Nothing | It is in `hub.json`, in git |

## Consequences

- **Easier:** starting a session (the brief says where things stand); making a call (one page);
  trusting a change (it passed a gate the author could not mark); adding a feature (a row, a
  journey, a line).
- **Harder:** a quick unrecorded tweak. The gate refuses it. That is the point, and it is one line
  to satisfy.
- **To revisit:**
  - When the inbox's Taken list passes about 200 lines: archive it by year.
  - When a second person works on the site: answers would need a name beside them.
  - If the owner wants answers to land at once: the `@claude` route, or a signed worker.
  - GitHub Issues as a way in for findings (an issue labelled `finding`, filed by the daily run).

## Action items

1. [x] `scripts/plan.mjs`: findings, queue, changelog written in one shape; ids never reused.
2. [x] Tests for the hub's own tools (`tests/plan-hub.test.js`).
   The idea workshop (`ideas/README.md`, `/idea`): the owner's ideas kept, and returned with what
   they mean, what they would change, their for and against, a trial, a challenge and a verdict
   ([0008](0008-ready-and-done.md); `scripts/lib/plan-ideas.mjs` reads the shape; `check-plan`
   refuses an idea returned without it).
3. [x] `merge=union` for the changelog (not the inbox: its ids must not be merged blind).
4. [x] `check-plan`: duplicate ids fail; a command centre behind the plan warns.
5. [x] `gate.sh` leaves the tree as it found it.
6. [x] CI: the fast gate on every push and pull request (`.github/workflows/gate.yml`). Written and
   run in a clean checkout on this Mac; its first run on GitHub is at the first push.
7. [x] Choices that are only CSS are shot from one build; a worktree is set up by a script.
8. [x] The daily run switched on (the owner's), and whether it may push (the owner's). The owner
   switched both on on 2026-10-01 (Q10, option A, tapped on the command centre): on, daily, and it
   may push a branch that touches only the plan; never `master`, never a pull request. The schedule
   itself is made by the main session; until it has run once, [stage 0](../stages/00-hub.md) carries
   it under "Still owed". The owner's note beside the answer ("Hub can decide PRs but we need
   carefully crafted rules for conditions for an auto PR approval merge to master") is not part of
   this switch: it is kept as [I002](../ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md),
   and nothing merges by itself until those rules are the owner's.
