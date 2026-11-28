# Stage 14 · The shell and the small pages

**Status:** planned. **Tier:** 2, answered: the owner's picks on the sheets of 2026-11-27 (Q24, Q25;
[0013](../decisions/0013-what-the-sheets-settled.md)); 1 and 0 for what 0012 already answers. One
batch, one session, one pull request with pictures; the merge is the yes
([0010](../decisions/0010-the-merge-is-the-yes.md)).

New on 2026-11-27. It gathers what every page shares (the ending, the hero, the portrait column,
the search panel, the focus ring, the faces) and the pages no other stage holds (About, CV, Terms, a
fable's first letter). About came from [stage 6](06-posts-and-about.md); the footer and the search
panel's look from [stage 3](03-wayfinding.md); the site-wide focus ring finishes C02 of
[stage 2](02-foundations-plumbing.md).

## Goal

One shell: every page ends the same way, opens under a hero of the same proportions, answers a
keyboard with the same ring, and speaks in the faces the rule gives it. The small pages stop being
the ones furthest from the rest.

## What is already decided

**Kept as it stands (Q25; not to be re-proposed):** a hero is two thirds of the screen on a desktop;
when a page opens the menu stays away; the tarot cards, unseen until found; the subscribe card, open
until closed; three whole past letters on Subscribe; the page for a lost address; the portrait
column beside the page, everywhere. Portfolio stays unlinked: "Worry about this later" (Q24).

**The owner, 2026-11-27:**

- How a page ends: "One small mark, the line, the links" (Q24).
- On a phone: a hero is "Half the screen, as a voyage has". Under it: "The page begins in the fade,
  as a fable does".
- CV and Terms: "Both as a post"; "We should set the default hero overlay. It should be the dry vat
  of the QSD about page hero picture".
- A fable's first letter: "An illuminated initial".
- "No arrow" after a way on.
- The search panel: "Brought into line where it stands" (Q24).
- About: "Every word kept, set in the site's grammar" (Q24).
- Brass: "Both, each with a job" (Q24). The year on Posts: "Didot" (Q24).
- Chinese: "Songti wherever the Latin is a serif".
- From [0012](../decisions/0012-two-voices-one-behaviour.md): "Under the pointer a control answers
  in place… Nothing moves or grows. Only a card lifts." "Everything pressable has 10 px corners. An
  icon is a hairline in ink. Keyboard focus is the brass ring."

**Standing** ([`PRINCIPLES.md`](../PRINCIPLES.md)): "A minimal, consistent footer across the site,
on pages that scroll." "Icons are hairline, in ink, not filled, each in a colour" (pair 17). "A
saturated block of colour in the interface that is not a photograph", "Glow, and type that is a
gradient" (What the eye turns away). "No neon."

## Scope: batch 6

Tier 2, answered, unless a line says otherwise. Pictures at both widths. Audit ids are sections of
`design/audits/stylesheets.md` (S), findings of `design/audits/reviewer.md` (R) and
`design/audits/measured.md` (M).

**The ending**
- [x] Q24, endings · One ending on every page that scrolls, Home included: always the same small
      hairline mark, the page's sign-off as a label, a one-pixel rule, the links (R5: four endings
      today, a logo drawn at random from five, two of them neon; a 4 px grey bar; About's rainbow
      logo; nothing on Home). The sign-off's words stay each page's own ("Shot by QSD." under a
      book). Drift is a viewer and does not scroll: it takes none (R23; the lead's reading of "on
      pages that scroll", tier 1). The old footer's stylesheet, which no template draws, is deleted
      (S, G). The links are tall enough to tap on a phone (M22: 27 by 19 px on 28 pages; X20).

**The hero**
- [x] Q25, hero-phone · On a phone the picture at the top of a post, a fable and a small page is half
      the screen, as a voyage's cover is (35 per cent today). About, at 76 per cent, comes to the
      same half: the lead's reading of "One height for every piece", shown. Home keeps the whole
      screen. Desktop does not change. Phone and desktop differ here by the owner's pick.
- [x] Q25, hero-gap · The page begins in the picture's fade: 24 px under it on every page, where
      there are five spaces today (M27). On a phone, a fable's own. The hero's knobs used in one
      selector are set where they are used (S, H1).
- [ ] Q25, cv-terms · CV and Terms are both built as a post: Terms gains a hero and loses the filled
      newspaper beside its title (R10, R15). A page with no picture of its own takes the default
      hero: the dye poured from the colours of About's hero picture. It is the dye-hero piece of
      [stage 11](11-colour-pages.md), which is built first. The lead's, tier 1, shown: on these
      pages it is a still, so a page of text fetches no script for its head. The CV's body stays
      Barlow: it was not asked.
      *Built in part (picks-shell): Terms loses the newspaper; both stay posts. The default hero waits on stage 11's dye hero, so Terms has none yet.*
- [x] F117 · In Chrome the menu bar's glass never blurs the page: `view-transition-name` on
      `.masthead` cuts its backdrop off (`_sass/_view-transitions.scss:18`), so the rooms sit on
      sharp text. Tier 1: the right look is not in doubt.

**The small pages**
- [ ] Q24, about · Every word kept, set in the site's grammar: its notices as the quiet panel (built
      with stage 6's batch), the brass mark for the rainbow logo, the post's column and a phone's
      one margin (R11; M23; M14). The gradient that moves for ever, the rainbow words and the
      dashed rules go; nothing grows under the pointer (S, B8, B16). The typewriter's links are
      brass (F079). The emoji and the blackletter are the owner's words and stay.
      *Built (picks-shell) but the notices: their look is stage 6's quiet panel (`_sass/_notices.scss`).*
- [x] Q25, fable-initial · A fable's story opens on an illuminated initial: the first letter two
      lines deep in the fable's own brass, in the English only (`_sass/_bestiary.scss`,
      `_layouts/fable.html`; [stage 5](05-bestiary.md) holds the page).
- [x] Q24, years · The year on Posts is Didot (`.archive__subtitle`, on `/year-archive/` alone: the
      class also carries tags' names; S, A4; M15).

**The search panel**
- [x] Q24, search-panel · Brought into line where it stands: a brass hairline for its blue outlines,
      10 px corners for 30 px and a pill, a Barlow field, one prompt, ivory titles, ink badges (R6;
      M1; S, A2, B10, D, E, F). The panel's glass comes to 14 px with it and is shown ("A panel of
      dense text… is shown first": this pull request's pictures). Its knobs used in one selector are
      set where they are used (S, H1, H2). With the badges and the field off the old blue,
      `$link-color` and the two link blues go (S, H17).
- [x] R1 · On an iPhone the page shows through the results and neither can be read: the phone's
      panel takes the desktop's dark fill (`_sass/_search.scss:397-403`). Tier 1, a fault; checked
      in Safari's engine. X09 (the panel shows that it is open and can be closed on a phone) is
      built with it.
- [ ] F070 · When search's script fails to load, nothing tells the reader. The words are the
      owner's: drafted with the one prompt, and put to them on the next sheet.
      *Drafted (picks-shell), not shipped: "Search did not arrive. Close it and open it again."*

**The portrait column** (it stays everywhere: Q25)
- [x] Its icons are hairlines in ink, not five colours (R3; M19); its links' words are Barlow (S,
      A2); the column no longer grows by 5 per cent on six shadows, nor a link by 2.5 (S, B5, B6;
      M4); the avatar's endless glow goes (S, H18; 0009: no glow). Dead and dropped rules with it
      (S, G, H15). Tier 1: the icons are pair 17's ("Icons are hairline, in ink"), and both sheets
      said beside the question that they lose their colours whichever way it was answered.

**The faces**
- [x] Every native control speaks Barlow: one line (`_sass/_forms.scss:50-56`) feeds the serif to
      every button, field and select (S, A1.2). Tier 1.
- [ ] Q25, chinese-face · A Chinese name is Songti wherever the Latin beside it is a serif: a card's
      title, the contents, the portrait's line (M7). The site's serif stack names the Song faces
      ahead of the system's sans, and loses a misspelt family that matches nothing. After stage 6's
      batch, which cuts the font a phone needs in slices: the names' own characters are one small
      slice, and its bytes on Posts and on Home are stated.
      *Built in part (picks-shell): the one serif stack names Songti SC and STSong before any system sans and loses `apple-system`. The names' own slice of a web font waits on stage 6's batch.*
- [x] One stack, one name: three variables hold the same Playfair stack and two the same Barlow (S,
      A1.1, A1.7). Tier 0.
- [ ] Q25, fourth-face · CMU is the voice of a quotation. Outside a post that leaves it Home's
      motto, the word card's definition and the 404's lyrics; anything else found in it moves to
      Playfair. The Jianfei treatise is left until the owner says (stage 6).
      *Checked (picks-shell): outside a post nothing of the shell's is in CMU. Left: the atlas popup's title (`_sass/_map.scss`, the map's batch).*

**One behaviour, site-wide** (tier 1 unless said)
- [x] One focus ring: `:focus-visible` takes `brass-focus` once, in `_sass/_base.scss`, and the
      copies leave (S, E; R14; M2: 43 kinds of control get the browser's own blue ring). The shared
      pieces that declare none gain it (S, F: `onward-links`, `pill`, `round-tool`,
      `icon-button-quiet`). It finishes C02.
- [ ] Q24, brass · Two brasses, each with a job, each one name: the pale for lines, rings and links;
      the warm for a thing that is on. The other five written by hand come onto them (S, H4; M18).
      The fable's brass is parchment's own and stays.
      *Built in part (picks-shell): the two named and their jobs written beside them; the sidebar's orange is ink. Left in other batches' files: `--photobook-gold`, `#e6ce8f`, `#c9a24b`, `rgba(201,162,75)` (Home).*
- [ ] Q25, arrows · No arrow after a way on, on any page: the shared `onward-links` and every
      include that writes one (M25: fifteen on eight pages, each in whatever face the device has).
      *Built (picks-shell) but the tag pages' two (rebuilt in their own branch) and Home's door arrow (Home's batch).*
- [ ] A rule is one pixel: the 4 px grey bar (`hr` outside an article's text) and the dashed lines
      and boxes become hairlines (R22). Inside an article the ornament is stage 6's.
      *Built (picks-shell): `hr` and the tags' dashed box. The post's dashed and dotted headings are stage 6's; the Atlas heading's dash is the map's.*
- [ ] Icons the shell owns are hairlines in ink (R15). The sprite that would carry them is S08 in
      [stage 9](09-weight-and-scale.md): if it is built first, this draws into it.
      *Built in part (picks-shell): the portrait column's, Terms' newspaper, search's badges. The post's ending (tags, date, contents) is stage 6's.*
- [x] The subscribe slip: its send button and form take 10 px (7.2 and 9 today), its close mark the
      quiet icon button, its folded mark no longer grows, its field shows focus as the ring, its
      italic line is Playfair upright, and its controls are tall enough to tap (S, B11, D, E, F; M21,
      M22). Its Didot heading is the model and stays. What copies the e-mail's look is left.
- [x] The skip link takes 10 px (S, D). A phone's side margins: About, Subscribe and the 404 share
      one layout and stand at 35.2, 39.4 and 39.7 px; Terms' title at 24 (M14). One margin.
- [ ] Dead styles deleted (tier 0; S, G): the footer's file, the breadcrumbs and the old side
      navigation, the unused button and form classes, the modal, eight faces of a font no rule
      names, the unused utilities and gradients. With A05 in stage 2, whose note on three draft
      pull requests of August is read first.
      *Built (picks-shell) but `_notices.scss`'s unused colours (stage 6's file), `$link-color` (Home's type badge) and `$link-color-hover` (the notices).*

## What needs the owner

- The words for a search that did not load (F070): on the next sheet.
- Nothing else before it is built. The default hero and About are new looks: they arrive as the
  pull request's pictures.

## Shared pieces

Uses: `brass-focus`, `eyebrow`, `text-button`, `tag`, `icon-button-quiet`, the quiet panel (stage 6),
the dye hero (stage 11), the ornament's hairline. New, each said in `_docs/components.md` first: the
ending (it replaces three includes); the illuminated initial is a signature of the Bestiary.

## Order

After stage 6's batch (the quiet panel, the font's slices) and stage 11's (the dye hero). The ending
is wanted by stages 12 and 13: if this batch is late, the ending is cut out and built first.

## Journeys

`lost`, `subscribe`, `search`, `search-corners`, `masthead-touch`, `masthead-keys`,
`masthead-overflow`, `bestiary` and `no-flash` must pass. To add:

- `ending` · a post, a voyage, Home and About end with the same mark, line and links; RSS and Terms
  can be reached from Home.
- `focus-ring` · by keyboard through a post, Home and a voyage, every stop wears the brass ring and
  none the browser's own.
- `search-phone` · in Safari's engine at 390 px the results stand on the dark fill.
- `about` · About's way in to the CV works, and the CV and Terms each open under a hero (About and
  the CV have no journey today).

## Exit

`npm run gate:full` passes; `npm run check:mobile-overflow` in Safari's engine; the reviewer returns
PASS. Baselines are re-captured for every page, since the ending is on all of them: said in the
changelog line, with the pin unmoved.
