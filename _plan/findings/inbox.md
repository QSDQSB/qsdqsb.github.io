# Findings inbox

One line each: the date, the page, what was seen. Anyone files here, the moment they notice
something: a session, the daily run, the owner. The design lead sorts it into stages; an item
leaves this list when a stage takes it or it is closed.

Format: `- YYYY-MM-DD · F012 · where · what was seen (who reported)`. File one with
`node scripts/plan.mjs finding "<where>" "<what was seen>"`: it takes the next number, which is never
reused. Give it a home with `node scripts/plan.mjs take F012 "stage 3"`.

## Waiting

- 2026-10-02 · F055 · QSD's Palette, a frame's blocks · At a card about 370 px wide the last block's share wraps: '17.4% ·' then 'accent' on a second line, which drops that card's name and bar below its neighbour's (Rigi dscf5741; seen in the post's frames figure, and the palette page lays the same card) (session)
- 2026-10-02 · F054 · scripts/hub-page.mjs, the daily run · the command centre is 360 KB because every stage, decision and document is inside it. When the daily run republished it (2026-10-02), the next session could not publish without reading all 1,091 lines of that copy first. The daily run no longer republishes; a smaller page (the live part apart from the library of documents) would let it (session)
- 2026-10-01 · F053 · scripts/hub-page.mjs, the command centre · the published page always says of itself that it is behind the plan: it is built before plan.mjs published records the new hash, so the note is baked in (seen in the live page of 2026-10-01 and in the page built on 2026-10-02) (daily)
- 2026-10-01 · F052 · _plan/FEATURES.md · 18 of 30 features have no journey: the monogram and bubbles, hero and depth parallax, film dial, colophon, photo pipeline, Ridgway and utilities, map and atlas, bilingual switch, code copy, tags, tarot cards, word card, subscribe, About and CV, Bestiary, the Jianfei treatise, motion switches, view transitions. The plan check counts them and names none (daily)
- 2026-10-01 · F051 · CLAUDE.md, _docs/layouts.md · both say 9 layouts; _layouts/ holds 10. The one the doc never names is about.html, which _pages/about.md uses (daily)
- 2026-10-01 · F050 · assets/js/lunr/lunr.js · nothing loads it: search loads lunr.min.js and lunr-en.js (_includes/search/lunr-search-scripts.html), and no include, layout, script or package.json line names the unminified file. It is 100 KB and Jekyll still copies it to the live site (daily)
- 2026-10-01 · F049 · Palette, scroll reveal · after a fast scroll the cards in view are at 9% opacity for the first tenth of a second and reach full after about a second; a card only partly in view stays at 0. On a slow line this, not a missing placeholder, is what reads as a row of dark frames. A taste call: stage 11 (session)
- 2026-10-01 · F048 · assets/js/photobook/develop.js, cards · when a card's photograph fails to load, WebKit draws its broken-image mark over the placeholder on Palette and Reverie; the book's frame shows none. The img should be hidden on error (session)
- 2026-10-01 · F047 · placeholders, Safari's engine · the blurred placeholder (a 32 px image scaled up as a background) draws with a visible grid of blocks in WebKit, on the book's frames and on Palette's and Reverie's cards alike; Chromium draws it smooth. Seen in Playwright's WebKit at 390 px, 2x; a real iPhone not yet looked at. Found by the trial of the review of 2026-10-01 (session)
- 2026-10-01 · F046 · scripts/plan.mjs take, answer, decide · with hub/daily ahead these still write in the main checkout and can conflict with the daily branch in the inbox or the queue on merge (loud, not silent); a warning on stderr would say to merge first (reviewer)
- 2026-10-01 · F040 · scripts/lib/plan-markdown.mjs · an unpaired backtick in a table row swallows the cells after it; no plan file has one (reviewer)
- 2026-10-01 · F038 · _pages/palette.html, Reverie · every palette and Reverie link previews the same photograph (one og_image); a preview per voyage needs an address per voyage (design lead)
- 2026-10-01 · F037 · Didot · the site does not ship Didot: only Apple devices have it; elsewhere it falls to CMU Serif from a third-party CDN, then Playfair (audit S09, C10) (design lead)
- 2026-10-01 · F036 · hex codes · the palette blocks and the specs strip set hex codes in Barlow; the standing call (2026-09-28) says Didot for hex codes. Either a fault or the call was only about Reverie's large hex: the owner's to say (design lead)
- 2026-09-26 · F004 · photographs · about 20 without GPS, 8 with no camera record; needs the owner's input or re-exports

## Taken

Where each went is at the end of its line.

- 2026-10-01 · F034 · every page · retire the overly colourful h1 to h6 font colours; titles are white by default (owner) → stage 2
- 2026-10-01 · F033 · Posts, Tags, related cards · covers now load as they come near, but 13 of 18 post covers have no smaller rendition: `generate-cover-sizes.mjs` only reads `images/cover/` (audit S01, second half) → stage 9
- 2026-10-01 · F032 · `/reverie/?c=…#colour` · viewing a colour, the vat is not full screen; the lightbox's colour frame is drawn at a fixed 200×112 (owner) → audit P01
- 2026-10-01 · F031 · a post at 375 px · tag pills' emoji overlap the first letters of the label; seen once in a half-scale screenshot, needs a second look (audit) → audit P11
- 2026-09-29 · F022 · `/voyage-by-tags/` · the tag dock covers card titles → audit X14
- 2026-09-29 · F021 · weight · `colour-atlas.json` carries about 37 KB (compressed) Reverie does not read; `frames.json` is fetched whole on the first lightbox; the Reverie lightbox shifts layout (CLS 0.07) → audit A07
- 2026-10-01 · F030 · pixel harness · full-page shots are blank past about 16,700 px: post-notices desktop 17,075–40,390 of 42,501, mobile 16,677–51,713 of 53,423; voyage-by-tags mobile; the treatise's figure on a phone. The diff cannot see the lower half of long pages (reviewer) → stage 2
- 2026-10-01 · F029 · journeys · none yet for X10 (tarot corners take no click with search open) or X16 (a folded specs panel takes no Tab) (reviewer) → stage 1
- 2026-10-01 · F028 · the wheel of fortune · should the card it lands on light up as if hovered? Focus was not moved there: it took cards out of the Tab order and held them in their hover state (reviewer; the owner's call, with the tarot study) → stage 3 (asked with the tarot study)
- 2026-10-01 · F027 · the masthead on a phone · a tap in the middle of a page no longer un-fades the bar; it returns on a scroll up or a tap at the top. Said here so it is a choice, not an accident (reviewer) → stage 3
- 2026-10-01 · F026 · Reverie · for a colour no photograph holds, the count line still reads "QSD reveries in only this photograph… for now"; the words are the owner's (reviewer) → stage 1 (the words wait on the owner)
- 2026-10-01 · F025 · `/terms/` · with the false sections cut, the page no longer says the site counts visits with Cloudflare Web Analytics (cookieless); one sentence is wanted, in the owner's words. Its `seo_description` still mentions comments (audit P04) → stage 1 (the sentence is its "P04, second half", waiting on the owner; the description is a new task)
- 2026-10-01 · F024 · `/reverie/?…#colour` · the `#colour` address did not open the lightbox on load in the audit's browser; may be a second bug (audit) → stage 1 (audit P01, the deep-link half)
- 2026-09-29 · F020 · Home · back to the landing always re-opens on the hero; reviewers suggested skipping it on back and forward (owner's call) → stage 3
- 2026-09-29 · F019 · Recent Updates · a voyage that gained frames could link its card to the first new frame (owner's call) → ideas/voyage-and-gallery.md
- 2026-09-29 · F018 · palette colophon · says "QSD's Palette for London" three times on hover (taste) → ideas/colour-pages.md (taste calls, gathered)
- 2026-09-29 · F017 · Reverie's lightbox colour frame · shows the hex three times and counts as frame 01 (taste) → ideas/colour-pages.md (taste calls, gathered)
- 2026-09-29 · F016 · palette page at 1440 · about 110 px of space under the title (taste) → ideas/colour-pages.md (taste calls, gathered)
- 2026-09-29 · F015 · palette overview · Rigi sits alone between Prague and Rome; keep or drop the overview's short lede (taste) → ideas/colour-pages.md (taste calls, gathered)
- 2026-09-29 · F014 · Reverie on a phone · the dye takes 416 of 664 px, so the first print is below the fold (taste) → ideas/colour-pages.md (taste calls, gathered)
- 2026-09-29 · F013 · Ridgway on a phone · about 36 screens with no jump to a plate → stage 3
- 2026-09-29 · F012 · lightbox at 320 px · the back label shrinks to "‹ #…" → stage 3 (faults at 320 px)
- 2026-09-29 · F011 · palette at 320 px · "7% · accent" runs into "16%" → stage 3 (faults at 320 px)
- 2026-09-29 · F010 · Home's Wonders at 320×640 · overflows by about 27 px → stage 3 (faults at 320 px)
- 2026-09-29 · F009 · a palette card to the book · the first system Back lands on `/voyage/london/`, not the palette → stage 3
- 2026-09-29 · F008 · SEO · `/utils/` description is thin; portfolio stubs and Venice are still in `sitemap.xml` → stage 1
- 2026-09-29 · F007 · Jianfei's table overflows by 1 px; `_subvoyage/japan/tokyo.md` says "bustling" (house style) → stage 1 (the table); stage 4 (the word: it is the card's line, so the owner's)
- 2026-09-28 · F006 · palettes · salient colour is under-weighted (Porto DSCF7059: the orange roofs and yellow parasol are missing from the signature). A backfill is an R2 write: the owner's go first → stage 8
- 2026-09-28 · F005 · The Colour of Light page · orphaned: its only door, the colophon link, was removed; the owner has not been asked → closed: the page was retired on 2026-09-29 (commit 474a68a, on the owner's QSD), so there is no door to ask about
- 2026-09-26 · F003 · Venice · four parts show "still on their way"; `photos/venice/gondola/` has 5 processed photographs no page uses. The owner chose to leave this → stage 4 (already its task)
- 2026-09-26 · F002 · pixel harness · phone shots differ run to run (intermittent masks, image load timing) → stage 2
- 2026-07-28 · F001 · search · a result's snapshot double-escapes `<` and shows `&lt;!`; the fix and its checklist are in `for_agents/PENDING_ISSUES.md` → stage 1
- 2026-10-01 · F023 · `assets/colour-atlas.json` · its comment still names The Colour of Light, a page retired on 2026-09-29 (design lead, while sorting) → stage 2 (A09)
- 2026-10-01 · F035 · _plan/DESIGN-LANGUAGE.md section 7 · says every piece of the grammar is in _sass/_components.scss; palette-strip lives in _sass/_photobook.scss:1576 (design lead) → fixed in DESIGN-LANGUAGE.md the same day; the two classes move in stage 2
- 2026-10-01 · F039 · map · keyboard pans and panTo still ease for a reader who asked for stillness; only zooms, fades and the reset were stilled (X19) (reviewer) → stage 1, with X19
- 2026-10-01 · F041 · assets/js/colour/vat.js:122 · sharedRenderer throws on a device without WebGL: once shared is false, `shared?.gl.isContextLost()` reads isContextLost of undefined (?. stops at null, not false). The first vat returns blank, every later one throws, on Palette, Reverie and Drift. Found by the I001 trial with 3D off. Fix: `shared && shared.gl.isContextLost()`, and a journey with WebGL disabled (session) → stage 8, before a control is built; a fault today, so also stage 1's next batch
- 2026-10-01 · F042 · _voyage/intermezzo.md, _data/photos/intermezzo.yml · Intermezzo has processed photographs and a palette but no cover in its photo YAML: it is the one voyage of the 52 on Palette with no entry in _covers.json and no link preview of its own (it still uses header.overlay_image, which CLAUDE.md keeps for a voyage with no processed gallery). check:frontmatter does not notice. Which photograph is its cover is the owner's to pick (npm run covers:focus) (lead) → stage 8 (before a control is built; the cover is the owner's to pick)
- 2026-10-01 · F043 · _config.yml exclude · CLAUDE.md is served on the live site: qsdqsb.com/CLAUDE/ and /CLAUDE.md both answer 200 (checked 2026-10-01). The exclude list also lacks CONTRIBUTING.md, package-lock.json, skills-lock.json and docs; a local build copies design/ and photos/ into _site too (both gitignored, so not deployed). The repo is public, so nothing secret; but it is a page no reader should meet, and a change to CLAUDE.md is a change to the live site. Found by I002's trial (session) → stage 1 (content: a file the build should not serve)
- 2026-10-01 · F044 · GitHub, the repository's apps · a third-party app, ecc-tools, can push a branch inside this repository and open a pull request from it: PR 87 (open since 2026-09-29) adds files under .claude/commands/, .claude/skills/ and .codex/, and the app left eight comments on PR 90. No file of the app's is in the tree. Whether the app stays installed is the owner's call. Found by I002's challenge; read again with gh (lead) → I002, question 3 (the owner's call); stage 0 carries it
- 2026-10-01 · F045 · _plan/decisions/0006-the-hub-keeps-itself.md · says this repo is a GitHub fork that cannot be made private in place; GitHub reports fork: false and no parent (gh api repos/QSDQSB/qsdqsb.github.io). gh strays to academicpages only because the clone keeps an upstream remote (lead) → stage 0 (0006's status line)
