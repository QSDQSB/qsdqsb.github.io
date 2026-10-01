# 0008 · Ready and done: what reaches the owner

**Status:** In force from 2026-10-01. The aim is the owner's, in the words quoted below. The two
bars, their parts, the limit of two proposals and the cost are Claude's construction of that aim,
made under [0001](0001-who-decides-what.md): the owner may amend any of it.

## Context

The owner, on 2026-10-01: "User should make important decisions, hear Claude's well discussed
proposal and ideas, brainstorm with Claude. Claude should have the essential automatic process to
make sure the idea is justifiable and deliverable instead of wasting user's time to verify and amend
the product quality". And, of an idea: "An idea needs verdict, an idea needs brainstorm to get
explicit, an idea needs an evaluation of its influence to the existing structure, pros and cons".

Until now the owner did three jobs: deciding, checking that a proposal held up, and finding the
faults in what was built. Only the first is theirs. [0001](0001-who-decides-what.md) says which
decisions are the owner's; this record says what state a thing must be in before it is put in front
of them, so that their time goes on the decision and on the conversation.

## Decision

The owner's part is three things: **to decide** what a reader sees anew, **to hear** proposals that
have already been argued through, and **to brainstorm**. Checking whether an idea holds up, whether
it can be built, and whether what was built works is Claude's, done before the owner looks, by
someone other than the author, and by a program wherever a program can decide it.

Two bars. Nothing crosses to the owner below them.

### Ready: before the owner is asked to decide

An idea, the owner's or the lead's, is ready when it carries all of these. `check-plan` refuses an
idea marked `shaped` without them ([`ideas/README.md`](../ideas/README.md)).

| It must be | Meaning | Who | The mechanical part |
|---|---|---|---|
| **Explicit** | Every honest reading of the sentence, and the one taken | The design lead | The section exists |
| **Weighed** | What it changes in the site as it stands, part by part, from the files; what it waits on | The design lead | A table, a size on every row |
| **Argued both ways** | For, and against as hard as for | The design lead | Both lists exist |
| **Deliverable** | What must be true for it to be built, each *tried*: in code, against the built site, thrown away after. What cannot be tried here is marked open, with how it will be | The session, or a prototyper | A table, each row `proved`, `failed` or `open` |
| **Challenged** | Someone who did not shape it argues against it and checks its claims against the code. Each objection is answered, changes the proposal, or stands | The site reviewer | A `By:` line, each objection marked |
| **Judged** | A verdict, given after the challenge: pursue, pursue turned, park or drop, and what would change it | The design lead | It opens with one of the four |

A proposal that fails its own trial, or whose objections stand unanswered, still reaches the owner if
the verdict says so plainly (Park, or Drop). What never reaches them is a proposal nobody tried.

The other two things that reach the owner have bars of their own, older than this one. A choice
between two ways arrives as working prototypes, shot at both widths, with tests from the principles
([0005](0005-choices-arrive-as-prototypes.md)). A call in the queue arrives as a short question with
options and a recommendation ([`QUEUE.md`](../QUEUE.md)). Neither owes a trial and a challenge;
nothing checks them beyond their shape.

### Done: before the owner is shown work

Work is done when all of these hold. The first five are [0001](0001-who-decides-what.md) and
[0006](0006-the-hub-keeps-itself.md), gathered here as one bar.

1. The gate passes: `npm run gate:full` (tests, the guards, the seeded build, the pixel diff, the
   motion audit, the journeys, the iPhone overflow) for anything under `_sass/`, `_layouts/`,
   `_includes/` or `assets/js/`; the fast gate for the rest.
2. The site reviewer, who cannot edit, returns PASS or PASS WITH NOTES. A BLOCK is fixed and
   reviewed again.
3. Whatever a reader does with it has a journey in `scripts/check-journeys.mjs`.
4. What a reader now gets is a line in `CHANGELOG.md`; a new feature is a row in `FEATURES.md`.
5. What could not be checked is said, with how it will be (a real phone, a real share sheet).
6. Where the owner is to judge the look, it arrives as pictures, at desktop and at phone width, on a
   page where a tap answers ([0005](0005-choices-arrive-as-prototypes.md), `scripts/choice-page.mjs`).
   The owner is asked whether it is right, never whether it works.

### When the owner finds a fault anyway

It is the process that failed, not the owner's job that grew. The fix lands with a journey or a
check that would have caught it, in the same change ([0007](0007-the-hub-architecture.md), failure
modes). A fault found twice without a check is a finding against the hub.

### Brainstorming is a conversation

- **With the owner present:** `/idea` puts its open questions to them then and there, three at most,
  each with a recommendation, and folds the answers in before the verdict.
- **With the owner away:** the questions wait on the command centre as taps. An untapped question
  stays open; nothing is built on a guess at the answer.
- **The lead proposes too.** The design lead may raise an idea of its own
  (`node scripts/plan.mjs idea "…" --by lead`). It takes the same path to the same bar, and at most
  two wait on the owner at a time: the owner should hear proposals, not be buried in them.

## Why

- A decision is cheap when the argument has been had. Three taps on a phone, against an hour of
  reading and testing.
- The author of an idea is the worst judge of it, and so is whoever suggested it. A second reader,
  told to argue against, found real faults in every review of this hub so far.
- "It should be possible" is the most expensive sentence in a plan. Trying the riskiest part first
  costs minutes: the first trial under this rule (I001) took one script, and found a fault in the
  live site that no reader had reported.
- A bar that a program checks is a bar that holds when nobody remembers it.

## Consequences

- An idea takes longer to reach the owner: a shaping, a trial and a challenge, about three agent runs.
  It arrives once, and can be decided on.
- `/idea` is longer; the idea file has two more sections; the command centre's card shows them folded.
- The site reviewer has a second job, "Challenge a proposal". It still cannot edit.
- Small things are not ideas. A fault is a finding ([`WORKFLOWS.md`](../WORKFLOWS.md), path 1) and
  goes straight to a stage; it does not owe a trial and a challenge.
- To revisit: if the bar makes small ideas slow, a lighter path for an idea whose every row of "What
  it changes" is `none` or `small`.
