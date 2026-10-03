# The owner's queue

Calls that are the owner's ([decisions/0001](decisions/0001-who-decides-what.md)). Each has a
recommendation. An unanswered entry is never taken as a yes, and work carries on with everything
that does not need it. Kept to about seven, oldest first.

Answer on the command centre page (one tap each), or in a word to any session. A choice between two
ways of building something arrives with its prototypes
([decisions/0005](decisions/0005-choices-arrive-as-prototypes.md)).

Shape, so the page can show it: `### Qn · the question`, an `Asked:` date, a short paragraph, then
options as `- **A (recommended):** …`. A number is never reused: the command centre stores answers by it.

---

### Q14 · May the site carry CMU Serif itself, instead of fetching it from a third-party font service on every page?

Asked: 2026-10-02

Audit S09, marked Fix. CMU Serif's stylesheet comes from fonts.cdnfonts.com and holds back the first paint of every page; if that service is slow or blocked, the page waits. It is used by the treatise and a few base rules. Carrying it ourselves means downloading the face's files (CMU Serif is free under the SIL Open Font Licence) and committing them under assets/fonts/, as Barlow and Playfair already are: font bytes in git, which is why it is asked.

- **A (recommended):** Yes: download the faces the site uses, from the font's own release (CTAN, cm-unicode), subset to Latin, and commit them
- **B:** No files: keep the service, but load its stylesheet so it no longer holds back the page
- **C:** Leave it as it is

### Q15 · May sessions be stopped from writing to R2 by themselves?

Asked: 2026-10-03

Found while shaping I003 (F073). The project's permission file allows every npm script without a prompt (Bash(npm run *)), so npm run photos:push, which uploads photographs to R2, runs in any session with no question asked, an unattended daily run included. A write to R2 is one of your hard rules. Nothing has used it that way; the gap is that nothing would stop it. The fix is one line in .claude/settings.json, your permission file, so it is yours to say: deny that one script (and the other R2 writers, if any), so a session asks you every time.

- **A (recommended):** Deny npm run photos:push (and any other R2 writer) in the permission file; a session asks you each time
- **B:** Leave it as it is: the hard rule in the plan is enough

### Q16 · Do the four new pieces read right as drawn on the specimen page?

Asked: 2026-10-03

Stage 2 wrote the pieces your round-2 picks set the amounts for: the card (10 px, 18 px where it is the scene; a short shadow; it lifts 4 px and grows to 1.018 in 0.3 s), the tag (ink only, it brightens under the pointer), the text button (a 10 px rounded rectangle, solid and quiet) and the ornament (a lozenge on a brass rule). No page uses them yet: before any does, you see each in every state on one page, the specimen (pictures sent with this batch, at desktop and phone width; built only for the pixel baseline, no reader can reach it). Each label says whose a value is: yours, the lead's inside your range, or decided under delegation. The lead's values are the lift, the tag's corners and timing, and the button's fill and pressed state.

- **A (recommended):** Yes, as drawn: the pieces may be adopted where their stages say (Home's cards in stage 4, the ornament and a post's tags in stage 6)
- **B:** Not yet: say what to change in a note

### Q17 · Do the Photobook's pill and round tools stay as built, beside the new 10 px button?

Asked: 2026-10-03

Your pick 2 chose a rounded rectangle of 10 px for a control over a pill and a round tool. The Photobook's way back is a pill and its viewer's tools are round; 0009 left them as built (what is established is inherited) until you saw them side by side. They are side by side on the specimen page, last section.

- **A (recommended):** Keep them as built: the 10 px rectangle is for new controls; the pill and the round tools are the viewer's signature
- **B:** Bring them to the 10 px rectangle too (a change to the lightbox, shown before and after first)

### Q18 · Which white is a heading: the text's own ivory, or pure white?

Asked: 2026-10-03

You retired the colour per heading level; what is left is which white. Both shot on the Terms page, desktop and phone: https://claude.ai/artifact/SDQo4JQg98sa85ep5tobvj. The two are close (#e4e5e6 against #fff): ivory keeps one ink for the page and matches the essay's chapters and every book's title; white is a step brighter for a skimming eye, and adds a fourth ink.

- **A (recommended):** the ivory ink, as the text and every display title already are
- **B:** pure white, a step brighter than the text

### Q19 · The arrival as built: is it right on prose, and should the first screen arrive too?

Asked: 2026-10-03

Built to your picks (28 px, 0.7 s, in turn 0.12 s apart). It reaches whole blocks of a post, About, the CV and Terms, which is more than the three lines you were shown; recorded at desktop and phone in design/arrival/ (sent to you in chat). On a first load Chrome fades the first screen in while Safari shows it at once (F082): the two should agree.

- **A (recommended):** keep it, and the first screen arrives in turn in every browser, as your drawing did
- **B:** keep it, and the first screen simply stands; only what is scrolled to arrives
- **C:** too much on prose: the same turns, a smaller rise (12 px) for paragraphs

---

## Answered

- 2026-10-03 · Q13 · Does Cloudflare count the site's visits, and may the privacy page say so in this sentence? → A: Cloudflare counts them; use the draft as written
- 2026-10-02 · A frame's specs in the essay, a line of Chapter II, and the essay's link on the colour pages (in chat) → of 「代码精确算出太阳在地平线下六度以下。我们给图片标上 Night。」: "Should we give the photo specs (ISO, weather, sun angle) of that particular photo DSCF5789? essentially the specs panel", "(and also the picture itself)", "lets do it in this branch so we dont need a new PR". Chapter II now reads "出自Christopher Wren之手。底下的卷轴上刻着 Pereunt et imputantur：时辰一个个过去，都记在我们账上。" (the owner's sentence). And: "Should we also add \"In the Naming of Light\" link to all voyage pages, before \"COLOUR NAMES AFTER ROBERT RIDGWAY, 1912 →\"", then "actually both palette and reverie page 's link collections": on Reverie it stands before the Ridgway line; QSD's Palette had no such line, so it is the one way on at the foot of the overview and of each voyage's palette. Then, of Chapter II: "\"比如克莱因蓝。\" 是不是可以删掉": struck, so the unnamed chip beneath (Wengen's #326B8B) is no longer read as Klein blue.
- 2026-10-02 · The Reverie card's hint, and three lines of the essay (in chat) → of the hint: "this explanation is redundant. Let's change to: \"Note the dot next to HEX RGB code? Hover on it!\"" (so the dot stirs the dye in the card too). Chapter III's English: "I count no hours but the serene", the Chinese kept ("Let's change the English but keep the chinese"). Chapter II: "在第二章中为两个颜色加上翻译" (「肉桂赭色」, 「引杜林蓝」). Chapter IV: the hyssop sentence dropped, the owner's suggestion ("是不是可以删掉，减少意象").
- 2026-10-02 · The final design review of In the Naming of Light (asked in session) → of two fresh reviewers' advice the owner took "Chapter openings" (no rule between a title and its gloss, more air above a chapter, the title a size larger, balanced breaks); the rest left as it is ("itsok"): the lone print at full card width, the hero's line in Didot italic, the author rail in ink, thicker strip bars, Latin and Han spacing, the plate ordered by share, the phone's contents list.
- 2026-10-02 · Q12, the masthead (in chat) → option C was shown and chosen with this stated beside it: "the masthead grows on posts and not yet on other pages". Whether every page takes the same root steps stays open ([stage 6](stages/06-posts-and-about.md)).
- 2026-10-02 · Colour figures in a post (in chat, and the handoff for In the Naming of Light) → built as asked: "We can also load the HTML compoenent of the rigi palette, and maybe a large vat, they can be interactive"; a Reverie card "built by the site's own Reverie logic"; then "wrap up the display of palette / reverie element nicely to make them fit into the post narrative (for example, should we add some edges to indicate this is the 'design of palette')" and "We can also have hint for the element, for example, hovering on vat makes it move!". Reverie's dye and hex appear in a post's card on the owner's own request; no other page copies them.
- 2026-10-02 · A dot before a colour in prose (in chat) → "For each mentioned RGB inline, have an inline dot in front of the RGB with the exact colour"; and of the unnamed chip, "用wengen这个，在klein blue前用小点来代表颜色吧".
- 2026-10-02 · A chapter's translation beneath its title (in chat) → "let's design special style for the latin translation for each chapter title"; then "We should have a clsssy premium way to display the section title Latin translation below the title". Built as `blockquote.gloss`; the look is the owner's to keep or strike on seeing it.
- 2026-10-02 · The essay look, on this post (in chat) → "ALSO use /design-taste-frontend to make this page more harmonic (the content). You are free to add custom css elements inside"; of the faces, "想中文的字体用宋体英文playfair或者didot", and to Playfair with Songti and lining figures, "可以".
- 2026-10-02 · Graphics in an article sit centred (in chat) → "Anything graphic that appears in the middle of a article should be center aligned."
- 2026-10-02 · The frames fold (in chat) → "The voyage palette for Ricky is occupying too many areas inside the article. We should make it an expandable area. It might be expandable by clicking or hovering." Built to open on a press; its two labels and the plates' hints are drafts for the owner to keep or strike.
- 2026-10-02 · The Reverie card's place and foot (in chat) → "the vat should move to before the paragraph 'reverie来自古法语'"; "Did you see the awkward edge for the vat in chapter V?" (its dye now melts into the card).
- 2026-10-02 · Committing the All Souls picture (asked in session) → "Commit under images/posts/". The owner's yes for these image bytes, this once.
- 2026-10-02 · The post's prose (asked in session) → Ch I: the second 所以 becomes 于是. Ch IV: the alternative sentence, after 「太阳的角度书写着时间。」. The last line: italic, in its real case, with the card kept. Daphne Red's chip: after the prose mentions it.
- 2026-10-02 · Q12 · On a wide window, how does a post sit on the page? → C: the spread that grows (answered in session on 2026-10-02; built in _sass/_page.scss)
- 2026-10-02 · Actions may approve pull requests (in chat) → the owner switched it back on themselves, after asking "what if we let PR to auto approve?" and hearing the case against; a workflow's token stays read by default. "I ran the command, please remember this". Nothing merges by itself: auto-merge is off. [I002](ideas/I002-rules-for-the-hub-to-approve-and-merge-a-pull-re.md) stays parked.
- 2026-10-01 · Q11 · Does the design language now read true, and become version 1? → A: Yes: it reads true, and becomes version 1. (Tapped on the command centre, 2026-10-01, no note.)
- 2026-10-01 · Round 2 of the aesthetic pairs (picked on the pairs page, and pasted in chat) → sixteen picks, three with a note: the amounts, and the five places where round 1 met an earlier call. The record is [the study](studies/2026-10-01-the-qsd-aesthetic.md); the owner's lines are in [`PRINCIPLES.md`](PRINCIPLES.md), "The eye", round 2; the amounts as a scale to build from are [decisions/0009](decisions/0009-how-much.md). Settled: nothing springs; the wide cover does nothing under the pointer; a voyage's title stays Playfair bold; the book may speak in its empty rooms and ways on; a tag takes no colour, even hovered; "What the eye turns away" reads true. What a pick met and did not draw is listed in 0009, "Not settled", and is shown before it is changed.
- 2026-10-01 · Round 1 of the aesthetic pairs (scored on the pairs page, and pasted in chat) → seventeen pairs scored 1 to 5, eleven with a note. The record is [the study](studies/2026-10-01-the-qsd-aesthetic.md); the lines are the owner's in [`PRINCIPLES.md`](PRINCIPLES.md), "The eye", each with its pair, its score and the note. They chose which, not how much: the amounts are round 2, on the same page. A 3 made no rule (pairs 3, 7, 9, 14). Four of the lines meet an earlier call and are asked, not read: whether the full-width voyage cover lifts ("no hover lift", 2026-09-26, against pair 12); whether a card that holds a photograph may grow; whether anything overshoots ("never bouncy"); whether the combination of plain and voiced words reaches into the Photobook.
- 2026-10-01 · Q8 · Who writes the three lines stage 1 is waiting on? → C: only the privacy sentence is needed; leave the other two as they are. (Tapped on the command centre.) Reverie's count line and the description of /utils/ stay as they are.
- 2026-10-01 · How the design language is to be settled (in chat) → by scoring pairs: "Most of the design aesthetics we established should be inherited. Let's focus on the ambiguous part. The idea of the design language is not to constrain the layout or ideas, but to have a mimicking QSD aesthetics that can kill bad designs that are cheap, overly fancy for no good reasons. You can create an artifact or a local html to use side by side comparison and let me select (score 1-5) of the preference between the two options, and we approach and summarise the aesthetics". Round 1 is [the study](studies/2026-10-01-the-qsd-aesthetic.md).
- 2026-10-01 · A reader's review of the colour pages' cards (in chat) → audited, not built: the fault it names was fixed the same day with the book's own blur. [The study](studies/2026-10-01-a-review-card-placeholders.md).
- 2026-10-01 · Q10 · Shall the hub tend itself daily? → A: on, daily, and it may push a branch that touches only the plan (never master, never a pull request). The owner's note: "Hub can decide PRs but we need carefully crafted rules for conditions for an auto PR approval merge to master". The note is kept as idea I002; nothing merges by itself until those rules are the owner's.
- 2026-10-01 · Q9 · What colour is a link inside a page's text? → B: brass, with a hairline underline. (Tapped on the command centre.)
- 2026-10-01 · Q6 · What protecting the pictures means → A: casual saving (right-click, drag). (Tapped on the command centre.)
- 2026-10-01 · Q5 · Bestiary until it is built → A: a designed holding page in the house's language, kept in the navigation. (Tapped on the command centre.)
- 2026-10-01 · Q3 · Does the design language read true? → C: not yet, the owner wants to talk it through. The owner's note: "We need to revisit it". The design language stays version 0, a draft; where it and the principles differ, the principles win.
- 2026-10-01 · Q2 · Are the tiers right? → A: accept the tiers as written, and tighten later if something ships that the owner would have stopped. (Tapped on the command centre.)
- 2026-10-01 · Who verifies (in chat) → Claude does, before the owner looks: "User should make important decisions, hear Claude's well discussed proposal and ideas, brainstorm with Claude. Claude should have the essential automatic process to make sure the idea is justifiable and deliverable instead of wasting user's time to verify and amend the product quality". Built as [0008](decisions/0008-ready-and-done.md): an idea is tried and argued against before it is returned.
- 2026-10-01 · What an idea owes (in chat) → "An idea needs verdict, an idea needs brainstorm to get explicit, an idea needs an evaluation of its influence to the existing structure, pros and cons". The idea file's shape and `check-plan` were changed to match ([`ideas/README.md`](ideas/README.md)).
- 2026-10-01 · Headings (in chat) → white by default; the colourful h1 to h6 retired. The owner's words: "We should probably also retire the overly colourful H1 to H6 font colour. Add that to the list"; "Titles should be default white coloured".
- 2026-10-01 · An idea workshop (in chat) → yes: "the option to let me add brainstorm ideas, store it somewhere, decompose and deconstruct the idea, check the fitness to the site, revamp and refurbish the idea". Built as `_plan/ideas/` and `/idea`.
- 2026-10-01 · The audit is not to be fixed all at once (in chat) → "You don't need to solve all 70 issues at once. Here we focus on a long term structural change". Stage 1 proceeds in batches; the hub came first.
- 2026-10-01 · Q1 · Is the plan public? → **Public, in this repo.** ("Public plans then.")
- 2026-10-01 · Q4 · Two phone-only changes → **Both**: long post titles wrap on a phone (X03) and the subscribe field is 16 px on touch (X11). Both marked Fix on the audit.
- 2026-10-01 · Q7 · The audit's findings → **Marked: 72 Fix, 1 Later (P03)**, nine with a note. Recorded in [the audit](findings/2026-10-01-ui-audit.md).
- 2026-10-01 · Where does the plan live? → Tracked in git, in the cloud. Design work this session goes straight on `master`; nothing is pushed without the owner's approval.
- 2026-10-01 · Should choices come with prototypes? → Yes; the hub builds them unasked ([0005](decisions/0005-choices-arrive-as-prototypes.md)).
