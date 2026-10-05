# Stage 1 · Foundations: unseen fixes

**Status:** building · **Tier:** mostly 0. The owner marked every finding here Fix on 2026-10-01, so a fix
that a reader can notice (tier 1), or that cuts words (tier 2), goes ahead on that mark, shown in the digest.
A fix whose direction is in doubt still goes to the queue.

## Goal

A faster, steadier site that looks exactly the same. Every item is a finding from the
[2026-10-01 audit](../findings/2026-10-01-ui-audit.md); ids refer to it.

## Scope

**Weight**
- [x] S01 · Posts, Tags and related cards defer their covers.
- [ ] S01, second half · The 13 post covers with no smaller rendition: `generate-cover-sizes.mjs` reads
      only `images/cover/`. Moves to stage 9 with S02.
- [x] S05 · One placeholder per frame in the Photobook, not two. London's page: 386 KB of HTML to 266 KB.
- [x] S06 · Drift sizes for contain, not cover. One line.
- [x] S03 · Search loads when the panel is first opened (or the pointer first comes to its button). The
      per-entry normalising stays in the browser, but only for a reader who opens search.
- [x] S04 · The search index is built as the panel opens, a few entries at a time, not on the first
      keystroke. Measured on 2026-10-02: about 60 ms on a laptop for 87 entries, not the seconds the old
      comment claimed, so it is not serialised at build time; if the site grows tenfold, that is stage 9's.
- [x] S07 · Home paints one door plate with the page; the other four when their panel shows. Not at 1920:
      a plate is a crop of a wide picture, and at 1920 Palette's lost its ripples on a dense screen (shot and
      compared). A 1x screen is given the 2880 px rendition, a denser one the picture as it was. A proper
      `sizes` for plates is stage 9's, with S12.
- [x] S09 · CMU Serif self-hosted. Done 2026-10-03 (Q14, A): cm-unicode 0.7.0 from CTAN, four faces cut to
      Latin, Greek and mathematics, in `assets/fonts/CMUSerif/` with its OFL, set to the service's copy's line metrics and widths
      (`scripts/cmu-metrics.json`) so no line moves or breaks elsewhere; cut again with `npm run fonts:cmu`.
- [x] S10 · Home's hero: a 1920 px rendition (318 KB to 84 KB), cut at build by `npm run covers` and
      gitignored like the other renditions, and preloaded.
- [x] S11 · Lightbox prefetch: none on touch, sized from the mat, cancelled when passed. Six quick steps
      fetched eighteen full prints; now three, for the frame that holds.
- [x] S13 · Reverie's first print opens at once.
- [x] S14 · The map starts when near, and loads tiles once.
- [x] S15 · Inline `code` loses its backdrop blur.

**Behaviour**
- [x] X05 · A colour no photograph holds opens on the closest one (the owner's note: the most adjacent match,
      never nothing). Its count line still reads "only this photograph… for now": the words are the owner's.
- [x] X06 · The monogram no longer logs.
- [x] X01 · The masthead stops opening on every touch and focus.
- [x] X02 · The opening scene yields to Tab and the pointer.
- [x] X04 · Reverie: fast stepping neither repeats nor stacks history.
- [x] X07 · Lightbox and Drift leave the browser's shortcuts alone. The owner's note ("change to not
      conflicting shortcuts") was read as: stop conflicting. No key was changed; if new keys were meant, say so.
- [x] X08 · The lightbox shows the frame's placeholder while its picture loads (in the book; away from it,
      in Reverie, the bare mount over the room's colour: its frames carry no placeholder).
- [x] X10 · Tarot cards are inert while search is open.
- [x] X12 · In-page links change the address, move focus and respect reduced motion.
- [x] X13 · The table of contents hands scroll back to the page.
- [x] X16 · No focus on things that cannot be seen.
- [x] X17 · Palette's glide yields to the reader; key repeat ignored.
- [x] X18 · State changes are announced.
- [x] F041 · The vat does not throw where there is no WebGL (`assets/js/colour/vat.js:122`: `shared?.gl`
  stops at null, not at false). Found by I001's trial. With a journey run with 3D off.
- [x] X19 · Reduced motion and motion-off honoured by the map's zooms and reset, the lightbox's mount and the treatise.
- [x] X19, the rest · The map's keyboard pans and `panTo` land at once for a reader who asked for stillness (F039).
- [x] X10, X16 · 2026-10-01 · Their journeys (`search-corners`, `specs-folded`): tarot corners take no click with search open (X10); a folded
      specs panel takes no Tab (X16). Both fixes shipped without one. Tier 0.
- [x] P01, the deep-link half · It was real, in the code: the lightbox's first frame is the colour, its
      address is `#colour`, and the page only looked for a photograph of that name. Fixed, and the `reverie`
      journey opens it. As first written: 2026-10-01 · `/reverie/?…#colour` did not open the lightbox on load in the
      audit's browser. Confirm it on a served site first: it was seen in one pane only. If it is real, fix it
      and extend the `reverie` journey. Tier 0. The colour frame's size, the rest of P01, is not in this stage.
- [x] 2026-07-28 · Confirmed on 2026-10-02 as mended already: the store has normalised its text since
      2026-07-28 (searching "porto", the Voyage index's result reads clean; a Chinese query, a highlighted
      term and the suggestions were checked too), and the `search` journey now fails on any entity shown
      as text. As first written: Search: a result's snapshot double-escapes `<` and shows `&lt;!` (search "porto": the
      Voyage index's result). Not on the audit, so not under the owner's mark: tier 1, a fault whose right
      look is not in doubt. The text is escaped once in `assets/js/lunr/lunr-store.js` and again by
      `searchHighlightText()` in `assets/js/lunr/lunr-en.js`: mend one side, not both. Then check a text
      with a real `<`, a Chinese query, a highlighted term, and the Voyage result. Sits with S03 and S04.

**More, marked Fix**
- [x] X15 · Home's door list hovers evenly.
- [x] X21 · Small lightbox edges: the opening morph, a one-frame slideshow, fullscreen Escape.
- [ ] X21, the rest · Pinch on the specs. The dialog's `touch-action: none` forbids a pinch on anything
      inside it, and three handlers (touchmove, the two-finger pinch, Safari's gesture events) take it for the
      print. Letting the page zoom there also means letting a zoomed page pan. It wants a real iPhone to try.
- [x] X22 · The masthead does not fade in from nothing on every page change.

**Approved, phone only**
- [x] P10, the facts · Done 2026-10-05: below tablet the facts wrap as whole facts (no value breaks), each
      with its hairline on its right, the last of every row clipped away at the corner; only the Photobook's
      phone shot changes. As first written: On a phone the cover's facts do not wrap mid-value: the row wraps as whole facts, its
      hairlines with it. Tried on 2026-10-02 and taken back out: kept whole, five facts need 374 px, so the
      fifth ran off a 320 px phone. Ships alone (the owner, 2026-10-04, answering the work run's hold), shown
      at both widths.
- [ ] P10, landscape · The phone lightbox in landscape wants its own short-screen rule. Held for a session
      that can shoot a short phone screen: the pixel harness has no landscape page, so a run cannot show it.
- [x] X03 · Long post titles wrap on a phone. Two posts change; no other title moves.
- [x] X11 · The subscribe field is 16 px on touch.

**Content**
- [x] P04 · The privacy page no longer describes tracking the site does not do.
- [x] P04, second half · Done 2026-10-03 (Q13, A: the draft as written, at the head of Log Files). One sentence on what it does do (Cloudflare Web Analytics, no cookies). The owner
      (Q8, 2026-10-01): this sentence is the one that is needed. The lead drafts it in the house voice;
      the owner keeps, changes or strikes it before it goes on the page.
      Drafted 2026-10-02 and asked as Q13, with one fact to confirm: no page of the live site carries Cloudflare's
      counting script (checked that day), so either the counting is done at Cloudflare's edge, with nothing
      sent from the reader's browser, or it is off. The draft, for the first case: "**Counting visits.**
      Cloudflare, which serves this site, counts its visits as they pass: how many, to which pages, from
      which countries. It sets no cookie and keeps nothing in your browser, and I see numbers, never people."
- [x] P05 · Home's tail: zero the padding. (Whether Home wants footer links is tier 2.)
- [x] P12 · The 404's video fits.
- [ ] P12, the rest · Headings retagged (the CV's four `h1`s, the word card's `h1`, the sign-off's `h6`),
      styles unchanged. Better done with stage 2, which rebuilds the heading styles (F034): retagging now
      means restating every `h1` rule under another tag, to be restated again there.
- [x] X05, second half · 2026-10-01 · Reverie's count line for a colour no photograph holds reads
      "QSD reveries in only this photograph… for now", though the photograph shown is the closest one.
      The owner (Q8, 2026-10-01): leave it as it is.
- [x] P04 · 2026-10-01 · `/terms/`'s `seo_description` still mentions comments. Cut the word on the P04
      mark; add nothing.
- [x] 2026-09-29 · SEO. The four portfolio stubs are out of `sitemap.xml` (`sitemap: false`, which the
      template now honours); Venice still waits on the owner. As first written: Not on the audit, so not
      under the owner's mark. Portfolio stubs out of `sitemap.xml`: tier 0. Venice is in it too, but the owner chose to leave Venice as it is (stage 4):
      ask before taking it out. `/utils/`'s description stays as it is (the owner, Q8, 2026-10-01).
- [x] 2026-09-29 · Jianfei's table: confirmed on 2026-10-02 that it no longer overflows (1440, 390 and
      375 px; at 320 px the wide tables scroll inside their own box, by design). As first written:
      Jianfei's table overflows by 1 px. Not on the audit: tier 0. Confirm it still does;
      the treatise's styles changed on 2026-10-01.
- [x] F043 · Excluded, with `scripts/check-served-files.mjs` in the full gate. As first written:
      2026-10-01 · `CLAUDE.md` is served on the live site: `/CLAUDE/` and `/CLAUDE.md` both
      answered 200 on 2026-10-01. `exclude:` in `_config.yml` does not name it, nor `CONTRIBUTING.md`,
      `package-lock.json` or `skills-lock.json`; a local build also copies `design/` and `photos/` into
      the output (git ignores both, so they are not deployed). Not on the audit: tier 0, a fault today.
      Nothing links to it, and the repository is public, so nothing secret is out; it is a page no
      reader should meet. Add them to `exclude:`, and see that `sitemap.xml` does not list `/CLAUDE/`.
      With a check that would have caught it ([0008](../decisions/0008-ready-and-done.md)): the build
      holds no page made from a file at the repository's root that is not meant to be one.
      `_config.yml` is a file the changelog rule watches, so it takes its line.

## Not in this stage

S02, S08, S12 are larger and sit in stage 9. X03 and X11 (phone-only visual changes) were approved on
2026-10-01 and shipped in the second batch.

## Design notes

- Each fix adds or extends a journey in `scripts/check-journeys.mjs` where a reader would notice
  it breaking again: search opening (S03), the lightbox keys (X07), Back in Reverie (X04).
- S01 and S05 change what the build emits; confirm with the budget numbers in
  [0004](../decisions/0004-budgets-that-only-fall.md) before and after.
- Order: S06, S15, P04 first (minutes each), then S01 and S05 (the two largest wins), then the rest.

## Exit

`npm run gate:full` passes. A baseline is re-captured only for a page a fix was meant to change, named in
the changelog. The reviewer returns PASS. The audit's Status is updated for every id above.

## Log

- 2026-10-02 · Second batch: S03, S04, S05, S07, S10, S11, S13, S14, X03, X08, X11, X15, X18, X19 (the rest),
  X21 (three of four), X22, F041, F043, P01 (the deep link), P05, P12 (the video), the terms description, the
  sitemap, and the journeys owed for X10 and X16. Seven journeys added (`specs-folded`, `search-corners`,
  `no-webgl`, `atlas`) or extended (`home`, `book`, `search`, `reverie`), and one check
  (`check-served-files.mjs`). The reviewer blocked the first pass on three faults the gate could not see
  (in picture only a slow step emptied the screen; a passed frame's late print cancelled the next frame's
  placeholder; at 320 px the 16 px subscribe field cut its placeholder), all fixed, with four more
  journeys: `lightbox-slow` (shown to fail on each fault put back), `lightbox-morph`, `phone-post`,
  `subscribe`. Left for the owner or a later batch: S09 (a download), P10 (a design job),
  the privacy sentence (a fact to confirm), the headings (stage 2), pinch on the specs (a real iPhone).
- 2026-10-01 · First batch: S01, S06, S15, X01, X02, X04, X05, X06, X07, X10, X12, X13, X16, X17, X19, P04.
  Baselines re-captured for two pages: the treatise (its abstract now shows under motion-off) and the
  notices post (the code blur's halo is gone). The reviewer blocked the first pass on three faults
  (Escape in Drift with search open; the wheel's focus move; no journey for the masthead), all fixed, and
  five journeys were added.

## Seen in this batch

Filed on 2026-10-02, once the daily run's branch was merged, as F063 to F072 in
[`findings/inbox.md`](../findings/inbox.md), for the lead to sort.
