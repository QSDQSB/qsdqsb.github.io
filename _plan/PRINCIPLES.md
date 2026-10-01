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
- Playfair Display bold for titles, on every page, a voyage's included (2026-09-25). Barlow for UI,
  places and labels. Didot for figures and for hex codes; Playfair's digits read badly (2026-09-28).
- Gold belongs to the sun alone in the specs. Weather marks are monotone ink. Films carry their own
  hue as small ticks and dots.
- Quiet by default: detail on hover or in hand. One control per job.

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
  snappy. Snappy timings are for utility controls.
- Next refinement, on branch `gallery/voyage-doors`: full colour, the poem on phones, no hover lift
  (2026-09-26).

### The Photobook
- The gallery is **immersive, not storytelling**. Stories and captions in the book are parked; the
  Photobook is English only (2026-09-26).
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
