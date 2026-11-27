# Stage 13 · Home

**Status:** planned. **Tier:** 2, answered: the owner's picks on the sheets of 2026-11-27 (Q24, Q25;
[0013](../decisions/0013-what-the-sheets-settled.md)). One batch, one session, one pull request
with pictures; the merge is the yes ([0010](../decisions/0010-the-merge-is-the-yes.md)).

New on 2026-11-27: Home had tasks in stages 3 and 4 and no stage of its own.

## Goal

Home says what is new before it lists its rooms, counts each room truly, tells a reader plainly
that there is more below, and wears the house's faces.

## What is already decided

**Kept as it stands (Q25; not to be re-proposed):** the first screen (name, figure, motto, a blurred
picture); the figure beside the name, one of three by chance; the welcome takes the whole screen,
then a jump; the one large picture beside the rooms, following the pointer; six tiles in five
shapes; the small drawing and the kind over a card's title; the word that intrigues QSD as a grey
box on the board; six full cards in a column on a phone.

**The owner, 2026-11-27:**

- The order: "Welcome, new, rooms".
- The numbers beside the rooms: "A number that is true: what the room holds".
- Of the first screen: "we should have clear indications (animation) such that user is hinted to
  scroll down. Right now it's a thin moving line which isn't clear."
- The name: "Didot kept, gradient dropped" (Q24).
- "Playfair upright everywhere" for the Didot italic line (Q24).

**Standing** ([`PRINCIPLES.md`](../PRINCIPLES.md), Home; The eye): no full-screen logo or loading
gate; the monogram loops; "Nothing springs" (the bubbles and the cat are the two built exceptions,
the owner's); every motion stops under `prefers-reduced-motion` and `html.motion-off`. From 0009:
a card lifts 4 px and grows to 1.018 in 0.3 s, on a short shadow at rest.

## Scope: batch 4

Tier 2, answered, unless a line says otherwise. Pictures at both widths; the hint as a short capture.
Audit ids are sections of `design/audits/stylesheets.md` (S), findings of
`design/audits/reviewer.md` (R) and `design/audits/measured.md` (M).

**The page**
- [ ] Q25, home-order · The welcome, then Recent updates, then the rooms as the page's index
      (`_includes/home/index.html`, `_includes/home/whats-new.html`, `_sass/_home.scss`). The three
      panels still snap. Checked at 320 by 640, where the rooms overflowed by about 27 px
      (stage 3's fault): the last panel must hold all five.
- [ ] Q25, home-room-numbers · Each room's number is what it holds, in Didot: posts, voyages, fables;
      About has none. Figured at build, never typed, so it cannot go stale. The lead's, tier 1,
      shown: Voyage counts the covers on its wall and Palette the voyages that have a palette (the
      sheet's figure for Palette was a stand-in).
- [ ] Q25, home-first-screen · A clear, animated hint to scroll in place of the thin moving line. A
      choice, with two or three prototypes ([0005](../decisions/0005-choices-arrive-as-prototypes.md)):
      the owner said what is wrong, not what is right. Each one is a control (it takes a press and a
      key, and leads to the second panel), is still for a reader who asked for stillness, and does
      not spring. It answers stage 3's "does Home's hero need a way on besides scrolling".
- [ ] Q24, home-title · The name keeps Didot; "Wonders" loses its gradient for flat brass, the pale
      one the sheet drew (R4; `_sass/_home.scss`, `.home__wordmark`). The other golds written by
      hand in this file come onto the two brasses (S, H4).
- [ ] The three small labels leave Monaco, a face the site never loads, for the shared `eyebrow`
      (R4; M6; S, A5). Their brass stays. Said on the sheet beside the name, as a fix that comes with
      any pick; the label is smaller than Monaco was (16 px to 11), so it is in the pictures.
- [ ] Q24, italic-lines · Home's Didot italic line is Playfair upright (S, F: `_home.scss:502`). The
      motto is a quotation and keeps the fourth face (Q25).

**The cards** (answered on 2026-10-01; moved from stage 4)
- [ ] Recent updates' cards take the `card` piece's lift: 4 px, 1.018, one shadow, 0.3 s; the six
      shadows and the half second go (picks 4, 5, 12; S, B2; R13; M3). A transition nothing
      triggers is deleted with it.
- [ ] At rest they take the short shadow (pick 3) and one corner: 18 px on the feature, 10 px on the
      rest (S, D; that the feature is "the scenario" is the lead's reading, tier 1). Home's
      baseline is re-captured.

**Brought into line with 0012, in these files** (tier 1)
- [ ] A room's row answers in place: it brightens and no longer slides 18 px, and no arrow slides in
      (R12; S, B13; Q25, "No arrow"). The others still dim, as X15 built it.
- [ ] Weights the site does not load (S, A1.4: `_home.scss:332`, `:543`). A phone's side margin
      comes onto the site's one (M14: 22.4 px here).
- [ ] Home ends as every page does: the one ending of [stage 14](14-shell-and-small-pages.md), so
      RSS and Terms can be reached from the front page (P05; R5).

**Journeys owed**
- [ ] F098 · Recent updates names a part: once the newest `updated:` is on a sub-voyage, a card
      links `/voyage/<parent>/<part>/` and none links its parent. Tier 0.

## Not in this batch

- The word card's own growth under the pointer (1.05, no lift: R13). It is a signature and was not
  asked; it stays until the owner has seen it beside a still one.
- The line under a room's name on its door is Playfair (S, A2 marks it a choice). It is a line and
  not a label: left.
- Back to Home always re-opening on the hero, and the 320 px call: [stage 3](03-wayfinding.md).
- The door plates' weight (F065): [stage 9](09-weight-and-scale.md).

## Shared pieces

Uses: `card`, `eyebrow`, `brass-focus`, the two brasses. New, if the owner picks one: the hint to
scroll, said in `_docs/components.md` first; it is a signature of Home unless a second page needs it.

## Journeys

`home` and `hero-cat` must pass. `home` gains: what is new comes before the rooms; each room's figure
equals what its page lists; the hint leads to the second panel, and with motion off it does not
move. To add: `home-part` (F098).

## Exit

`npm run gate:full` passes with Home's baseline re-captured and no other; `npm run
check:mobile-overflow` at 390 and 320; `npm run visual:audit` for the hint; the reviewer returns
PASS. The hint is the one the owner chose.
