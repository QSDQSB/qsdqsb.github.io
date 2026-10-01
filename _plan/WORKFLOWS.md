# Workflows

How work moves through the hub. Six kinds of work, each with one path. The commands and agents do
the steps; this page says which path a piece of work is on.

Every path ends the same way: `npm run gate:full`, the `site-reviewer` agent, a line in
[`CHANGELOG.md`](CHANGELOG.md) if a reader gets something different, the stage file ticked. Nothing
is pushed without the owner.

```
                       ┌──────────────── the owner ────────────────┐
                       │  command centre: answers, picks, notes    │
                       └───────▲───────────────────────┬───────────┘
        a call or a choice     │                       │ an answer
                               │                       ▼
 an idea ─► ideas/ ─► shaped ─► a study ─► a stage ─► build ─► gate ─► reviewer ─► CHANGELOG
 a fault ─► findings/inbox ────────────────►   ▲
                                                 └── design lead writes the brief
```

## 1. A fault

Something is broken, slow, inconsistent or inaccessible.

1. **File it**: `/finding <what was seen>`. One line, dated, in `findings/inbox.md`. Do not fix it
   in passing while doing something else.
2. **The design lead sorts it** into a stage, with its tier.
3. **Tier 0 or 1** ([0001](decisions/0001-who-decides-what.md)): `/stage` builds it. The fix reuses
   the grammar; it adds or extends a journey if a reader would notice it breaking again.
4. **Tier 2**: it goes to the queue, with a prototype if it is a choice between ways.

## 2. A new page or feature

1. **Brief** (the design lead, in the stage file): what a reader gets, and the lines of
   `PRINCIPLES.md` that bind it.
2. **Place it in the language** ([`DESIGN-LANGUAGE.md`](DESIGN-LANGUAGE.md)):
   - Which **pattern** is it: doorway, room, viewer, reading page? If none, that is the first
     question for the owner.
   - Which **pieces** does it take from the catalogue? List them.
   - Does it need a **signature**? At most one new one, and it is the owner's call.
   - What does it need that the grammar lacks? Each is a piece to add (path 3) before the page.
3. **Study it** (path 6) if the look is new. The owner sees a design before code: real pages with
   desktop and phone screenshots, or a Figma file.
4. **Build** on the Photobook shell. New feature → a row in [`FEATURES.md`](FEATURES.md) and a
   journey in `scripts/check-journeys.mjs`, in the same change.
5. Gate, reviewer, changelog.

## 3. A new piece of grammar

A control, a surface, a label or a mark that a second page could need.

1. **Check it is new**: `_docs/components.md` and `_sass/_components.scss`. Most "new" pieces are
   an existing one with a different word in it.
2. **Design all its states** before any page uses it: at rest, under the pointer, focused, on,
   pressed, unavailable; on the page ground and over a photograph; at desktop and phone.
3. **Its values come from the scales** ([0002](decisions/0002-one-control-vocabulary.md)). A value
   off the scale is a change to the scale, argued as one.
4. **Add it** to `_sass/_components.scss` with a line in `_docs/components.md` and in the pieces
   table of `DESIGN-LANGUAGE.md`. Never in a page's own partial.
5. A piece readers will see is tier 2 the first time it appears.

## 4. A choice between two ways

`/choose <the question>`. The hub builds the options and the owner picks
([0005](decisions/0005-choices-arrive-as-prototypes.md)):

1. The design lead frames it: one line, two or three tests from the principles, two options (three
   at most), a recommendation. If a standing call already answers it, there is no choice.
2. **A choice of look** is a few CSS rules: each option is the same built page with its rules laid
   over it (`css` in `choice.json`). No worktree, no second build.
   **A choice of behaviour** needs the real thing: one `prototyper` agent per option, each in its own
   worktree made buildable by `scripts/prototype-setup.sh`, in parallel.
3. Each option passes the gate, or it is not shown.
4. `scripts/choice-page.mjs` shoots both at desktop and phone and assembles one page.
5. The owner opens the page and taps. The pick is read back, recorded, and the chosen option is
   built properly. The others are removed.

## 5. An idea

The owner says a sentence. The hub keeps it, makes it explicit, weighs it against the site, tries
whether it can be delivered, has it argued against, and returns it with a verdict
([decisions/0008](decisions/0008-ready-and-done.md)). `/idea <the words>`, or the box on the command
centre.

1. **Kept, verbatim**: `node scripts/plan.mjs idea "<the words>"` writes `ideas/I00N-name.md`, status
   `raw`. The owner's words are never edited.
2. **Worked through** by the design lead ([`ideas/README.md`](ideas/README.md)): made explicit (the
   readings of the sentence, and the one taken); given two or three shapes; weighed against the site
   as it stands, part by part; checked for fit; its for and against listed; three questions at
   most; and what must be true for it to be built. Status still `raw`.
3. **Tried**: each of those is tried in code against the built site, the riskiest first, and marked
   proved, failed or open. The script is thrown away.
4. **Challenged** by the site reviewer, who did not shape it. The lead answers each objection, alters
   the proposal where the objection is right, and gives the verdict (pursue, pursue turned, park,
   drop). Status `shaped`.
5. **Returned**: it appears on the command centre with its verdict first, its questions as taps, and
   Pursue, Park and Drop. `node scripts/plan.mjs decide` records what the owner chose.
6. **Pursued**: a study (below), then a stage. **Parked or dropped**: the file stays, with why.

A session that finds a `raw` idea shapes it without being asked.

## 6. A study

Exploring that should not be repeated.

1. A study is a design question explored with real prototypes. It gets a file in
   [`studies/`](studies/README.md): the question, what was tried, what the owner said about each, what
   was learned. Prototypes live outside git (`design/`, a worktree); their pictures live on the
   study's choice page.
2. **A verdict is kept even when it is a no.** Especially then: "sketched three ways, none felt
   immersive" is what stops a fourth session sketching it a fourth time.
3. A study that ends in a yes becomes a stage, or a task in one.

## What happens without being asked

| When | What |
|---|---|
| A session starts | The plan's state is printed; the owner's new answers and ideas are read; a raw idea is shaped |
| A file is edited | The checks for that file run |
| A turn ends | House style, bundle sync, the `!important` ratchet |
| Before anything is called done | The gate and the reviewer |
| Anything is pushed | CI runs the fast gate and, on a pull request, the changelog rule over the branch |
| Daily | `/hub-daily`: the gate on `master`, answers and ideas read, raw ideas shaped, the inbox sorted, the command centre rebuilt |

## Who does what

| | Decides | Builds | Checks |
|---|---|---|---|
| **The owner** | What the site is; anything a reader sees anew; pushes and merges | | The command centre, when they choose |
| **The design lead** | The order of work; which path; the tier | The plan | That the plan is true |
| **The session** | Tier 0 and 1 | The site | Its own work, before handing it over |
| **The reviewer** | Whether a change passes | Nothing: it cannot edit | Every change |
| **The prototyper** | Nothing | One option of a choice | That its option passes the gate |
