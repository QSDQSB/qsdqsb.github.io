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

### Q2 · Are the tiers right?

Asked: 2026-10-01

[Decision 0001](decisions/0001-who-decides-what.md) lets Claude decide changes no reader sees, and
changes that only bring something into line with an accepted decision, behind the reviewer and the
gate. Everything a reader sees anew stays yours.

- **A (recommended):** Accept as written, and tighten later if something ships that you would have stopped.
- **B:** Tier 1 also waits for me: only unseen changes go ahead alone.

### Q3 · Does the design language read true?

Asked: 2026-10-01

[`DESIGN-LANGUAGE.md`](DESIGN-LANGUAGE.md) is version 0 of the QSD design language: a grammar every page
shares and a register of signatures that make a page itself, with the six identity traits in
[`PRINCIPLES.md`](PRINCIPLES.md) behind it. Both are on the command centre, under "What the site is". Every
later design call is tested against them, so a wrong line there is worth a note.

- **A:** It reads true. Make it version 1.
- **B:** Close, with corrections: leave a note with what is wrong or missing.
- **C:** Not yet: I want to talk it through.

### Q5 · Bestiary until it is built

Asked: 2026-10-01

It is one of five masthead items and one of five doors on Home, and leads to an under-construction
notice.

- **A (recommended):** A designed holding page in the house's language, kept in the navigation.
- **B:** Out of the navigation until stage 5.

### Q6 · What protecting the pictures means

Asked: 2026-10-01

[Stage 7](stages/07-protecting-the-pictures.md) cannot be designed until this is chosen; the options
there cost very different things. Say what you want to prevent and the lead writes the brief.

- **A:** Casual saving (right-click, drag).
- **B:** Print-quality reuse of the large files.
- **C:** Scraping, including for training.

### Q8 · Who writes the three lines stage 1 is waiting on?

Asked: 2026-10-01

Three tasks are finished except for their words, and words are yours. (1) Reverie, when no photograph holds the colour: the count line still reads "QSD reveries in only this photograph… for now", over a photograph that is only the closest. (2) One sentence on `/terms/` saying the site counts visits with Cloudflare Web Analytics, without cookies. (3) The description of `/utils/` for search engines, today "Small tools from QSD's House of Wonders."

- **A (recommended):** The lead drafts each in the house voice; you keep, change or strike each here.
- **B:** I will write them: leave a note with the words.
- **C:** Only the privacy sentence is needed; leave the other two as they are.

### Q9 · What colour is a link inside a page's text?

Asked: 2026-10-01

Links in posts and on About are bright blue, the one colour on the site that comes from neither a photograph, the brass nor the inks. Three options are prototyped on the same lines of the About page, side by side: https://claude.ai/artifact/M5UYHyu6S8Zc29AyBLR6De. Pick there, or here.

- **A:** As today: blue.
- **B (recommended):** Brass, with a hairline underline.
- **C:** Ivory, underlined in brass.

### Q10 · Shall the hub tend itself daily?

Asked: 2026-10-01

The hub has a daily upkeep written (`/hub-daily`): it runs the gate on `master`, reads your answers and new ideas from the command centre, shapes raw ideas, sorts the findings inbox, rebuilds this page, and reports in ten lines. It changes nothing a reader sees. Scheduling it is a standing instruction, so it is yours to switch on. It costs one agent run a day.

- **A (recommended):** On, daily, and it may push a branch that touches only the plan (never master, never a pull request).
- **B:** On, daily, reporting only: nothing is pushed, so its plan edits wait for a local session.
- **C:** Not yet: sessions do the upkeep when they start.

---

## Answered

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
