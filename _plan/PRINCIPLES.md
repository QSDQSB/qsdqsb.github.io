# Principles

What the site is, and the calls the owner has already made. Every design decision is tested against
this page. It changes only on the owner's word; a session that disagrees with a line here raises it
in [`QUEUE.md`](QUEUE.md) and does not work around it.

Dated lines are the owner's own calls, gathered on 2026-10-01 from earlier sessions' notes so they
stop living in one machine's memory. Where two calls conflict, the later date wins.

## The direction

The owner's taste, from references given 2026-06-16 (Leica and Fujifilm cameras, il Bisonte leather,
Baroque architecture, the Prague astronomical clock, the Asamkirche, Patrick Clair's title
sequences, the Dolomites). Principles to extract, never motifs to copy.

- **Chiaroscuro.** One warm light out of deep shadow. Reveal by illumination, not by fade. Black is
  the canvas.
- **Honest mechanism.** Interactions feel like a precision instrument: tactile, detented,
  deliberate. Nothing arbitrary.
- **Surfaces carry time.** Patina, grain, aged gilt. Texture over flat digital fills.
- **Disciplined intensity.** Spare layout and a muted palette, with the richness concentrated in
  light, material and craft.
- **Gravity and slowness.** Unhurried, weighted motion. Romantic and melancholic, never bouncy.
- **Formation.** The signature gesture is something becoming: a print developing, light arriving.
- **Palette.** Near-black ground, aged brass as the metal, bone and ivory type, one flush of warm
  colour. No neon.

## What makes the site itself

A first reading from the 2026-10-01 audit. **Draft: the owner has not yet corrected it.** How these are
expressed, piece by piece, is in [`DESIGN-LANGUAGE.md`](DESIGN-LANGUAGE.md).

1. **The photograph is the light source.** Rooms take the colour of the picture in view: the
   Photobook's glow, the lightbox wash, Reverie's dye, Drift.
2. **The camera's own vocabulary is the interface.** A film dial, frames, lenses, films, a contact
   sheet, a colophon, the hours, the specs.
3. **A voice with irony and gravity, in two languages.** The copy is as much the identity as
   anything visual. See the `sound-like-qsd` and `house-style` skills.
4. **A private heraldry.** The hexagon monogram, the house sigil, tarot cards, emblem rules, word
   cards. Whimsy as accents.
5. **Things hidden for the curious.** Tarot corners, the corner mark, the chip that stirs the dye.
6. **Colour as a subject in its own right.** Palette, Reverie, Drift, Ridgway's names.

What it shows: photographs (very well, inside a book), a colour study (original, hard to find),
writing (least well), and the person (Home strongly, About weakly).

## Standing calls

### The look
- Dark editorial boutique: premium, minimal, classy, informative. Not skeuomorphic, and not an
  AI-generated showpiece.
- Playfair Display bold for titles, on every page, a voyage's included (2026-09-25; kept on
  2026-10-01, The eye, round 2, pick 14). Barlow for UI, places and labels. Didot for figures and for hex codes; Playfair's digits read badly (2026-09-28).
- Gold belongs to the sun alone in the specs. Weather marks are monotone ink. Films carry their own
  hue as small ticks and dots.
- Quiet by default: detail on hover or in hand. One control per job.

### The eye (2026-10-01, from the pairs)

What the design language is for, in the owner's words: "Most of the design aesthetics we established
should be inherited. Let's focus on the ambiguous part. The idea of the design language is not to
constrain the layout or ideas, but to have a mimicking QSD aesthetics that can kill bad designs that
are cheap, overly fancy for no good reasons."

Two rounds, the same day. In round 1 the owner scored seventeen pairs, each drawn two ways: 1 is A,
clearly; 5 is B, clearly; 3 is either. In round 2 the owner picked one of two to four strengths of
the same thing, sixteen times. The record, with what each drew, is
[the study](studies/2026-10-01-the-qsd-aesthetic.md).

How to read a line. The score or the pick, and the words in quotation marks, are the owner's, and
nothing else is. A 1 or a 5 is clear. A 2 or a 4 is a leaning, and is written as one. A 3 makes no
rule. A round 1 score answers the pair as it was drawn: which of the two, never how much. The
amounts are round 2's, further down. A sentence that opens "The lead's reading" is not the owner's
until they confirm it.

**Round 1: which**

**Colour**
- **Tags are ink only**, not each its own colour (pair 4, score 5). "Crowded saturated colour blocks
  are distracting visually. I prefer a consistent secondary layout for the functionality buttons, it
  can change colour when hovered, if distinguishing colour is required."
- **An accent is always brass**, not taken from the photograph (pair 5, score 1). "When similar
  visually, choose the simpler one with less dependency and complexity". The lead's reading: the pair
  drew the mark on a selected filter. The room's light (the glow, the wash, the dye) still comes from
  the photograph; that is the room, not an accent.
- **A heading that wants attention is white, with a brass eyebrow**, not a gradient with a glow (pair
  6, score 1). No note. The lead's reading: the pair set the house beside something loud. It turns
  away gradient type and glow; it does not re-ink the eyebrow, which is built in the second ink.
- **Icons are hairline, in ink**, not filled, each in a colour (pair 17, score 1). "Again, saturated
  pure colour blocks are distracting".
- **Over a photograph, glass and not a solid plate** (pair 10, score 1). "Again, pure-colour block
  distracts readers". The lead's reading: the pair asked glass or solid, not whether a plate belongs
  there. "No opaque plates, chips or panels over the image" (Cards) stands.

**Shape**
- **A print has square corners** (pair 1, score 1). "Rounded Rectangle is for card-like elements. We
  sometimes use rounded rectangle for pictures in the middle of article to make it more smooth".
- **A control leans rounded, not square** (pair 2, score 2). "Doesn't have to be pills, rounded
  rectangle is fine".
- How a block of words is held, on the ground under a rule or in a card (pair 3, score 3): either. No
  rule.

**Type**
- The voice of a title, serif italic or sans capitals (pair 7, score 3): either, by purpose. "Both
  have their usecase. Italic, serif, didone font for poetic and storytelling text (like Voyage);
  Barlow for easy readability (like Utils)". The note gives each face a purpose. It does not move a
  title off Playfair Display bold: asked of a voyage's title in round 2, the owner kept it (pick 14).
- **A caption is in small capitals, spaced**, not serif italic (pair 8, score 1). "Easier to read".
- The voice of a number, serif figures or sans tabular (pair 9, score 3): either. No rule. Didot for
  figures (The look, 2026-09-28) stands where it is built.

**Depth and motion**
- **A card leans raised off the page**, not flat under a rule (pair 11, score 4). "doesnt have to glow".
- **Under the pointer a card lifts and grows**; it does not merely brighten (pair 12, score 5). No
  note. This meets "no hover lift" (Cards, 2026-09-26): see below.
- **Words lean towards a slower arrival, from below, one line after another**, not a quarter second
  almost in place (pair 13, score 4). "Prefer B, but do not overdesign".

**Words, ornament and air**
- How the interface speaks, plain or with a voice (pair 14, score 3): "I prefer a combination. Clarity
  when needed. For example: "34 frames; Nothing here but dust and echoes. ONWARD"".
- **Between two passages, a brass ornament**, not a hairline (pair 15, score 5). No note.
- **Few things, with room**, not many in rows (pair 16, score 1). No note.

**Round 2: how much**

A pick is the option as it was drawn and labelled; the options it was chosen from are in brackets.
The same amounts as a scale to build from, with the single values the lead chose inside a range the
owner gave, are [decisions/0009](decisions/0009-how-much.md).

1. **A card's corners are 10 px** (pick B, of 4 px, 10 px and 18 px). "B or C depend on the
   scenario". C is 18 px.
2. **A control is a rounded rectangle of 10 px** (pick B, of a rounded rectangle of 4 px, one of 10
   px, and "A pill, and a round tool"). No note.
3. **At rest a card stands just off the page, on a short shadow** (pick B, of a hairline and no
   shadow, a short shadow, and a deep shadow). No note.
4. **Under the pointer a card lifts between 3 and 6 px and grows to between 1.012 and 1.025**: pick
   A (3 px and 1.012), with the note "Between A and B"; B is 6 px and 1.025. (Chosen of those two;
   10 px and 1.05 with a spring; and as built, 4 px and 1.03 over a second.) The one value a session
   builds, 4 px and 1.018, is the lead's, not the owner's ([decisions/0009](decisions/0009-how-much.md)).
5. **A lift takes 0.3 s** (pick A, of 0.3 s, 0.6 s, and "A full second, as built"). No note.
6. **Words arrive over 0.7 s, from 28 px below, one line after another, and settle** (pick B, of as
   built, which is half a second, 12 px, together; this; and the same with a spring at the end). No
   note.
7. **A picture inside an article has corners of 8 px** (pick B, of square, 8 px and 16 px). No note.
8. **The ornament is a lozenge on a rule** (pick A, of that, a star on a rule, three points, and a
   short brass rule). No note.
9. **An ornament stands only between passages of prose** (pick A, the nearest of three; the others
   reached under a title, and between groups in the interface). No note.
10. **Under the pointer a tag only brightens** (pick C, of "It turns brass", "It takes its own muted
    colour" and "It only brightens"). No note.
11. **Glass is 14 px of blur** (pick B, of 6 px, 14 px and 26 px). "A B Both OK". A is 6 px.
12. **Nothing springs**: "It arrives and stops" (pick A, over "It goes a little past, and settles
    back"). No note. The pick drew a card. One thing built does spring, the bubbles on Home's hero,
    which belong to a signature: they are not a fault on this line, and are not changed unasked
    (see "Not settled", below).
13. **The wide cover of a voyage does nothing under the pointer**: "Nothing moves, nothing changes"
    (pick A, over "The picture brightens; nothing moves" and "It lifts, as a small card does"). No
    note.
14. **A voyage's title stays as built: Playfair, bold, upright** (pick A, over "Italic, lighter"). No
    note.
15. **"The book may speak too, in its empty rooms and ways on"** (pick B, over "The book stays plain
    throughout"). No note.
16. **"What the eye turns away" reads true**: "Use it as the test" (pick A, over close with a note,
    and not yet). The five lines, as the owner was shown them. A design that does any of these is
    sent back before anything else is asked of it:
    - "A saturated block of colour in the interface that is not a photograph."
    - "Glow, and type that is a gradient."
    - "A mechanism or a dependency that changes nothing the eye sees."
    - "Crowding: many things where few would do."
    - "An effect that draws the eye to itself."

**Where these meet an earlier call**

Settled by round 2. The later word is the owner's, asked directly each time:
- **Nothing springs.** "Never bouncy" (The direction) stands. The two drawings the owner preferred in
  round 1 (pairs 12 and 13) overshot, and their labels did not say so. Asked directly, the owner
  chose "It arrives and stops" (pick 12). Nothing new springs; the one built exception is under
  "Not settled".
- **The wide cover does nothing under the pointer.** "No hover lift" (Cards, 2026-09-26) stands (pick
  13), and "The photograph itself never animates on hover" with it. A small card lifts (pair 12;
  picks 4 and 5).
- **A voyage's title stays Playfair Display bold** (The look, 2026-09-25; pick 14). The didone italic
  of pair 7 is for storytelling text, not for the title.
- **The Photobook's words** (2026-09-24: constrained and minimal, no over-explaining, no jokes) are
  amended, for two places: the book may speak in its empty rooms and in its ways on (pick 15), and
  only there. Everywhere else in the book the call of 2026-09-24 stands.
- **A tag takes no colour, even under the pointer.** Pair 4's note allowed one: "it can change colour
  when hovered, if distinguishing colour is required". Asked how, the owner chose "It only brightens"
  over brass and over the tag's own colour (pick 10).
- **Quick and slow.** "Short and purposeful by default" (Motion) and a slower arrival are both the
  owner's now, each with its amount: a card answers in 0.3 s (pick 5); words arrive over 0.7 s (pick
  6).

Not settled by round 2. Each is the lead's reading, not the owner's call. Where a stage builds on
one it says so, and the owner is shown the result ([decisions/0009](decisions/0009-how-much.md), "Not
settled"):
- **A card moves; the photograph in it does not.** Every card drawn in round 2 held a photograph and
  moved as one object. Read as: "never animates on hover" is about the photograph inside its frame
  (no zoom, no shift, no filter), not about the card that carries it.
- **"The one-second cover hover is deliberate"** (Cards). Pick 5 chose 0.3 s for a card's lift over
  "A full second, as built", and pick 13 leaves the wide cover no lift to time. Read as: the second
  stands for what is left of the cover's hover, the words that come under the pointer; no lift takes
  a second.
- **The words a wide cover shows under the pointer** (its line, its date). Pick 13's drawing had
  none. To the letter, "nothing changes" removes them or sets them at rest; "Quiet by default:
  detail on hover or in hand" lets them come. Asked with the refined card (stage 4).
- **"Of a voyage."** Pick 13 named a voyage's cover; the same piece carries a post. Read as: one
  piece, one behaviour.
- **The Photobook's built pill, round tools and glass.** Pick 2 chose a rounded rectangle over "A
  pill, and a round tool"; pick 11 chose 14 px, and the book's bar and panel are 18 and 24. Read
  with the owner's "Most of the design aesthetics we established should be inherited": they stay as
  built, and are shown beside the new amounts before anything is changed.
- **Does a cover take a plate of glass?** Pair 10 and pick 11 both drew a name on a plate over a
  cover. "No opaque plates, chips or panels over the image" (Cards) stands; whether a cover takes a
  glass one has still not been asked. The scrim stays.
- **The bubbles on Home's hero** turn with a spring (`assets/js/qsd-bubbles.js:356`). They belong
  to a signature (the monogram), and pick 12 drew a card. They stay as built, and are not a fault
  against "Nothing springs", until the owner has been shown them beside a still turn.
- **The wide cover at rest: its corners and its shadow.** Picks 1 and 3 drew a small card. The cover
  on `master` is rounded, on a shadow; the branch `gallery/voyage-doors` draws it square and flat.
  Neither is settled; it is chosen with the refined card (stage 4).
- **8 px beside 10 px.** A picture in an article is 8 px (pick 7) and a card 10 px (pick 1): both the
  owner's, and near each other. Whether one step would do for both has not been asked; 8 px is built.
- **Other glass.** Pick 11 drew a name on a plate over a cover. A panel of dense text (search, the
  map's panel) was not drawn: bringing one to 14 px is shown first.

### Photographs
- Photographs are prints: as large as the screen allows, nothing laid over them, never zoomed or
  filtered on hover.
- **Never state clock times.** Dates only.
- The sun diagram is the flagship. Nothing competes with it.

### Doorways (2026-09-26)
- **Doorways withhold.** A page that leads into photographs does not reveal them: no strips,
  previews, counts, film ticks or rails at the door. One magnificent cover and its poetic line.
  Curiosity carries the reader inside; data belongs inside the book.
- What the owner values in a parent page: the huge, vivid card on a large screen. The reader first
  feels each part, then goes in.
- The overview of doors, several at once, stays. A depth walk-through is a moment of entering, not
  the page.
- The bar is extraordinary, not competent layout variants. Catalogue looks, labels beside plates
  and ordering by hour were a definite no.

### Cards
- **A card is a magazine cover.** The photograph is the cover; the title is the cover line. No
  opaque plates, chips or panels over the image.
- **Text contrast is the same over every photograph**, not dependent on the photo: an engineered
  scrim plus a hairline text shadow, assuming the worst lighting.
- The photograph itself never animates on hover.
- **The one-second cover hover is deliberate.** It reads as cinematic; do not shorten it to feel
  snappy. Snappy timings are for utility controls. On 2026-10-01 the owner chose 0.3 s for a card's
  lift, over "A full second, as built", and no lift at all for the wide cover (The eye, round 2,
  picks 5 and 13): what the second still times is under "Not settled by round 2" there.
- Next refinement, on branch `gallery/voyage-doors`: full colour, the poem on phones, no hover lift
  (2026-09-26). Asked again on 2026-10-01, with the wide cover itself drawn: "Nothing moves, nothing
  changes" (The eye, round 2, pick 13). A small card lifts (picks 4 and 5); the wide cover does not.

### The Photobook
- The gallery is **immersive, not storytelling**. Stories and captions in the book are parked; the
  Photobook is English only (2026-09-26).
- The book's words are constrained and minimal: no over-explaining, no jokes (2026-09-24). Amended on
  2026-10-01 for two places: "The book may speak too, in its empty rooms and ways on" (The eye, round
  2, pick 15). Everywhere else in the book the call of 2026-09-24 stands. The words themselves are
  the owner's: a session drafts, the owner keeps or strikes.
- The specs panel stays pinned by default (auto-hide was declined). Specs and sun in the book
  appear on hover only.
- The film filter is a minimal translucent dial; first tap opens on touch. Controls step away over
  the book and return on scroll-up. No labelled pill for the filtered state.
- No hover zoom on prints. The sheet is fixed 16:9 boxes with no colour fill in the gap.
- Book rhythm is spread, pair, three. Openings are pinned by the owner through `order:`.
- Keep the 4096 px tier.

### Colour pages (2026-09-27 to 09-29)
- The chain is book → palette page → Reverie. The palette page stays where it is.
- Reverie is keyed on the colour; the photograph is only provenance. Matches are shown bare.
- The vat is misty: a watercolour with no edges. Each photo card keeps its small vat: the bar is
  the composition, the vat is the mood.
- No glass panel on the palette page; the whole room is frosted. No voyage card there.
- One viewer: full-screen viewers share the lightbox's grammar. Drift is the separate wander.
- `/utils/` is reached by its address alone. Plain Drift has no door by choice.

### Home
- No full-screen logo or loading gate. The monogram animates inline in the hero (2026-07-19).
- **The monogram loops**: inscribe, stay, dissolve, a beat of dark, carry on. The owner asked for
  the loop on 2026-07-19, reversing an earlier play-once.
- Palette is a door and a masthead item. The CV left the masthead; its way in is at the end of
  About (2026-09-29).

### Finding the way (2026-10-01)
- **Immersive without losing direction.** The masthead hides itself while a page is read and comes
  back when the reader scrolls up: a hint of looking for something. A fix to it keeps that philosophy.
- A minimal, consistent footer across the site, on pages that scroll.
- The tarot cards were a fun easter egg; the site has grown heavy and they need a new purpose. The
  wheel of fortune that spins to a random voyage is liked.
- The tag pages, for posts and for voyages, are to be redesigned from scratch.

### Controls (2026-10-01)
- Hover and focus: **smooth but not heavy; aesthetic but not distracting.**
- "Titles should be default white coloured." "Retire the overly colourful H1 to H6 font colour." (in chat)
- Inline code needs no blur.
- On the lightbox's and Drift's keys: "change to not conflicting shortcuts". Read as: a key never takes
  a shortcut the browser owns. Said of those two; taken as the rule for any page's keys unless the owner
  says otherwise.
- A colour no photograph holds shows the most adjacent match. It never shows nothing.
- A link inside a page's text is brass, with a hairline underline (Q9, option B, picked from three
  prototypes on the command centre). Blue leaves the text.

### Motion
- Short and purposeful by default; cinematic only where it is the point. Keep the reader's place.
- Every motion stops under `prefers-reduced-motion` and `html.motion-off`.

### How the owner likes to be asked
- A thinking partner with honest opinions, not a menu.
- Calls arrive as short questions with a recommendation.
- New visual directions are reviewed as a design first (Figma, or real pages with desktop and phone
  screenshots) before they are built.
- Reuse the site's own mechanism before writing a parallel one.
- 2026-10-01 · The owner decides, hears and brainstorms; Claude verifies. "User should make important
  decisions, hear Claude's well discussed proposal and ideas, brainstorm with Claude. Claude should
  have the essential automatic process to make sure the idea is justifiable and deliverable instead of
  wasting user's time to verify and amend the product quality". How the hub does it (Claude's construction, the owner's to amend) is
  [decisions/0008](decisions/0008-ready-and-done.md).
- 2026-10-01 · What an idea owes before it is decided on: "An idea needs verdict, an idea needs
  brainstorm to get explicit, an idea needs an evaluation of its influence to the existing structure,
  pros and cons".

## Hard rules

These are never anyone's call but the owner's, each time.

- Writes to R2, and removals from it. Removals: list first, then the owner types `QSD`.
- Opening or merging a pull request; pushing.
  - 2026-10-01 · One standing exception, the owner's (Q10, option A, tapped on the command centre):
    the daily run may push a branch that touches only the plan (`_plan/`). Never `master`, never a
    pull request. Every other push is still asked for, each time.
  - The owner's note beside that answer: "Hub can decide PRs but we need carefully crafted rules for
    conditions for an auto PR approval merge to master". It grants nothing yet: opening and merging
    stay the owner's, each time, until those rules are theirs
    ([I002](ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md)).
- Committing image bytes, `photos/`, `_data/photo_manifests/`, keys or `.env`: never.
