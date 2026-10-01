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
- [ ] A09 · Docs and comments corrected to match the code.
- [ ] Split `_photobook.scss` and `_colour.scss` by part, after confirming the guards walk subfolders.

**Tier 1: brought into line, shown before and after**
- [ ] C02 · `brass-focus` as the one focus ring, surface by surface.
- [ ] C03 · Radii onto the scale where the move is under 0.25rem.
- [ ] C04 · Durations and curves onto the scale. The one-second cover hover stays.
- [ ] C05 · Glass onto three depths.
- [ ] C06 · Hand-written labels onto `eyebrow`.
- [ ] C13 · Drift's room through the shared wash.

**Tier 2: queued when reached**
- C07 · The lede on older heroes becoming Didot italic.
- C08 · One `tag` replacing five.
- C10 · Roboto: remove it or host it.
- Any radius or timing move at or over the threshold.

## Design notes

- The chrome first (masthead, search, subscribe), because it is on every page and has the most
  private recipes. Then the map. The older pages' own controls wait for their stages.
- One surface per change, so a pixel-diff delta has one cause.
- New pieces (`button`, `tag`, `card`) are designed in the catalogue with every state before any
  page adopts them: rest, hover, focus, pressed, disabled, on a photograph, on the page ground.

## Exit

The ratchet's counts are lower than on 2026-10-01 and committed as the baseline. `npm run gate:full`
passes. The digest shows each tier 1 change before and after, desktop and phone.
