Take an idea of the owner's through the workshop: `$ARGUMENTS`

The owner should be able to say one sentence and get back something they can decide on, already
argued through and already tried (`_plan/ideas/README.md`, `_plan/decisions/0008-ready-and-done.md`).
Their time goes on the decision and the conversation. Checking is yours.

1. **Keep it, verbatim.** `node scripts/plan.mjs idea "<the words exactly as given>"`. Do not tidy
   the wording. If `$ARGUMENTS` is empty, look for unfiled ideas instead: any `raw` file under
   `_plan/ideas/`, and the command centre's `ideas` collection (`ArtifactData`, `action: "list"`,
   the `url` in `_plan/hub.json`); file each of those the same way, then delete its document.
2. **Shape it.** Hand the file to the `design-lead` agent with the job "Shape an idea". It makes
   the idea explicit (every reading of the sentence, and the one taken), gives it two or three
   shapes, weighs what it changes in the site as it stands, checks its fit, lists what speaks for
   and against it, names what must be true for it to be delivered, and leaves at most three questions.
3. **Brainstorm, if the owner is here.** When the owner is in the conversation, put the lead's open
   questions to them now (`AskUserQuestion`, three at most, the recommendation first) and give the
   answers to the lead. When they are away, the questions wait on the command centre.
4. **Try it.** For each row of "Can it be delivered", the riskiest first: write the smallest script
   that would show it false, run it against the built site (`bash -lc 'npm run visual:build'`, then
   Playwright in Chromium and WebKit), and fill in what happened: **proved**, **failed**, or **open**
   with how it will be tried. Keep the script in the scratchpad or a worktree
   (`scripts/prototype-setup.sh`); it is never committed. A larger trial is a `prototyper` agent's.
   A fault the trial turns up in the site is a finding (`node scripts/plan.mjs finding`).
5. **Have it challenged.** Hand the file to the `site-reviewer` agent with the job "Challenge a
   proposal". Give it the file, not your opinion of it.
6. **Settle it.** Send the challenge and the trial's results back to the same `design-lead` agent. It
   answers each objection in the file (answered, changed, or stands), alters the proposal where the
   objection is right, and gives the verdict.
7. **Read what came back** before passing it on. `node scripts/check-plan.mjs` refuses a shaped idea
   with a part missing; what it cannot judge is yours to: a fit verdict that quotes no line, a row
   written without reading the file, a "proved" nobody ran, an Against list softer than the For, an
   objection argued away that should stand, a verdict that only restates the idea.
8. **Return it to the owner.** Rebuild and republish the command centre (`npm run hub:page`, publish
   `design/hub/hub.html` to the `url` in `_plan/hub.json`, then `node scripts/plan.mjs published`).
   Tell the owner in five lines: the verdict, what the idea became, what it would change, what the
   trial and the challenge found, and what you need from them.
9. **When the owner answers** (Pursue, Park or Drop at `answers/I00N`; the questions at
   `answers/I00N-1`, `-2`, `-3`): `node scripts/plan.mjs decide I00N pursue|park|drop "<their note,
   and their answers>"`. Pursue → a study with prototypes (`/choose`) if the look or the behaviour is
   open; otherwise `--to staged` and a task in the stage that holds it (the stage still asks the owner for
   anything a reader sees anew: `/stage` and the reviewer refuse tier 2 work with no answer on record). Park or Drop → the file
   stays, with the reason. A question the owner left untapped stays open: the study does not assume
   its answer. An owner's decision that differs from the lead's verdict is not argued with.

Do not build the idea in this command. It ends with the idea in front of the owner, ready to decide on.
