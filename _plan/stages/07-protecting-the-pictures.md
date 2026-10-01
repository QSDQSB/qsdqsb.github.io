# Stage 7 · Protecting the pictures

**Status:** planned. The goal is the owner's (Q6, answered 2026-10-01). Nothing is designed: this is
the frame, and the trial that comes before the owner is asked anything more. **Tier:** 2.

## Goal

A reader who right-clicks a print, drags it, or holds a finger on it does not come away with the
file by that gesture. A reader who is looking, reading or finding their way notices nothing at all,
whether they use a pointer, a finger, a keyboard or a screen reader.

It discourages. It stops nobody who is determined: a screenshot, the browser's own tools and the
address in the page's source all still work, and the brief says so to the owner in those words.

## What is already decided

- **The owner, 2026-10-01 (Q6, option A, tapped on the command centre):** protecting the pictures
  means "casual saving (right-click, drag)".
- [`PRINCIPLES.md`](../PRINCIPLES.md), Photographs: "Photographs are prints: as large as the screen
  allows, nothing laid over them, never zoomed or filtered on hover."
- `PRINCIPLES.md`, The Photobook: "Keep the 4096 px tier."
- `PRINCIPLES.md`, The look: "Quiet by default: detail on hover or in hand. One control per job."
- `PRINCIPLES.md`, The direction: "**Honest mechanism.** Interactions feel like a precision
  instrument: tactile, detented, deliberate. Nothing arbitrary."
- `PRINCIPLES.md`, Controls: "a key never takes a shortcut the browser owns. Said of those two; taken
  as the rule for any page's keys unless the owner says otherwise." It was said of the lightbox's and
  Drift's keys. The browser's menu has a key of its own, so the line reaches this stage; that reach
  is the lead's reading, and it is marked as such where it is used below.
- `PRINCIPLES.md`, Hard rules: "Writes to R2, and removals from it." Nothing in scope needs one.
- [0001](../decisions/0001-who-decides-what.md): it changes what the site does when a reader acts,
  so the behaviour is the owner's to choose. Tier 2.

## In scope

Casual saving, and only that. The gestures:

- the pointer's menu on a photograph: "Save image as", "Copy image", "Open image in new tab";
- dragging a photograph out of the page;
- a long press on a phone: "Save to Photos", "Copy", "Share".

On the photographs a reader came for: the prints in a book and on its contact sheet, the lightbox,
the cover of a book, the prints on Palette and Reverie, Drift. Whether a card's cover, a hero and a
post's own pictures are covered is settled by the first trial below, which lists every place a
photograph can be saved today.

## Out of scope, by the owner's answer

| Left out | Why | What stays as it is |
|---|---|---|
| Reuse at print quality | Q6 asked which of three things was meant; the owner chose casual saving. The owner's call stands: "Keep the 4096 px tier." | Every tier, public at `img.qsdqsb.com` |
| Scraping and hot-linking | Not chosen | No signed addresses, no Worker in front of R2 |
| A mark on the photograph, seen or unseen | Not chosen, and it would mean rendering every photograph again: a write to R2 | The renditions |
| Rules for crawlers | Not chosen. `robots.txt` welcomes every crawler, the AI ones by name (read 2026-10-01) | `robots.txt` |
| Capture times in the page's data | A question of privacy, not of saving. They are never shown as clock times | Raised as its own call if the owner wants it |

Each row can come back as its own call. None is done in passing here.

## What is true today

Read from the code on 2026-10-01.

- A print in a book is a button holding the picture, with the photograph's name and its `alt`
  (`_includes/photobook/frame.html:20-23`).
- In the lightbox the picture already cannot be dragged (`assets/js/photobook/lightbox.js:168`;
  `_sass/_photobook.scss:1074`). Nowhere else is a drag stopped.
- Nothing on the site cancels the browser's menu or the long press.
- A print on Palette and Reverie is a picture inside a link (`assets/js/colour/cards.js:51`). There
  the browser's menu and the long press also carry "Open link in new tab" and "Copy link address".
- A hero is a background image on most pages and a picture on some (`_includes/page__hero.html:67`
  and `:89`). A background has no "Save image as" in most browsers already.
- Renditions are public at `img.qsdqsb.com`, up to 4096 px, cached for a year. Manifests are private.

## The ways, and what each costs

Only the ways that answer casual saving. None is chosen here.

| Way | Stops | Cost to a reader | Cost to build |
|---|---|---|---|
| Cancel the pointer's menu on a photograph | Save, copy and open-in-a-tab from the menu, on a desktop and on Android | The browser's menu is the browser's. On a linked print it takes "Open link in new tab" with it. The same event fires for the keyboard's menu key, which must be left alone | A few lines of script, on every page that shows a print |
| No drag | Dragging the file out | None found | One attribute or one line of CSS. Already so in the lightbox |
| No long-press sheet (`-webkit-touch-callout`) | "Save to Photos" on an iPhone | On a linked print it takes the link's preview and "Open in New Tab" with it | One line of CSS. Provable only on a real iPhone |
| A transparent layer over the print | The menu finds the layer, not the picture, and nothing is cancelled | It is something laid over a photograph. It sits between the reader and the print's own button, the pinch and the pointer | Markup on every print. Strains "nothing laid over them" in its letter; see below |
| The print drawn as a background or on a canvas | The menu's image items | A screen reader loses the photograph: no `alt`. The browser loses `srcset` and lazy loading | Ruled out by the list below |
| Words: a line saying the prints are not for saving | Nothing | One more thing said. "Quiet by default" | The words are the owner's |

**On the layer.** "Nothing laid over them" was said of what a reader sees: plates, chips, captions.
A layer nobody sees is inside the letter of the call and arguably outside its sense. That reading is
the lead's, not the owner's. So the layer is tried last, only if the first three ways leave a gesture
open, and it reaches the owner as a question with the line quoted. It is never assumed.

## What a reader with a keyboard or a screen reader must not lose

Each line is a thing to prove in the trial, and afterwards a step in a journey.

1. Every print keeps its picture element and its `alt`. A book's print stays a button with its name.
   A screen reader's list of images still lists the prints, and nothing new is announced.
2. The Tab order and the focus ring are as they were. Enter and Space still open the lightbox.
   Nothing new takes focus.
3. The menu key and Shift+F10 on a focused link or control still open the browser's menu. The menu
   is cancelled for a pointer on a photograph and for nothing else. (The lead's reading of "a key
   never takes a shortcut the browser owns".)
4. Text stays selectable and can be copied: a caption, a place, the specs, a hex code. No rule
   switches selection off for a page.
5. The menu on anything that is not a photograph is untouched: a link, a word, the page.
6. A print that is a link can still be opened in a new tab, by the menu or by a long press. If a way
   takes that from a reader, the owner is told it as a cost of that way.
7. Zoom is untouched: the browser's, and the pinch on a phone.

## What is tried before the owner is asked anything

[0008](../decisions/0008-ready-and-done.md): "What never reaches them is a proposal nobody tried."
The session or a prototyper runs these in a worktree, against the built site; nothing is committed.
The riskiest first.

| What must be true | How it is tried |
|---|---|
| Cancelling the menu on a photograph can leave the keyboard's menu, and the menu on a link's text, alone | A spike on a book and on Palette. In Chromium and in Safari's engine: a right-click on a print, the menu key on a focused print, a right-click on a caption and on a text link. Which were cancelled |
| The three ways without a layer stop the three gestures | The same spike: the menu, a drag, and by hand a long press on a real iPhone and a real Android phone. No program can press and hold on a phone: those two stay open until a hand has done it |
| Nothing in the list above is lost | The journeys `book`, `deeplink`, `palette`, `reverie`, `reverie-unheld`, `drift` and `voyages` pass with the spike on. Each of the seven lines is checked once by hand with the keyboard and with VoiceOver |
| Every place a photograph can be saved by a gesture is known | A script walks the built pages (Home, the Voyage index, a parent voyage, a book, its sheet, the lightbox, Palette, Reverie, Drift, a post, About) and lists each picture element that shows a photograph, and each background that does |
| The layer is not needed | If the rows above hold, it is dropped and "nothing laid over them" is not touched. If a gesture stays open on some browser, that browser and that gesture are named for the owner |
| What still gets through is written down | A screenshot, the browser's tools, the address in the source, the picture's own address opened directly. One paragraph, for the owner to read beside the choice |
| It adds almost nothing to a page's weight | Bytes of script and CSS before and after, against [0004](../decisions/0004-budgets-that-only-fall.md) |
| It does not break the palette sheet | [I001](../ideas/I001-a-palette-shareable-as-an-image.md) is to hand a reader an image with a photograph on it, on purpose. With the spike on, the sheet is still made, and the print on the page still cannot be saved by the gesture |

## What needs the owner, and how it arrives

Nothing waits on the owner now. After the trial:

- If two ways are both defensible (for instance: the gesture simply does nothing, or it is answered
  with a quiet word), it is a `/choose`. A choice of behaviour needs the real thing: each option
  built in its own worktree and through the gate
  ([0005](../decisions/0005-choices-arrive-as-prototypes.md)). A still cannot show what a right-click
  does, so the page says in one line per option what happens on each of the three gestures, and the
  owner tries the picked one on their own phone before it ships.
- If the trial leaves one honest way, it is one call: what it does, what it costs a reader, what
  still gets through.
- The layer, if it is needed at all: its own question, with "nothing laid over them" quoted.
- Any words a reader would read: the owner's.

## Which shared pieces it uses

None, if it is silent. It adds no control and nothing a reader sees. If the owner chooses words, they
are set with a piece that is built. The tooltip (`_docs/components.md`) answers a pointer only, so on
a phone it is not enough by itself; a new piece for the words would be its own call.

## It touches

- [Stage 8](08-palette-as-image.md) and I001: the owner chose, the same day, that a photograph may be
  on the palette image. One stage keeps a print from being saved by a gesture; the other hands one
  out inside a sheet. They agree only if the photograph on the sheet is small beside what this stage
  guards. The study in stage 8 states that size.
- Stage 11 works on the same colour pages.

## Journeys

None covers it today. To add, with the build: a journey that right-clicks and drags a print in a
book, in the lightbox and on Palette, and finds the gesture answered as chosen; and its other half,
that the menu on a caption, on a text link and from the keyboard is left alone. The long press is
checked by hand and said so in the changelog line.

## Exit

The owner's pick is recorded here. `npm run gate:full` passes with no baseline re-captured: nothing a
reader sees at rest has changed. The new journey passes in Chromium, and the iPhone check passes in
Safari's engine. The reviewer returns PASS, having walked the seven lines above. What was proved only
by hand (the long press on an iPhone and on Android) is named, with who did it and when.
