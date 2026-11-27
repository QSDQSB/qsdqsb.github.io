# Stage 6 · Posts and About

**Status:** planned. **Tier:** 2, answered: the owner picked the reading page's parts on the sheets of
2026-11-27 (Q24, Q25; [0013](../decisions/0013-what-the-sheets-settled.md)). It is built as one
batch, one session and one pull request with pictures; the merge is the yes
([0010](../decisions/0010-the-merge-is-the-yes.md)).

**Scope changed 2026-11-27.** This stage is now the post: its index was kept as it stands, and About
moved to [stage 14](14-shell-and-small-pages.md) with the other small pages. The file keeps its name
so links hold.

## Goal

A post reads as a printed page of this house: its contents out of the way, one look for its
headings, lines that hold together, quotations and notes that are set and not boxed, Chinese in a
Song face, and an ending on one width.

## What the audit saw (2026-10-01)

- A post's title is 30.6 px under a 900 px photograph, 1.5 times the body. Lines run to 85 to 90
  characters in English (P06); about 44 glyphs in Chinese, which is right.
- The author rail, the boxed contents list, emoji tag pills and the pager are the old theme's.
- Long titles are cut on a phone (X03: done in stage 1). Tag pills overlap their emoji on a phone (P11).

## What is already decided

**Kept as it stands (Q25; not to be re-proposed):** Posts opens with a fixed picture, then the list;
one column of wide covers; on a phone a post's words stand on its picture; the portrait column
beside a post. The reading page's column and where the title stands: "wait for stage 6" (Q24), so
it is still open, below.

**The owner, 2026-11-27** (the sheets; the words in quotation marks are the notes):

- The contents before the first line: "Folded to one row". At the side: "A plain list".
- "One look: ivory, nothing drawn" for a post's headings.
- "The gap kept, lines closer". "A printed page: straight everywhere, words broken".
- A quotation "As a book sets it: another hand, set in": "There should be a style to indicate it's
  the quote".
- The coloured boxes: "A quiet panel".
- "We should adjust the content fonts such that Chinese text in the articles use SongTi by default ,
  especially on mobile. Right now it's customised in some pages and it's not ideal."
- A fourth typeface: "Keep it as the voice of a quotation".
- After a post's last sentence: "The same pieces, on one width" (Q24).
- From [0012](../decisions/0012-two-voices-one-behaviour.md): "Under the pointer a control answers
  in place… Nothing moves or grows. Only a card lifts." "Where you are, and what is on, is marked by
  a one-pixel brass hairline." "Everything pressable has 10 px corners. An icon is a hairline in ink.
  Keyboard focus is the brass ring."

**The owner, 2026-10-01** ([`PRINCIPLES.md`](../PRINCIPLES.md), The eye):

- "A picture inside an article has corners of 8 px" (pick 7).
- "The ornament is a lozenge on a rule" (pick 8). "An ornament stands only between passages of
  prose" (pick 9).
- "A caption is in small capitals, spaced", not serif italic: "Easier to read" (pair 8, score 1).
- "Photographs are prints: as large as the screen allows, nothing laid over them, never zoomed or
  filtered on hover" (Photographs).
- "Anything graphic that appears in the middle of a article should be center aligned." (2026-10-02)

## Scope: batch 1, the reading page

Tier 2, answered, unless a line says otherwise. Pictures at desktop and at phone width, on a post in
English, one in Chinese and one in both. Audit ids are sections of `design/audits/stylesheets.md`
(S), findings of `design/audits/reviewer.md` (R) and `design/audits/measured.md` (M).

**The contents**
- [x] Q25, post-contents-above · On a phone, and on a window too narrow for the side list, the
      contents are one folded row that says how many parts; a touch opens it, and the post begins
      on the first screen. The fold is the piece the colour figure already uses (a label over a
      hairline, `_sass/_colour.scss`, `.colour-frames__toggle`), moved to `_components.scss` on this
      second use. The row's words are drafted and shown in the pictures. Tier 2. Built as the
      framed row the owner picked from ("13 parts +"), not the colour figure's label over a
      hairline, which is another look: so `.toc__toggle` stays its own piece until a third fold.
- [x] Q25, post-contents-look · At the side the contents are a plain list: no frame, no line under a
      row; the label, then the chapters; the current one brighter beside a one-pixel hairline in the
      pale brass. The fill, the 3 px bar and the endless pulse go (S, C: `_toc-progress.scss`; M20).
      Its rows take the 10 px corner and the brass ring (S, D and E; R14). On a phone a row is tall
      enough to tap (M22: 27 px today). Tier 2.

**The text**
- [ ] Q25, post-headings · Every post takes the newest essay's headings: Playfair bold in ivory with
      room above, a number small in Didot, no line beneath. The dashed and dotted lines, the sans
      heading and the blue linked title go (R10; F078: a link inside a heading is ivory too). The
      retagging stage 1 left (P12, the rest: the CV's four `h1`, the word card's `h1`, the
      sign-off's `h6`) is done with it. Tier 2.
- [x] Q25, post-paragraphs · The gap between paragraphs kept, the lines closer: 34 px from line to
      line at 20 px, where it is 38. Tier 2.
- [x] Q25, post-justify · Every post straight on both edges, long English words broken with a
      hyphen. Paragraphs of prose only: a list, a table, a caption and code keep a loose edge (the
      lead's, tier 1). Hyphens need each language's panel to say its language (`lang`), and are
      checked in Safari's engine. Tier 2.
- [x] Q25, post-quotes, with the fourth face · A quotation is set in on both sides, with no box and
      no double line (`_sass/_base.scss`, `blockquote`; 20 px corners today), and carries a mark a
      reader can see: "There should be a style to indicate it's the quote". The lead's, tier 1,
      shown: a brass hairline at its leading edge; its Latin in CMU italic, the one job the fourth
      face keeps; its Chinese in Kai where the device has it, in Songti where it does not. The
      chapter gloss (`blockquote.gloss`, the owner's of 2026-10-02) is not a quotation and stays.
- [x] Q25, post-notices · A note set apart is a quiet panel: a hairline frame on a slightly lighter
      ground, ivory words, links in brass; no colour, no shadow (`_sass/_notices.scss`; F081: the
      brass link on teal is answered by the teal going). The unused notice colours are deleted (S,
      G); Barlow at a weight the site loads (S, A1.4 and A1.5). About uses the same notices and
      changes with them: shot there too. Tier 2.

**Chinese**
- [x] Q25, chinese-face · An article's Chinese is Songti by default: the essay's pairing (Latin in
      Playfair, Han in a Song face) moves from `body.essay` to every post, and the per-post opt-in
      goes. One stack under one name (F109; S, H6: six literal stacks). Tier 2.
- [x] The font a phone needs for it, first (tier 0; F101, F110). An iPhone gives a page no Songti of
      its own, so "especially on mobile" is the subset of Noto Serif SC the site carries
      (`scripts/essay-font.py`, which reads essays and the fables only). Read from source on
      2026-11-27: every post together uses 1,685 Chinese characters, the subset holds 1,024 at 234
      KB, so one file for every post is about 400 KB on any page with a Chinese word. That is over
      [0004](../decisions/0004-budgets-that-only-fall.md). Cut it in slices by `unicode-range` (the
      common characters, then the rest; the fables' own) so a reader fetches what the page uses,
      and widen `check:essay-font` to every post. Measured before and after.

**After the last sentence**
- [x] Q24, post-ending · The same pieces on the text's one width: tags and date, the word card, the
      subscribe slip, previous and next, then "You might also enjoy" as two small cards side by
      side (R8: three widths and about 2,200 px today). The two cards are the `card` piece, with
      its lift, and take the cover's scrim (P07). Tier 2.
- [ ] The small headings there ("A Random Word", "You might also enjoy") take Didot, as "Elsewhere"
      has it: the lead's reading of Q24's "Didot, as today", tier 1, shown (M15; S, A2).
- [ ] The grey bar above the word card is a one-pixel rule, and the filled icons beside these
      headings and the date (dice, map, calendar, tags) are hairlines or go (R15, R22). Tier 1.
- [ ] F113 · The inline `--tag-color` leaves a tag (`_includes/tag-list.html:29`,
      `assets/js/lunr/lunr-store.js:282`): nothing reads it since tags went to ink. Tier 0.
- [x] The pills at the foot of a post, and at the end of a book, are ink on one line (C08). Done
      2026-11-27 (#138), but for F113 above.

**Pictures and passages** (answered on 2026-10-01; never built)
- [x] A picture in an article takes 8 px (pick 7). Today: `figure img` is 10 px (`_sass/_base.scss`);
      `.article-image img` is 1em (`_sass/_page.scss`). `$radius-picture` exists and nothing uses it
      (S, D; R16).
- [x] The same picture no longer grows by 5 per cent onto six shadows under the pointer (S, B7; M4):
      "never zoomed or filtered on hover". Tier 1.
- [ ] A caption under a picture is Barlow, small capitals, spaced (pair 8). Today it is a face the
      site never loads, so it shows in Georgia italic (F115; S, A1.3), and its link turns black
      under the pointer (S, H16). `$caption-font-family` is deleted with it. Tier 2, answered by the pair.
- [ ] The ornament between passages of prose (picks 8 and 9). A thematic break is written `---` and
      drawn as a grey bar (`_sass/_base.scss`, `hr`; R22); inside an article's text it becomes the
      lozenge on its rule. First sort every `hr` a page draws: one between two passages takes the
      ornament; one that closes a title or parts a list stays a line. The emblem rule in two posts
      is a signature and stays. With it: the War Declaration's own `hr` rule styles nothing (F107)
      and its lozenge is a copy of the ornament's (F108): one mixin, in `_components.scss`.

**Brought into line with 0012, in these files** (tier 1 unless said; S is the audit to open)
- [ ] The read-time line is Barlow (S, A2: `.page__meta`). The Copy button on a code block fades in
      and does not rise; 10 px corners (S, B12 and D).
- [ ] A phone's side margin: a post's title stands at 16 px and its text at 24 (M14). One margin, so
      the title and the first line share an edge. The move is 8 px, so it is shown at 390 and 320.
- [ ] Tap sizes on a phone, where a post owns them: a tag (34 px high), a contents row (M22).
- [ ] Dead styles in a post's files, deleted (tier 0; S, G): the comments and share blocks and four
      orphans in `_page.scss`, `.nocturne-silence`, the duplicate face in `_tables.scss` (S, A1.6),
      the unitless shadow that is dropped (S, H14). Goes with A05 in stage 2.

## Still open: the owner's

- **The column and the title.** Where a post's title stands against its text (43 px against 270 on a
  desktop: M12), how wide the text runs (828 px, about 85 characters: R10), the one post with no
  portrait column (M13), and the 6 px slip between 1536 and 1560 px (F060). The owner's answer on
  Q24 was "wait for stage 6". It arrives as prototypes
  ([0005](../decisions/0005-choices-arrive-as-prototypes.md)) after this batch is merged, so the
  column is judged on the new page. Whether every page takes a post's root steps (Q12) goes with it.
- **The Jianfei treatise.** Its whole text and its hero title are CMU, and CMU is now "the voice of a
  quotation". One essay with a stylesheet of its own: left as it is until the owner says.

## Shared pieces

Uses: the ornament, the `card`, the `tag`, the `picture` corner, `eyebrow`, `brass-focus`, the brass
link, the arrival. New, each said in `_docs/components.md` in the same change: the fold (moved from
the colour figure), the quotation, the quiet panel.

## Journeys

`post`, `anchor`, `post-spread`, `phone-post`, `post-figures`, `arrival` and `language-arrival` must
pass. To add:

- `post-contents` · on a phone the folded row opens and a chapter leads to its heading; on a desktop
  the current chapter is marked as the page is read.
- `post-pager` · previous and next at a post's foot lead to the neighbouring posts (F116; the
  overflow half of F116 is walked by `masthead-overflow` since 2026-11-27).
- `post-tags` · a tag at the foot of a post leads to its place on `/tags/` (after stage 10's pages land).

## Exit

`npm run gate:full` passes with baselines re-captured for the post pages and About (its notices),
and no others; `npm run check:mobile-overflow` in Safari's engine; the reviewer returns PASS; the
font's bytes on a Chinese post are stated before and after. The pull request shows each pick at
both widths.
