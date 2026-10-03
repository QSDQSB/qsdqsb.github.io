# Architecture

The site as it is built today and the rules new work follows. `decisions/` is the history of how it
got here; this page is the present, on one sheet. `_docs/` holds the procedures (build, photos,
layouts, components). When a decision changes the architecture, this page changes with it.

## The shape

```
 authored                    built                         served
 ─────────                   ─────                         ──────
 _posts _pages _voyage   ┐
 _subvoyage _data        ├─► Jekyll ──► _site/ ──────────► Cloudflare Pages (qsdqsb.com)
 _layouts _includes      │      ▲
 _sass assets/js         ┘      │ manifests, covers, geojson (npm run build)
                                │
 photos/ (local, ignored) ──► R2 ──► processing (GitHub Actions) ──► img.qsdqsb.com
 _data/photos/*.yml (captions, order, cover)

 functions/api, workers/  ──► Cloudflare: subscribe (D1, Resend), photo triggers
```

- **Static first.** Every page is HTML from Jekyll. Script adds behaviour; no page needs it to show
  its content, except the colour pages, which draw from data and say so in `<noscript>`.
- **Photographs are never in git.** R2 holds them; the build reads private manifests.
- **One stylesheet, eleven global scripts** today. Both are being narrowed
  ([0003](decisions/0003-stylesheet-organisation.md)).

## Layers, and what may depend on what

| Layer | Lives in | May use | Must not |
|---|---|---|---|
| Scales and tokens | `_sass/_variables.scss`; custom properties on `:root` in `_sass/_tokens.scss` (inks, glass, the two curves) | Nothing | Hold a value used once |
| Breakpoints | `_sass/_responsive-policy.scss` | Scales | Be written anywhere else |
| Shared pieces | `_sass/_components.scss`, `_docs/components.md` | Scales, breakpoints | Know about a page |
| Chrome | masthead, navigation, search, subscribe, footer | Shared pieces | Restyle a piece |
| Pages | Photobook, colour pages, Home, map, posts | Shared pieces, chrome | Define a control another page could use |
| Behaviour | `assets/js/` | The two curves from `:root`; `QSD.motionOff()` | Write a curve; scroll or animate without asking about motion |

A page that needs a control no piece provides adds the piece to the shared layer first
([0002](decisions/0002-one-control-vocabulary.md)).

## Rules for new work

1. **Read the plan first.** `ROADMAP.md`, then the stage. A change that belongs to no stage is a
   finding for the inbox or a call for the queue, not a quiet edit.
2. **Find it in [`FEATURES.md`](FEATURES.md).** The row names the files and the journey.
3. **Reuse before you create.** Controls from the vocabulary; mechanisms the site already has (the
   wash, the lightbox, the vat) before a parallel one.
4. **New pages stand on the Photobook shell** (`layout: default`, `body_class: photobook …`), never
   on `single` or `archive`.
5. **Every feature has a journey.** If a reader would notice it breaking, `check-journeys.mjs`
   walks it.
6. **Weight has a budget** ([0004](decisions/0004-budgets-that-only-fall.md)). What grows with the
   archive is measured per photograph.
7. **Motion is opt-out at the root.** A new animation ships with its reduced-motion and
   `html.motion-off` rules beside it; `npm run visual:audit` proves it.
8. **Desktop and phone are one design.** A difference between them is the owner's call.
9. **A change readers get is written down** in [`CHANGELOG.md`](CHANGELOG.md), in the same commit.
10. **Nothing reaches the owner unchecked.** `npm run gate:full`, then the site reviewer.

## How the hub runs itself

| When | What happens | By |
|---|---|---|
| A session starts | The plan's state is put in front of it: the current stage, the queue, the inbox, the last changes | `scripts/hooks/session-start-plan.sh` → `check-plan.mjs --brief` |
| A file is edited | The checks that apply to it run | `scripts/hooks/post-tool-edit-nudges.sh` |
| A turn ends | House style, bundle sync, the `!important` ratchet | the Stop hooks |
| Work is ready | Every check in one pass, the plan's own included | `scripts/gate.sh`, then `.claude/agents/site-reviewer.md` |
| A choice between two ways | Prototypes are built and shot; a pick page goes to the owner | `/choose`, `scripts/choice-page.mjs` (CSS-only options from one build), `scripts/prototype-setup.sh` and `.claude/agents/prototyper.md` (worktrees) |
| The plan is edited | Findings, ideas, calls, answers and changelog lines are written in one shape, with ids never reused | `scripts/plan.mjs` |
| Anything is pushed | The fast gate, and the changelog rule over a pull request | `.github/workflows/gate.yml` |
| The owner looks | One page: the calls waiting, ideas, roadmap, changes, findings, the language and the rules | `scripts/hub-page.mjs` → the command centre Artifact |
| The owner has an idea | It is kept verbatim, and returned with what it means made explicit, what it would change in the site as it stands, its for and against, whether it can be delivered (tried in code), what a second reader objected to, and a verdict. The owner's decision is recorded under the verdict | `/idea`, `scripts/plan.mjs idea` and `decide`, the design lead, the site reviewer ("Challenge a proposal"), `scripts/lib/plan-ideas.mjs` |
| The owner answers | The tap is stored with the page at once, and a few seconds later the page tells Claude in a comment, which wakes any session watching the page: it records the answers and replies in the thread. With no session watching, the answers reach `QUEUE.md` when the next session starts, or with the daily run: a page cannot write to git | the session brief, `/hub`, `/hub-daily` |
| Daily | In a worktree of its own, on one branch (`hub/daily`) carried forward and built on GitHub's `master`: the gate, the plan check, the owner's answers and new ideas recorded by a program (`plan.mjs sync`, from a dump of the page's store), a file nothing loads filed. Unattended, so it is a handful of calls that are all allowed beforehand, and it decides nothing a program can decide; it does not work the plan down. The page is not republished (F054). No agent is handed work, and no idea is worked through, until `daily_agents` is switched on in `hub.json` (off for its first runs: an agent starts in the owner's checkout). It may push its own branch when that branch touches only `_plan/`; never `master`, never a pull request | `/hub-daily`, on a schedule the owner switched on (Q10, 2026-10-01). [Stage 0](stages/00-hub.md) says whether it has run yet |

Why it is built this way, with the options weighed and the ways it can fail:
[decisions/0007](decisions/0007-the-hub-architecture.md).

The pieces are plain scripts with exit codes. If the hooks are ever off (a tool that is not Claude
Code), `npm run gate` and `node scripts/check-plan.mjs` still say the same things.
