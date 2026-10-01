# Ideas

Where a thought goes to be taken seriously. The owner says it in their own words, in chat (`/idea …`)
or on the command centre; it is kept exactly as said, and then worked through. An idea is not ready
for the owner ([decisions/0008](../decisions/0008-ready-and-done.md)) until it carries six things:
**what it means, made explicit; what it would change in the site as it stands; what speaks for it and
against it; whether it can be delivered, tried and not supposed; what a second reader objected to;
and a verdict.** The owner's time goes on the decision and the conversation, never on checking.

1. **Kept.** The words, verbatim, in a file of its own: `I001-short-name.md`. Status `raw`.
2. **Made explicit.** The brainstorm. The sentence is read every way it can be read, and one reading
   is taken, with the reason. Then: who it is for, the parts that would have to exist, what it
   assumes, what it does not ask for. Whatever the words leave open and the principles cannot settle
   becomes a question for the owner, answerable in a tap.
3. **Given shapes.** Two or three forms it could take, the smallest honest one first. An idea that
   does not fit as said often fits once turned.
4. **Weighed against the site as it stands.** What it changes, part by part: pages, addresses,
   shared pieces, scripts, data and the photo pipeline, the build and its weight, the pictures and
   privacy, other stages and open calls, upkeep. Each with what is there today, what would change,
   and how large the change is. The files are read, not guessed at. How the site is built
   ([`ARCHITECTURE.md`](../ARCHITECTURE.md), [`FEATURES.md`](../FEATURES.md)) is weighed here and
   nowhere else. What the idea must wait for, as distinct from what it changes, goes on a
   `**Waits on:**` line under the verdict: a precondition is often the true cost.
5. **Checked for fit.** Against the owner's standing calls ([`PRINCIPLES.md`](../PRINCIPLES.md)), the
   design language ([`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md)) and what was tried before
   ([`studies/`](../studies/README.md)). A conflict is quoted, not smoothed over. It ends **fits**,
   **fits if turned**, or **conflicts**.
6. **For and against.** Two plain lists, the strongest first, five lines each at most. Against is
   written as hard as For: a cost to a reader, to the pictures, to the site's weight, to the
   owner's time.
7. **Tried.** "Can it be delivered": what must be true for it to be built, each one tried in code
   against the built site (a throwaway script, a spike in a worktree; never committed) and marked
   **proved**, **failed** or **open**. Open means it cannot be tried here (a real phone, a real share
   sheet) and says how it will be. The riskiest assumption is tried first. A trial that turns up a
   fault in the site files it as a finding.
8. **Challenged.** The site reviewer, who did not shape the idea, argues against it and checks its
   claims against the code ("Challenge a proposal"). Each objection is marked **Answered**,
   **Changed** (the proposal was altered) or **Stands** (the owner should weigh it).
9. **A verdict.** The lead's own, given after the trial and the challenge, one of four, said first
   and said plainly: **Pursue** (the idea fits; a sentence that left things open and was read one way
   is still Pursue), **Pursue, turned** (only when the fit check ends "fits if turned" or
   "conflicts": build this shape, not the idea as said), **Park** (not now, and what would bring it
   back) or **Drop** (and why). With what would change the verdict, and a `**Waits on:**` line when
   something must be settled first.
10. **Returned.** Status `shaped`: it appears on the command centre with its verdict, what it waits
    on, its for and against and its questions; the rest opens when asked. The owner answers the
    questions, taps Pursue, Park or Drop, and may leave a note. The lead's verdict is advice: the
    decision is the owner's. **Pursue means the step named under "Next" and nothing more**: usually
    a study. Building what a reader sees is a later call of the owner's, made on the study's
    pictures. A question left untapped stays open, and nothing is built on a guess at its answer.
11. **Onward.** Pursued: a study with prototypes ([`WORKFLOWS.md`](../WORKFLOWS.md), paths 4 and 5),
    then a stage. Parked or dropped: the file stays, with why, so it is not shaped again from nothing.

The design lead may raise an idea of its own (`node scripts/plan.mjs idea "…" --by lead`). It takes
the same path; two at most wait on the owner at a time.

Steps 2 to 6 and 9 are the design lead's ("Shape an idea"), step 7 the session's or a prototyper's,
step 8 the site reviewer's. The status stays `raw` until step 9 is done. `/idea` runs them in order, and a session does so unasked for every
`raw` idea it finds. `check-plan` refuses a shaped idea that is missing its verdict, its reading,
what it changes, its for and against, its trial or its challenge.

## Statuses

`raw` → `shaped` → `study` → `staged`, or `parked`, or `dropped`.

## One file per idea

```
# I001 · A short name for it

**Status:** raw · **Raised:** YYYY-MM-DD by the owner · **Stage:** none yet

## In the owner's words
> exactly as said

## Verdict
**Pursue, turned.** What to build and why, in two or three sentences. What would change this.

**Waits on:** what must be settled before it can ship, if anything.

## Made explicit
## Shapes it could take
## What it changes
| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | … | … | none, small, medium or large |

## Can it be delivered
| What must be true | How it was tried | Result |
|---|---|---|
| … | the script, the engine, the number | proved, failed or open |

## Does it fit
## For and against
**For**
- …

**Against**
- …

## Challenged
By: the site reviewer, YYYY-MM-DD.
- **Answered:** the objection, then the answer.
- **Changed:** the objection, then what was altered.
- **Stands:** the objection the owner should weigh.

## Questions for the owner
### 1 · The question, in a line
- **A (recommended):** …
- **B:** …

Why: one line.

## Next
```

The verdict is written last and read first, so it sits under the owner's words. The questions take
the queue's shape so the command centre can make each one a tap; its answers are stored as
`I001-1`, `I001-2`.

**Small print.** An objection that is partly right is two lines: what it changed, and what still
stands. A question's number is not reused once the idea has been on the command centre (its answers
are stored by it); before that, number them 1, 2, 3. "What it changes" is weighed for the largest
shape still in play, with a line on how the others differ. A trial that only reads built data is
the lead's to run; one the lead ran after the challenge is re-run by the session before the idea is
returned.

**Length.** The command centre shows the verdict, what it waits on, the for and against, the
questions and the next step; the rest opens when asked. The verdict and what it waits on fit the
first phone screen; each list is five lines at most. The folded sections may run as long as the
evidence needs.

- `node scripts/plan.mjs idea "<the words>"` writes the file with the next number. Numbers are never
  reused.
- `node scripts/plan.mjs decide I001 pursue|park|drop "<the owner's note>"` records the owner's
  decision under the verdict and moves the status (`--to staged` when a pursued idea needs no study
  and goes straight to a stage).

The two tables beside this file ([voyage and gallery](voyage-and-gallery.md),
[colour pages](colour-pages.md)) are older thoughts gathered by theme; a thought there that is taken
up gets a file of its own.
