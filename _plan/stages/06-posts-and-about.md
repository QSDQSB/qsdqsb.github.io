# Stage 6 · Posts and About

**Status:** idea. **Tier:** 2. Three things the owner's picks of 2026-10-01 answer are tier 2,
answered ([0009](../decisions/0009-how-much.md)), and may be built as soon as
[stage 2](02-foundations-plumbing.md) has the pieces; they do not wait for the reading design.

## Goal

Writing and the person, shown in the house's own language. The audit's reading: writing is the body
of work the site shows least well, and About is the page least like the site.

## What the audit saw

- The Posts list is cover cards showing a title only; nothing says what a post is about.
- A post's title is 30.6 px under a 900 px photograph, 1.5 times the body. Lines run to 85 to 90
  characters in English (P06); about 44 glyphs in Chinese, which is right.
- The author rail, the boxed contents list, emoji tag pills and the pager are the old theme's.
- About: emoji bullets and a pink-to-yellow gradient notice, off the palette.
- Long titles are cut on a phone (X03: approved on 2026-10-01, a task in stage 1).
- Tag pills overlap their emoji on a phone (P11).

## What is already decided

The owner, 2026-10-01 ([`PRINCIPLES.md`](../PRINCIPLES.md), The eye):

- "A picture inside an article has corners of 8 px" (round 2, pick 7). From round 1: "We sometimes
  use rounded rectangle for pictures in the middle of article to make it more smooth" (pair 1).
- "The ornament is a lozenge on a rule" (pick 8). "An ornament stands only between passages of
  prose" (pick 9): not under a title, not between groups in the interface.
- "Tags are ink only" (pair 4, score 5). "Under the pointer a tag only brightens" (pick 10).
- "Words arrive over 0.7 s, from 28 px below, one line after another, and settle" (pick 6): built in
  stage 2, and seen first on a post.
- "A voyage's title stays as built: Playfair, bold, upright" (pick 14). "Italic, serif, didone font
  for poetic and storytelling text (like Voyage); Barlow for easy readability (like Utils)" (pair 7,
  score 3). The title is not what turns italic. Which of the two a post's body is, is still this
  stage's question.
- "Few things, with room" (pair 16, score 1).
- "Photographs are prints: as large as the screen allows, nothing laid over them, never zoomed or
  filtered on hover" (Photographs).

The lead's reading, not the owner's: About's pink-to-yellow gradient notice and its emoji bullets
are turned away by "A saturated block of colour in the interface that is not a photograph" and
"Glow, and type that is a gradient". No pair drew them, so they are shown before and after, not
removed in passing.

## Scope: answered, to build after stage 2's pieces

Each is tier 2, answered: pictures at desktop and at phone width, on a post in English and one in
Chinese.

- [ ] A picture in an article takes 8 px (pick 7). Today: `figure img` is 10 px
      (`_sass/_base.scss:261-263`); `.article-image img` is 1em, about 16 to 18 px
      (`_sass/_page.scss:64-90`).
- [ ] The same picture grows by 5 per cent under the pointer, onto six shadows
      (`_sass/_page.scss:81-88`). That is against "never zoomed or filtered on hover". The lead's
      reading: it goes, tier 1, in line with a standing call, shown before and after. If the owner
      holds a picture in an article to be a card and not a print, it lifts as a card does instead.
- [ ] The ornament between passages of prose (picks 8 and 9). A thematic break in a post is
      written `---` and drawn today as a grey bar, 2 px thick and 38.2% wide
      (`_sass/_base.scss:197-203`); eight posts hold a `---` beyond their front matter. Inside an
      article's text it becomes the lozenge on its rule. The markup does not change: an author still writes `---`.
      First sort every `hr` a page draws: one between two passages takes the ornament; one that
      closes a title, or parts a list, a table or a group of controls, stays a line. The emblem
      rule in two posts is a signature and stays.
- [ ] The pills at the foot of a post, and at the end of a book, take the `tag` piece (C08, marked
      Fix): ink, one look, brightening under the pointer. Today each wears its own colour as its
      words and a 2 px line, and fills with it under the pointer (`_includes/tag-list.html`,
      `_sass/_page.scss:807-823`). A search result's tags are the same class, coloured from
      `assets/js/lunr/lunr-store.js`, and change with them. The inline `--tag-color` leaves both.
      The emoji in the names stay until the owner says ([stage 10](10-tags.md)).

## Open questions

- A reading design for posts: measure, title scale, where the contents list lives, what the hero
  is for on a text page. One part is answered: on a wide window a post is a centred spread that
  grows with the window (Q12, the owner, 2026-10-02: option C of
  [the choice](https://claude.ai/artifact/Cov1emhETSfm9XZeULkVWs); built in `_sass/_page.scss`).
  Option C was chosen with its cost stated: the masthead grows on a post at those widths and not
  yet on other pages (68 px elsewhere; 75, 82 and 90 px on a post at 1920, 2400 and 2880).
  Still open from it: whether the same root steps go to every page.
- One measure for both languages, or one each?
- Is a post's body the storytelling face or the reading one (pair 7)? It may differ post by post.
- What About is for: an introduction, a colophon of the person, a letter?

## Scope, once designed

- [ ] Post layout on the Photobook shell.
- [ ] The Posts index.
- [ ] About.

## Shared pieces

Uses: the ornament, the `tag`, the `picture` corner, the arrival, the brass link, `eyebrow`,
`display-title`, `lede`. New: nothing in the answered tasks. The reading design may need one (a
contents list); if so it is said in the catalogue first.

## What needs the owner

- Nothing for the answered tasks, beyond seeing the pictures.
- The reading design, About, and About's notice and bullets: a choice, with prototypes
  ([0005](../decisions/0005-choices-arrive-as-prototypes.md)). Not in the queue yet.

## Journeys

`post` and `anchor` must pass. To add: `post-tags`, a tag at the foot of a post leads to its place
on `/tags/`.

## Exit

The answered tasks: `npm run gate:full` passes, the reviewer returns PASS, baselines re-captured
for the post pages and no others. The rest: chosen from prototypes, written after stage 4, so the
card and the shell are already proven.
