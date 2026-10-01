# Stage 2 · Foundations: plumbing

**Status:** planned · **Tier:** 0 for structure, 1 for each visible migration under the major-delta
threshold, 2 beyond it.

## Goal

One vocabulary every later page takes its controls from, and a guard that refuses a new one.
Implements [0002](../decisions/0002-one-control-vocabulary.md) and steps 1 to 3 of
[0003](../decisions/0003-stylesheet-organisation.md).

## Scope

**Tier 0: no pixel moves**
- [ ] A01 · Import `components` directly after `responsive-policy`.
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
- [ ] C03 · Radii onto the scale where the move is under 0.25rem.
- [ ] C04 · Durations and curves onto the scale. The one-second cover hover stays.
- [ ] C05 · Glass onto three depths.
- [ ] C06 · Hand-written labels onto `eyebrow`.
- [ ] C12 · Small dialects swept once the scales exist: hover direction, dates, ellipses, rules, one `scroll-padding-top`.

**Decided by the owner on 2026-10-01, to build**
- [ ] Headings white by default; the hue-per-level h2 to h5 in `_sass/_base.scss` retired. Shown before and after.
- [ ] C07 · The lede on older heroes takes the shared Didot italic (marked Fix).
- [ ] C08 · One `tag` replacing five (marked Fix); the tag pages themselves are stage 10.
- [ ] C10 · Roboto leaves the two font stacks, so Android reads as Apple does (marked Fix).

**Tier 2: queued when reached**
- Any radius or timing move at or over the threshold.
- The first appearance of each new piece (`button`, `tag`, `card`).

## Design notes

- The language these implement is [`DESIGN-LANGUAGE.md`](../DESIGN-LANGUAGE.md). A specimen page that draws every
  piece of the grammar with the site's own stylesheet is this stage's first task after A01: it makes the
  language visible, and once it is in the pixel baseline any change to a shared piece shows on one page.

- The chrome first (masthead, search, subscribe), because it is on every page and has the most
  private recipes. Then the map. The older pages' own controls wait for their stages.
- One surface per change, so a pixel-diff delta has one cause.
- New pieces (`button`, `tag`, `card`) are designed in the catalogue with every state before any
  page adopts them: rest, hover, focus, pressed, disabled, on a photograph, on the page ground.

## Exit

The ratchet's counts are lower than on 2026-10-01 and committed as the baseline. `npm run gate:full`
passes. The digest shows each tier 1 change before and after, desktop and phone.
