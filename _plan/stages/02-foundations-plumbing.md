# Stage 2 · Foundations: plumbing

**Status:** planned · **Tier:** 0 for structure, 1 for each visible migration under the major-delta
threshold, 2 beyond it.

## Goal

One vocabulary every later page takes its controls from, and a guard that refuses a new one.
Implements [0002](../decisions/0002-one-control-vocabulary.md) and steps 1 to 3 of
[0003](../decisions/0003-stylesheet-organisation.md).

## What this stage rests on, and what it does not

The owner was asked on 2026-10-01 whether [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md) reads true
(Q3). The answer: not yet, and "We need to revisit it". The language stays version 0, a draft, until
it has been talked through with the owner. That conversation is in chat, not a call waiting on a tap.
Until it has happened:

- **This stage rests on two decision records, not on the language.**
  [0002](../decisions/0002-one-control-vocabulary.md) and
  [0003](../decisions/0003-stylesheet-organisation.md) were accepted under delegation, and the owner
  accepted the tiers as written on the same day (Q2). Everything under "Tier 0" below goes ahead: no
  reader sees it.
- **It rests on the owner's own calls**, quoted from [`PRINCIPLES.md`](../PRINCIPLES.md): white
  headings, brass links, and the findings marked Fix on the audit.
- **It rests on what is built.** Bringing a surface into line with a shared piece that already
  exists in `_sass/_components.scss` (`brass-focus`, `eyebrow`) is tier 1, as
  [0001](../decisions/0001-who-decides-what.md) says.
- **It does not rest on the lead's reading.** A line of the language with no date and no "built"
  beside it is not a reason to change anything a reader sees. The language's own head lists which
  lines those are.
- **C03, C04 and C05 wait for the conversation.** They move pixels onto values (six radii, five
  durations and two curves, three depths of glass) that 0002 decided under delegation and the
  language repeats. The values are one of the four things the conversation is to cover. The scales
  may be written into `_variables.scss` and `:root` meanwhile (A02, A03: no pixel moves); no surface
  moves onto them until the owner has seen them. If the stage reaches them first, that is said to
  the owner then. They are not built on a guess.

**For the conversation** (the full wording is at the head of the language):

1. Is "a grammar and its signatures" the owner's way of seeing the site, and is the list of twelve
   signatures right? Where does whimsy live?
2. Is the colour rule "nothing but the photograph, the brass and the inks"? Two of the owner's calls
   point that way; the rule itself is the lead's.
3. How far does the Photobook's manner reach: its shell under every new page, its register of words
   across the whole interface?
4. The numbers that would move pixels: seen on the specimen page before any surface moves?

## Scope

**Tier 0: no pixel moves**
- [ ] A01 · Import `components` directly after `responsive-policy`.
- [ ] The specimen page: every piece that is built today, drawn with the site's own stylesheet, at
      desktop and at phone width, each labelled built, the owner's, or decided under delegation. It
      is what the owner looks at in the conversation, and once it is in the pixel baseline a change
      to a shared piece shows on one page. It must not ship to readers: a page of the seeded visual
      build only, or a page outside the site. A page a reader can reach is a new page, and the
      owner's. A piece that is decided but not built is not drawn as though it were settled.
- [ ] A05 · Delete the CSS and script that nothing renders (about 700 lines).
- [ ] A03 · Inks and glass on `:root` under neutral names; old names kept as aliases.
- [ ] A02 · The scales in `_variables.scss`, each introduced with its first two uses.
- [ ] C09 · Depth as six named layers; every literal z-index mapped to one.
- [ ] The ratchet: counts stored, an increase fails, wired into the hook and the gate.
- [ ] A09 · Docs and comments corrected to match the code. One more, found 2026-10-01: the comment in
      `assets/colour-atlas.json` still names The Colour of Light, a page retired on 2026-09-29.
- [ ] Split `_photobook.scss` and `_colour.scss` by part, after confirming the guards walk subfolders.
- [ ] 2026-10-01 · The pixel harness is blind below about 16,700 px: full-page shots are blank past it
      (post-notices desktop 17,075–40,390 of 42,501, mobile 16,677–51,713 of 53,423; voyage-by-tags
      mobile; the treatise's figure on a phone). Shoot long pages in tiles. Done before the first tier 1
      change below: every before-and-after in this stage rests on the diff.
- [ ] 2026-09-26 · The pixel harness's phone shots differ run to run (intermittent masks, image load
      timing). Same reason, same place in the order: a diff that cries wolf gets re-captured, not read.

**Tier 1: brought into line, shown before and after**
- [ ] C02 · `brass-focus` as the one focus ring, surface by surface.
- [ ] C03 · Radii onto the scale where the move is under 0.25rem. Waits for the conversation (above).
- [ ] C04 · Durations and curves onto the scale. The one-second cover hover stays. Waits for the
      conversation (above).
- [ ] C05 · Glass onto three depths. Waits for the conversation (above).
- [ ] C06 · Hand-written labels onto `eyebrow`.
- [ ] C12 · Small dialects swept once the scales exist: hover direction, dates, ellipses, rules, one `scroll-padding-top`.

**Decided by the owner on 2026-10-01, to build**
- [ ] Headings white by default; the hue-per-level h2 to h5 in `_sass/_base.scss` retired. Shown before and after.
- [ ] Q9 · A link inside a page's text is brass, with a hairline underline. Tier 2, answered: the
      owner picked option B of three prototypes on 2026-10-01 (`design/choices/link-colour/`; the page
      is `choices.link-colour` in `_plan/hub.json`). Built as "The link, as chosen" below.
- [ ] C07 · The lede on older heroes takes the shared Didot italic (marked Fix).
- [ ] C08 · One `tag` replacing five (marked Fix); the tag pages themselves are stage 10.
- [ ] C10 · Roboto leaves the two font stacks, so Android reads as Apple does (marked Fix).

**Tier 2: queued when reached**
- Any radius or timing move at or over the threshold.
- The first appearance of each new piece (`button`, `tag`, `card`).

## The link, as chosen (Q9)

What the owner saw and picked, from `design/choices/link-colour/choice.json`, option B, shot on
`/about/` at 1440 and 390:

- The brass, `#c3b498`, which is the site's brass already (`$intriguing-word-color`). A link that has
  been visited looks the same as one that has not.
- An underline at rest: one pixel, set 0.22em under the text, in the same brass at half strength.
- Under the pointer it brightens to ivory. This was written on the option ("Hover brightens to
  ivory") and not in the stills, so it is shown in the before-and-after.

To settle at the build, each within what was chosen:

- **Where it reaches.** The prototype laid its rules on `.page__content a` and nothing else. The
  question the owner answered was a link inside a page's text. Today the colour comes from the bare
  `a` rule (`_sass/_base.scss:31-41`: blue, a second blue once visited, mint and an underline under
  the pointer), which also colours every link that has no rule of its own. Build the chosen link for
  text a reader reads: a post, About, the CV, Terms, the 404, a notice. Then list whatever else is
  still blue by inheritance. Each one either has its own look already or is a line in the inbox. None
  is recoloured in passing.
- **Not text links, so not in this task.** `$link-color` also feeds the type badges
  (`_sass/_type-badge.scss:27,44`, `_sass/_search.scss:271`) and the search field's focus border
  (`_sass/_variables.scss:190`). The badges are C08's, the border is C02's. The variable stays until
  they have moved (`CLAUDE.md`: a token is traced across all of `_sass/` before it is removed).
- **Mint on a notice** (`_sass/_notices.scss:49-51`) and the older blue on an archive item
  (`_sass/_archive.scss:39`): text links in an older dress. Brought to the chosen link, shown before
  and after.
- **The focus ring** is `brass-focus` (C02). Brass on brass: check that the ring still reads.
- **The underline is what marks the link for a reader who cannot tell brass from ivory.** It stays
  at rest. It is never shown only under the pointer.
- **No new variable.** The brass exists; the underline's values sit at the one rule that uses them.

Pages it is checked on, desktop and phone, in Chromium and in Safari's engine:

| Page | Why |
|---|---|
| `/about/` (baseline `about`) | The page the owner saw. The built page must match the picked still |
| `/posts/shihuqiao/` (`post-toc`) | Links in running text beside a contents list, whose own links must not gain the underline |
| `/posts/defined-by-archive/` (`post-bilingual`) | Chinese: the underline's distance under Songti, and a link that wraps across lines |
| `/posts/leetcode-july-challenge/` (`post-notices`) | Links inside notices and beside inline code |
| `/posts/jianfei-diary/` (`post-jianfei`) | The treatise colours its own links (`_sass/_jianfei-treatise.scss:55`); they keep that |
| `/cv/`, `/terms/` | Text pages with no baseline: shot by hand, before and after |
| `/404.html` (`404`) | Its way back |
| Home, `/voyage/`, a book, `/palette/`, `/reverie/`, the search panel | Must not change: a card, a door, an onward link or a result is not a text link. The pixel diff stays clean on these. Home's layout and `splash` carry `.page__content` too, so the prototype's selector reaches further than About |

Baselines are re-captured for the pages meant to change and no others, named in the changelog line.
A link that wraps a picture takes no underline.

## Design notes

- The owner's calls and decisions 0002 and 0003 are what this stage implements.
  [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md) describes them on one page and is a draft: see "What
  this stage rests on" above.
- The chrome first (masthead, search, subscribe), because it is on every page and has the most
  private recipes. Then the map. The older pages' own controls wait for their stages.
- One surface per change, so a pixel-diff delta has one cause.
- New pieces (`button`, `tag`, `card`) are designed in the catalogue with every state before any
  page adopts them: rest, hover, focus, pressed, disabled, on a photograph, on the page ground.

## Exit

The ratchet's counts are lower than on 2026-10-01 and committed as the baseline. `npm run gate:full`
passes. The digest shows each tier 1 change before and after, desktop and phone.
