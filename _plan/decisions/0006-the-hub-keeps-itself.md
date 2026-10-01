# 0006 · The hub keeps itself, and lives in this repo

**Status:** In force from 2026-10-01. Where the plan lives was confirmed by the owner the same day:
public, in this repo.

## Context

The owner's worry, in their words: not "a one-off thing that fails one week later or being forgot in
the sea of cloud sessions". A plan dies in three ways. Nobody reads it. Nobody updates it. It says
things that are no longer true. Good intentions fix none of these; mechanisms do.

## Decision

### It is read, because it is put in front of every session

A `SessionStart` hook prints the state of the plan into every session's context, local or cloud:
the current stage, the open calls, the inbox, the last changes, and the rules in one line. A session
cannot start without it. The hook is committed in `.claude/settings.json`, so it travels with the
repo.

### It is updated, because the gate refuses work that skips it

`scripts/check-plan.mjs` is part of `scripts/gate.sh`. A change to what readers get with no line in
`CHANGELOG.md` fails. So does a stage off the roadmap, a decision out of sequence, a dead link, a
feature row naming a file that is gone.

### It stays true, because it is checked against the code

`FEATURES.md` names real files and real journeys, verified on every gate run. The command centre
page is generated from these files, never written by hand, so it cannot disagree with them.

### It is kept, because a scheduled run tends it

`/hub-daily` runs the gate and the plan check, sorts the inbox, reads the owner's answers, refreshes
the command centre and reports upkeep. Its logic is a file in this repo; the schedule only has to
say "run /hub-daily".

### It is one place, because the owner's side is one page

`scripts/hub-page.mjs` builds the command centre from the plan: roadmap, queue with answer
controls, changes, findings, features. It is a private Artifact at one address, readable on any
device. Answers given there are read back by the next session.

## Where it lives

| | In this repo | A private repo as a submodule |
|---|---|---|
| Present in every clone | Yes | Only where the clone has access to the second repo |
| Cloudflare Pages build | Unaffected | Fails at clone unless Pages is given access to the private repo |
| Cloud sessions | See it | See it only if their GitHub access covers both repos |
| A change and its changelog line | One commit | Two commits in two repos, and a pointer to bump |
| The gate's changelog rule | Enforceable | Not atomically |
| Privacy | The plan is public | The plan is private |

**In this repo.** A submodule fails in exactly the way this record exists to prevent: the plan
would be missing from the sessions and builds that lack access, silently. What is sensitive is
small, and has its own place: `_plan/private/` is gitignored. If private notes must also reach
cloud sessions, they go in a private repo cloned into that ignored path by the session, never
declared in `.gitmodules`, so no build ever depends on it.

If the owner would rather nothing about the plan were public, the clean way is to make the whole
site repo private (Cloudflare Pages builds private repos), not to split the plan off. This repo is
a GitHub fork, and a fork cannot be made private in place: it would be re-created as a new private
repo. That is the owner's call and a separate piece of work.

## Consequences

- Every session pays a few lines of context for the brief. That is the price of not forgetting.
- The hub has moving parts: three scripts, a hook, three agents, five commands. They are plain
  scripts with exit codes, and `ARCHITECTURE.md` lists them in one table.
- When a mechanism here turns out to nag without cause, it is fixed or removed the same day. A
  check that is muted protects nothing.
