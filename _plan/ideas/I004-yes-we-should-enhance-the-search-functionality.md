# I004 · Search that finds places, frames and colours

**Status:** staged · **Raised:** 2026-10-19 by the owner · **Stage:** none yet

## In the owner's words

> Yes we should enhance the search functionality, the current engine is imprecise and weak.

## Verdict

**Pursue, turned.** Build precise search, and let voyages answer for their own places, with no
pictures in the panel. Every word must match, forgiving only in steps, and when nothing matches, the
pages that match most words. A hex adds Reverie above the pages, and a place comes back as one line
under its voyage that opens the frame. That meets "pages first, only limited number of images" for
about 5 KB. A strip of six prints would cost 78 to 160 KB each time it showed. Prints wait until you
have seen this beside that number. I would rethink if the walks show readers mostly searching by
subject, which no version of this can answer.

**Waits on:** questions 5 and 6; walks 1 and 6 of stage 3 measured as journeys before it lands, as the "before".

**The owner:** pursue · 2026-10-19 · Pursue, turned · 2026-10-19 · in chat: precision and places into stage 3, walks 1 and 6 as journeys first; prints parked. Answers: 1 pages and photographs; 2 precise, forgiving as fallback; 3 Chinese as now; 4 no authored subjects; 5 sunset finds nothing; 6 keep the full text; hex only.

## Since it was raised (2026-10-19)

The owner's answers in chat, 2026-10-18/19, to the questions a shaped idea would have asked. Each was
a tap, the recommendation first; they are recorded under "Questions for the owner" as answered.

Then, in chat on 2026-10-19, verbatim:

> i think what matters is also the maximum matches, and the loading bandwidth for indexing. We want to be efficient, we don't want "Prague" to show 100 images of prague, rather, it should be focusing on the main pages (prague voyage for example), and only limited number of images (and consider the cost of loading).

> HEX Code should also be indexed to the reverie

And after the first shaping, the same day: subject words in `search_keywords:` (question 4) **No**;
colour names, "Hex only for now".

## Made explicit

The sentence, each way it can honestly be read. The readings taken are the lead's, except where the
owner's taps settled them.

- **"enhance"**: find more (recall), find the right thing (precision), answer faster, or look better.
  Taken: the first two. The owner's taps asked for both: photographs as results (recall), "precise,
  forgiving as fallback" (precision). The look changes only where a new kind of result needs one.
- **"the search functionality"**: the magnifier's panel (lunr, every page); the suggestions under its
  field (titles and tags, `assets/js/_main.js:244`); or every way of finding (the map, the tag pages).
  Taken: the panel and its suggestions. The tag pages are stage 10; the map is stage 3's own question.
- **"the current engine"**: the library (lunr 2), how it is asked (`lunr-en.js`: every word three ways,
  exact, prefix and one edit away, all OR'd), or what it is given (`lunr-store.js`: a voyage is its
  title and one line; no photograph at all). Taken: how it is asked and what it is given. The library
  stays: the noise is in the query, not in lunr, and a new engine would be "a mechanism or a dependency
  that changes nothing the eye sees".
- **"imprecise"**: noise. "rain" finds the GPT-4o post and 减肥日记 (train, brain); "ai" finds 14 pages;
  "london night" finds Stoos. Every word OR'd, every word forgiven a letter.
- **"weak"**: misses. "temple" and "tower bridge" find nothing or the wrong thing; a voyage's 20 or 30
  photographs are invisible to it.
- **"Prague" should not show 100 images** (the owner, second message): pages first; a voyage stands
  for its own photographs; "consider the cost of loading" counts the bytes of the index and of any
  picture in the results. The trial found the pictures are by far the larger of the two.
- **"a frame result opens straight in its voyage's lightbox"** (tap 1). The lead's reading: a place
  line that opens its first frame in the lightbox is a frame result; the tap did not say a print is
  shown in the panel. Whether one is, is left to the owner beside its byte count (Challenged, 4).
- **"HEX Code should also be indexed to the reverie"**: a query that is a colour code also offers
  Reverie on that colour (`/reverie/?c=8b2e2e`, already an address). Taken: answered, not indexed.
  Nothing is added to the store; the Reverie result stands above the pages, not in place of them (a
  post that names the hex, as "c4695d" finds today, still follows). Six characters count with or
  without `#` if they hold a digit; three need the `#` ("996" is a word in The Unreachable Bridge;
  "facade", "decade" are six letters of hex).

**Who it is for.** A reader who wants something specific (stage 3's test: "a reader who wants
something specific can get to it, and always knows how to get back"); and the owner, looking for one
of their own frames.

**Its parts**, each a thing that would have to exist:

1. Matching in four tiers, each only if the last found nothing: every word required; the last word as
   a stemmed prefix (ignored while it is one letter); words of five letters or more one letter away;
   then the pages that match the most words, ranked by how many. Chinese terms stay OR'd, as today. A
   query that is all stop words ("What Cannot Be Said") is matched against titles as plain text, as
   the suggestions already do.
2. Accents folded both ways: "seceda" finds Secëda, "tofuku" Tōfuku-ji.
3. The index page `/voyage/` out of the index (it came up in most voyage queries).
4. One small entry per place per voyage (310 pairs over 53 galleries, read by the lead): the place's
   name, folded, pointing at its first frame, so a place of two words matches inside one frame and
   not across two.
5. A voyage's entry carries a light, weather or film word only where it describes a real share of
   its frames, with the count; never every word any frame holds.
6. A rule for the list: pages first; place lines after them, one line each, at most six, and none for
   a voyage already listed above; a total cap.
7. A hex answered by a Reverie result above the pages.
8. Journeys for the new routes; the words the panel shows (its placeholder, a place line).

**What it assumes that may not be true.**

- That place names are good to search. They are a geocoder's: some are streets ("Middlesex Street",
  "Pembroke Road"), some cities are countries ("Italy", "Switzerland"), 25 of 660 frames have none,
  and 48 of 281 names carry a letter outside ASCII.
- That readers search by place and condition, not by subject. "mountain", "sea", "canal" are in no
  record; the owner chose not to add them (question 4).
- That the words a reader types for light are the book's. They are not: "sunset", "dusk",
  "evening", "sunny" are in no frame's light or weather words (question 5).
- The count. The manifests hold 1,320 records, but half repeat: `colour-atlas.json` holds a copy of
  every frame, and the parents (Dolomites, Japan, Prague, Rome) repeat their parts. There are 660
  photographs.

**What it is not asking for.** Chinese names for places (tap 3). Subjects (question 4: No).
Ridgway's 1,117 colour names ("Hex only for now"). Recognising what is in a picture. A search page with
its own address. A page per photograph (parked in [voyage and gallery](voyage-and-gallery.md)).

## Shapes it could take

1. **Precision alone.** The four tiers, accents folded, the index page out, a hex offering Reverie. A
   reader gets fewer, truer results and a way into the colour study. The store does not grow. "temple"
   and "tower bridge" still find nothing useful.
2. **Pages that know their places** (the pick). As 1, and a place line for each place a voyage's
   photographs were made at, opening the first frame there in the lightbox; a voyage carries a light,
   weather or film word only where it is a real share of its frames. "tower bridge" finds London
   first, then a line "Tower Bridge · London". "prague" finds the Prague pages and no lines under
   them. No picture is loaded.
3. **And a few prints.** As 2, and a strip of up to six small prints after the place lines, one per
   place. Each costs a 480 px rendition: 78 KB a strip in AVIF on average, up to about 160, 120 KB in
   WebP: about the whole store, each time a strip shows. **Parked** until the owner has seen shape 2
   and that number side by side.

The turn that makes it this site's own: the panel names a place as the book does, under its print, in
spaced capitals, and the photograph is seen where it is a print, in the lightbox. I would build 1 and
2 together; 3 only on the owner's word.

## What it changes

Weighed for shape 2, the largest still in play. Shape 1 touches the scripts row and the hex half of
"Pages and addresses". Shape 3 would add the bytes and the piece noted in the weight and pieces rows.
Read 2026-10-19 from the files each row names.

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | Search lives in the masthead's panel; no page of its own. A frame already has an address, `/voyage/<voyage>/#<slug>` (`lightbox.js:551`); Reverie takes `?c=<hex>` (`assets/js/colour/reverie.js:49`) | None new. Search links to both addresses as they are. Reverie gains a way in besides Palette | small |
| The search panel | One kind of result, up to 30, each a title, a type badge, a teaser (null in all 88 entries, so no picture), an excerpt, a snapshot and its tags (`lunr-en.js`) | Reverie's result first for a hex; pages; then at most six place lines; a total cap below 30. Still no picture | medium |
| Shared pieces | Type badges in green, orange and blue (`_sass/_search.scss:264-278`); a result's tags in their tag colours (`lunr-store.js`, `search_tags`) | A place line takes the eyebrow (spaced capitals), no new piece. The badges and tags go to ink as the panel is touched, in line with the owner's "no block of colour" (tier 1). Shape 3 would need a small print, from the book's Sheet | small |
| Scripts | `lunr-store.js` (Liquid → `store`, 88 entries); `lunr-en.js` (index sliced at 8 ms; the query); suggestions in `_main.js` (titles and tags) | The store adds about 310 place entries from each voyage's `site.data.photo_manifests[key].book.lightbox`; the query gains four tiers, a folding step and a hex rule; the renderer orders and caps | medium |
| Data and the photo pipeline | Manifests fetched from R2 before every build (`photos:fetch`); each carries `book.lightbox` with the book's light and weather words (`scripts/photos/lib/book.mjs:95-144`) | Read at build, as the Photobook reads them. No R2 write, no new field. The store reads `photos`, from which hidden frames are removed (`scripts/photos/lib/manifest.mjs:86`), never `inventory` or `colour-atlas.json` | small |
| The build and its weight | `lunr-store.js` 200 KB raw, 75.4 KB gzip, loaded only when the panel opens; its data is 64.0 KB gzip, most of it post text (`search_full_content: true`, `_config.yml:56`). Nothing before first paint | Before first paint: none. On demand: pooled words for 53 voyages measured at 12.9 KB raw, 4.5 KB gzip; the place-entry form not yet measured. Trimming post text to 50 words would take the data to 20.3 KB gzip (question 6). Shape 3 would add 78 to 160 KB a strip | small |
| The pictures and privacy | The book prints each frame's place under it (`_includes/photobook/frame.html:27`); the lightbox shows place, weather, light, film, camera. No frame record holds a coordinate (proved) | Nothing a reader cannot already see. The store carries names, never coordinates, and no clock time | none |
| Other stages and open calls | Stage 3's first task is the eight walks; "search that knows places" is one of its candidates "for the queue when the walk is done"; X09. Stage 2's C05 moves the panel's glass; stage 6 the tags' colours | Walks 1 and 6 are measured as journeys before this lands, so its exit has a before and after. Shares `_search.scss` with C05 and stage 6: sequenced, not built in parallel. No queue call waits on it | small |
| Upkeep | Journeys `search`, `search-corners`, and Drift's Escape (`scripts/check-journeys.mjs:322-360, 677`) | Added: a place finds its voyage and its line opens the lightbox; "prague" shows no place lines; a hex shows Reverie above its post; "日记减肥" finds what it finds today. A failed `photos:fetch` leaves search with no places and nothing says so: the journey should | medium |
| The 0004 budgets | 0004 names `lunr-store.js` (221 KB raw on 2026-10-01); its checker is not yet written | Unchanged here. If the places raise the store past its budget when the checker exists, the budget is raised in that change, in the open, as 0004 asks | none |

## Can it be delivered

Tried by the session on 2026-10-19 against the site built to the scratchpad: the real `lunr-store.js`
and lunr 2 in Node with the site's query replicated, then the new tiers, then a browser for the
lightbox; the site reviewer ran its own (`review/cjk.mjs`, `review/shape2.mjs`) and measured the
renditions. Throwaway scripts, never committed. Two counts are the lead's reading of the manifests,
said so in the row.

| What must be true | How it was tried | Result |
|---|---|---|
| "Prague" shows the Prague pages and not a list of its photographs | Not built: the rule (pages first, at most six place lines, none for a voyage already listed) is the proposal | open: on the real index, with "prague", "rain" and "classic chrome", before the pull request |
| Voyages carrying their photographs' words do not crowd the list | Shape 2 with every frame word pooled on its voyage (the reviewer) | failed: "clear" 45 voyages, "afternoon" 38, "overcast" 33, "rain" 22 with Palatine Hill first, all only through frame words. Changed to place entries and a real share; open until run again |
| A place of two words finds the voyage it is in | "tower bridge" under pooled words | failed: Twilight and Týn ranked above London, their Prague frames holding "tower" and "bridge" in different places. Place entries match inside one frame; open until run again |
| The place lines and real shares cost little to load | gzip -9 of the store with pooled words for 53 voyages (the reviewer) | proved for that form: 12.9 KB raw, 4.5 KB gzip on a 75.4 KB store. The place-entry form: open, measured in the pull request |
| A strip of prints costs a phone little | 40 renditions at 480 px sampled from img.qsdqsb.com (the reviewer) | failed: AVIF mean 13.1 KB (max 26.7), WebP mean 19.9 KB (max 47.5); six are about 78 KB AVIF, up to 160, or 120 KB WebP. Shape 3 is parked |
| A phone builds the index before a reader has typed | 747 entries in 70 ms in Node on this Mac; the page slices at 8 ms | open: shape 2 adds about 310 entries, not 660. In a browser with the processor slowed six times, then on a real phone |
| A prebuilt index would spare the phone at no cost in bytes | `lunr.Index` serialised for 747 entries | failed: 651 KB raw, larger than the data. The index is built in the browser, as today |
| Every word required fixes the noise | Three tiers over the first run's queries | proved: "temple" 0 → 5 Kyoto frames; "tower bridge" 6 wrong pages → 3 Tower Bridge frames; "ai" 14 → 2; "art" no longer finds Arth; "budap" → Budapest; "lodnon", "veniec" → London, Venice; "switzerland" → 7 voyages |
| Queries that work today still find something | The same tiers on natural queries (the reviewer) | failed: "kyoto temples at night" 20 → 0; "prague castle at night" and "london in the rain" → no page; "tower b" fell to the typo tier and showed 减肥日记@QSB and Leetcode; "What Cannot Be Said" is all stop words. Changed: a fourth tier by words matched, a one-letter last word ignored, titles as plain text; open until run again |
| Chinese queries find what they find today | "日记减肥" with every term required (the reviewer) | failed: 3 today → 0. Changed: Chinese terms stay OR'd, as tap 3 asked; open until run again |
| The prefix tier finds a word being typed | The prefix asked unstemmed, then stemmed | proved, stemmed: "venice*" never met the stemmed "venic"; with the stem and a trailing wildcard it does |
| Accented names are found with plain letters | 34 probe words typed without accents (48 of 281 place names carry a non-ASCII letter) | proved that folding is needed: lunr as is finds 13 of 34, with a folding step 32 |
| What a reader types for the light finds the book's frames | The light and weather words in `book.lightbox[].light.text` and `.weather.text` (the reviewer) | failed: "Golden hour" names 28 frames (not 39 in 14, which used the trial's own words); "sunset", "dusk", "evening", "sunny" name none, and the 50 "N min before or after sunset" are sentences. Question 5 |
| What readers search by is in the data | The trial's queries for subjects | failed: "mountain", "canal", "sea", "fog", "deer", "shrine", "fushimi" find no photograph. The owner chose to leave subjects unfindable (question 4) |
| Every photograph maps to a page that opens it, hidden frames left out | Manifests read against the voyage pages | proved for the mapping: 660 photographs, each to a voyage or part page; Venice has none. Hidden frames: `mergeManifest` (`manifest.mjs:86`) removes them from `photos`; open until the built store is searched for a hidden slug |
| A place line opens its frame, and Back returns to where the reader searched | `/voyage/london/#dscf6442` loaded in a browser | proved: the lightbox opens on Tower Bridge. Back, a line to the voyage already open (a hash change only) and WebKit: open, as a journey |
| Search reveals nothing a reader cannot see, and no coordinate | The lightbox read; `frame.html` read; every frame record scanned | proved: the lightbox shows place, weather, light, film and camera; the book prints each place; no frame record holds a coordinate |
| No clock time enters the store | `taken` holds a time; a place entry needs none | open: the built store scanned for a `T00:00` time in the pull request |
| A hex offers Reverie on that colour, and no word is taken for one | `/reverie/?c=` read (`reverie.js:49-66`); the recogniser run on eighteen queries | open: it answered #8b2e2e, 8B2E2E, #abc, #BADBED, c0ffee and left abc, facade, decade, cafe, beaded, add, 2019 as words, but read "996" as a hex. Changed: three characters need `#`; Reverie's result goes above the post that names it ("c4695d"). Run again |

## Does it fit

| Against | Verdict | Why |
|---|---|---|
| Doorways | Fits if turned | "Doorways withhold … no strips, previews, counts, film ticks or rails at the door. … Curiosity carries the reader inside; data belongs inside the book." The lead's reading: the panel is not a doorway (the design language's Doorway is "a page that leads into photographs"); it is a tool a reader reaches for with something specific in mind. Shape 2 shows no picture and names a place as the book does; shape 3's strip is the "strip" and "preview" the call names, eased by tap 1, not erased. Parked |
| The owner's second message | Fits | "focusing on the main pages (prague voyage for example), and only limited number of images (and consider the cost of loading)". Pages first, six lines at most, none under a voyage already listed, about 5 KB, no picture |
| What the eye turns away | Fits if turned | 1, "A saturated block of colour in the interface that is not a photograph": today's type badges are green, orange and blue. Turned: kinds in ink. 3, "A mechanism or a dependency that changes nothing the eye sees": no new engine. 4, "Crowding: many things where few would do": pooled words listed 45 voyages for "clear"; turned to places and real shares |
| Few things, with room | Fits if turned | "Few things, with room" (16: 1). A total cap below today's 30, and six place lines at most |
| Clock times | Fits | "Never state clock times. Dates only." The store carries no time; "46 min before sunset" stays in the specs |
| The Photobook | Fits | "the Photobook is English only": tap 3 keeps frames to the names the book prints |
| Colour pages | Fits | "Reverie is keyed on the colour; the photograph is only provenance." A hex opens Reverie, not Drift ("Plain Drift has no door, by choice"); "A colour no photograph holds shows the most adjacent match. It never shows nothing" |
| Controls | Fits | "One control per job": no new control, the same field |
| Design language: pattern and pieces | Fits | The panel is none of the six patterns: a tool that lies over the page. A place line is the eyebrow and a link; no new piece and no signature |
| What was tried | Fits | [Voyage and gallery](voyage-and-gallery.md): "Search that knows places · Open; belongs with stage 3". "A plate page per photograph" is parked for "what one frame reveals out of context": this gives a frame no page, it opens the book |

**Fits if turned**: pages lead and stand for their photographs; places as lines, not pictures; every
kind of result in ink; the panel capped.

## For and against

**For**

- A place in thirty books can be found: "temple" and "tower bridge" go from nothing or the wrong pages to the place (tried).
- The noise goes: every word required, a typo forgiven only when nothing else is found ("ai" 14 → 2).
- Cheap: places and real shares add about 5 KB gzip to a 75 KB store that loads only when the panel opens; no picture, no new engine, no R2 write.
- Accents folded find 32 of 34 names typed plainly, where lunr as is finds 13.
- A hex offers Reverie above the post that names it: the colour study's first door outside Palette.

**Against**

- Subjects stay unfindable, by the owner's call: "mountain", "sea", "canal" find nothing, and readers type them.
- The light words a reader types ("sunset", "dusk", "evening") find nothing in the book's own words unless a list maps them (question 5).
- Every word required emptied natural queries ("kyoto temples at night" 20 → 0); the fourth tier that answers it has not been run.
- The place names are a geocoder's: streets, countries for cities, 25 frames with none, now put in front of a reader.
- More to keep: four tiers, a folding step, a hex rule, 310 place entries, their journeys, and a store that depends on `photos:fetch`.

## Challenged

By: the site reviewer, 2026-10-19. Of 23 claims checked, 16 held and 7 did not; the five objections
follow them.

- **Changed:** "golden hour 39 frames in 14 voyages" used the trial's own words (sun under 8°, plus sunset, evening, dusk, noon). In the book's own words "Golden hour" names 28 frames. Corrected throughout.
- **Changed:** the sizes 10.3, 5.8 and 1.9 KB and "312 place and 234 moment words" read all 1,320 records, `colour-atlas.json` included. Struck. Shape 2 measured on its 53 voyages: 12.9 KB raw, 4.5 KB gzip. The 310 place pairs are the lead's count over the 660 photographs.
- **Changed:** "This alone answers 'focusing on the main pages'" and "'tower bridge' shows London, then one print" were wrong: under pooled words London came third. Both struck; shape 2 is now place entries.
- **Changed:** "Waits on question 4" was stale; the owner answered No. Recorded below and removed.
- **Changed:** a hex answered by one result would lose the post that names it, and "996" was read as a hex. The Reverie result now stands above the pages; three characters need `#`.
- **Changed:** (1) every word required gives nothing for queries that work today: "kyoto temples at night", "prague castle at night", "london in the rain", "tower b" falling to the typo tier, "日记减肥", and "What Cannot Be Said" (all stop words). A fourth tier ranks pages by the words matched; a one-letter last word is ignored; Chinese terms stay OR'd, as tap 3 asked; an all-stop-word query is matched against titles as plain text. Not yet run: an open row.
- **Changed:** (2) pooled frame words crowd and misrank ("clear" 45 voyages; "tower bridge" puts Twilight and Týn above London), against "Crowding: many things where few would do" and "Few things, with room". Shape 2 is now one entry per place, so a place of two words matches inside one frame. A light, weather or film word sits on a voyage only where it is a real share of its frames, with the count. "rain", "clear", "tower bridge" and "golden hour" run again before "pages first" is claimed.
- **Changed:** (3) the recall numbers rested on words the book does not use. Rerun on the book's own light and weather words: "sunset", "dusk", "evening", "sunny" find nothing.
- **Stands:** (3) whether those words should find anything is the owner's: question 5, with the list that would map them written out.
- **Changed:** (4) the prints' cost is now in the file: a strip of six is 78 KB in AVIF on average, up to about 160, and 120 KB in WebP. That is about the whole store each time it shows, against 4.5 KB for shape 2, and a phone would build 660 more entries. Shape 3 is parked; the no-picture place line is the pick.
- **Stands:** (4) tap 1 asked for photographs as results. The lead reads a place line that opens the frame as meeting it, and the owner may disagree. Whether a print is shown is theirs, beside its byte count, and "no strips, previews" still binds a strip.
- **Changed:** (5) the verdict skipped the stage's order. Stage 3's first task is the eight walks, and its exit needs a before and an after. Walks 1 ("Find the Kyoto photographs") and 6 ("Find a post on a remembered subject") are now measured as journeys before this lands.
- **Changed:** (5) the line moving 0004's store budget to per-entry was dropped. A raise, if one is needed, is made in the open in the change that needs it.
- **Stands:** (5) most of the store's weight is post text, not photographs: 64.0 KB gzip of data, 20.3 KB if each entry kept 50 words. Trimming would cost walk 6 and the Chinese essays' bigrams. That trade is the owner's: question 6.

## Questions for the owner

**Answered in chat (the owner, 2026-10-18/19; taps 1 to 3 with the recommendation first).** Recorded
here so they are not asked again.

1. What should search find? **Pages and photographs**: posts, voyages and pages as now, plus the
   frames themselves, by place, city, weather, light, film simulation and year; a frame result opens
   straight in its voyage's lightbox.
2. How strict should matching be? **Precise, forgiving as fallback**: every word must match; typo
   tolerance only for words of five letters or more, and only when the exact search finds nothing.
3. Chinese queries? **Yes, as they are now**: today's CJK matching (bigrams on `cjk_terms`) keeps
   working; no Chinese place names for frames.
4. Should search find subjects the data does not name (mountain, sea, temple), from words written per
   voyage in `search_keywords:`? **No**: search finds places, light, weather and film only; subjects
   stay unfindable.

5. Should "sunset", "dusk" and "evening" find photographs? **Find nothing**: only the book's own
   light words (Golden hour, Night, Morning light, Afternoon light…) find photographs; "sunset" finds
   the pages that say it. No mapping list. (Chat, 2026-10-19; against the lead's recommendation.)
6. Keep the full text of posts in the search (75 KB gzip), or trim it to 50 words an entry (about
   20 KB)? **Keep it**: a remembered phrase in a post, and the Chinese essays, stay findable.
   (Chat, 2026-10-19.)

Colour names (Ridgway's) as well as hex codes? **"Hex only for now"** (in chat, unnumbered).

And, said in chat on 2026-10-19 (above, verbatim): pages first and few images, with the cost of
loading weighed; a hex code answered by Reverie.

## Next

[Stage 3](../stages/03-wayfinding.md): walks 1 and 6 written as journeys first, as the before; then shapes 1 and 2 in one pull request with pictures, with the open rows run on the real index. Shape 3's prints come back only on the owner's word, beside their byte count.
