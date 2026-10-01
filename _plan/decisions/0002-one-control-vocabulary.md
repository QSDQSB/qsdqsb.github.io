# 0002 · One control vocabulary

**Status:** Accepted 2026-10-01 under delegation (see [0001](0001-who-decides-what.md)). The
structure is decided. Each visible migration it causes is tiered on its own: in line with this
record and under the major-delta threshold is tier 1; anything larger is the owner's. **Amended
2026-10-01 by [0009](0009-how-much.md)**: the owner's amounts (round 2 of the pairs) move steps of the
radius, duration and glass scales below and add a shadow scale, an ornament and an arrival. Where the
two differ, 0009 holds; the body of this record is left as it was accepted.
**Answers:** C02 to C09, A01, A02 in the [2026-10-01 audit](../findings/2026-10-01-ui-audit.md).

## Context

The Photobook's design is the canonical system, written as mixins in `_sass/_components.scss` and
catalogued in `_docs/components.md`. It works where it reaches. It does not reach the chrome or the
older pages, for three mechanical reasons:

1. `components` is imported after `buttons`, `masthead`, `navigation`, `search` and `code-copy`, so
   those files cannot include it.
2. It has no ordinary button, tag, card or focus ring for an older page to adopt.
3. There are no scales, so a session that wants to conform has nothing to conform to.

The count on 2026-10-01: about 14 button families, 12 focus recipes, 36 distinct radii, about 40
durations, 8 curves, 12 backdrop blurs, z-index values from 40 to 999,999.

## Options

| | A · Finish the mixins | B · Add a class layer | C · Custom properties, layers, bundles |
|---|---|---|---|
| Change | Import order, four new pieces, scales, a ratchet | Each piece also emitted once as a class | Tokens on `:root`, `@layer`, a stylesheet per kind of page |
| Markup | Untouched | Touched where adopted | Touched everywhere |
| Risk to the pixel baselines | Low, step by step | Medium | High, all at once |
| Stylesheet size | Unchanged | Smaller | Smallest |

## Decision

**A now. B for pages written new (the Bestiary, the Voyage refurbishment). C's bundle split is
deferred to [0003](0003-stylesheet-organisation.md) and revisited once the vocabulary has held for
a stage.**

### The pieces

If a need is not met by one of these, the piece is added to `_components.scss` with a line in
`_docs/components.md`. Never in a page's own partial.

| Kind | Pieces | Replaces |
|---|---|---|
| Actions | `pill`, `round-tool`, `icon-button-quiet` (exist); one new text `button`, solid and quiet | `.btn`, subscribe send, map veil CTA, popup action, code copy, the nav action shell |
| Choices | Segmented toggle (exists); one `tag` | Five tag recipes, the bilingual switch, the map legend row |
| Surfaces | Glass at three depths; one `card` | Twelve blur recipes; four card recipes |
| Marks | `brass-focus` as the one focus ring; `eyebrow`; one mark for "current" | Twelve focus recipes, nine hand-written labels, three "current" marks |

### The scales

In `_sass/_variables.scss`. A scale token is multi-use by definition, but the single-use guard does
not know that until two callsites exist: introduce each token with its first two uses, or mark it
`// @keep`.

| Scale | Steps | Notes |
|---|---|---|
| Radius | `none` 0 · `hair` 3px · `soft` 10px (today's `$border-radius`) · `card` 16px · `pill` 999px · `round` 50% | Glass panels 9, 14px and 1rem move to `soft`; cards to `card` |
| Duration | `fast` 0.15s · `base` 0.3s · `slow` 0.6s · `cover` 1s · `scene` 1.1s and over | `cover` is the owner's one-second card hover, kept on purpose |
| Curve | `$cubic-bezier-standard`, `$cubic-bezier-smooth`, and `$cubic-bezier-param` for `cover` only | Bare `ease` and ad hoc curves go |
| Depth | `base` 1 · `sticky` 20 · `masthead` 40 · `overlay` 60 · `modal` 100 · `tip` 1000 | Search and the map fit under `overlay` and `modal`; nothing above `tip` but the skip link |
| Glass | `control` blur 12px · `bar` blur 18px saturate 140% · `panel` blur 24px saturate 130% | One edge alpha |
| Label | The `eyebrow` mixin, floor 11px | No hand-written spaced capitals |

### The inks

`--photobook-ink`, `-ink-2`, `-ink-3`, `-line`, `-glass`, `-glass-edge`, `-button` and
`-button-hover` are the site's inks and glass, named after one page and defined only on
`.photobook`. They move to `:root` as `--ink`, `--ink-2`, `--ink-3`, `--line`, `--glass`,
`--glass-edge`, `--control`, `--control-hover`. The old names stay as aliases until the last use is
migrated, then go.

### The guard

`scripts/check-new-components.sh` is a nudge today. It becomes a ratchet shaped like
`check-important-ratchet.py`: per file, count literal radii, literal curves, `backdrop-filter`
outside `_components.scss`, focus blocks that do not use `brass-focus`, and literal z-index values.
Store the counts. Any increase fails; any fall is recorded. A session that invents a control is
told at the moment it writes it.

## Consequences

- A new control needs a line in the catalogue first. That friction is the point.
- Migration is many small tier 1 changes, each with a before-and-after shot. Where the pixel diff
  moves more than the threshold, it stops and goes to the queue.
- The older pages do not become consistent by this record alone. That is the work of the stages.
- Revisit when the Bestiary is built: it is the first page that should use only the vocabulary, and
  whatever it had to add shows what the vocabulary missed.
