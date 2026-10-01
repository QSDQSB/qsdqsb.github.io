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

### Q1 · Is the plan public?

Asked: 2026-10-01

You chose to keep the plan in git. This repo is public, so at the first push the roadmap, the
principles and the audit become readable by anyone. Nothing has been pushed. The case for each is
in [decisions/0006](decisions/0006-the-hub-keeps-itself.md).

- **A (recommended):** In this repo, public. One plan in every clone, every cloud session and every build. Sensitive notes go in the gitignored `_plan/private/`.
- **B:** A private repo as a submodule. Private, but the plan goes missing wherever access to the second repo is not set up, and Cloudflare's build must be given access or it fails.
- **C:** Make the whole site repo private. Private and in one piece, but this repo is a fork, so it means re-creating it.

### Q2 · Are the tiers right?

Asked: 2026-10-01

[Decision 0001](decisions/0001-who-decides-what.md) lets Claude decide changes no reader sees, and
changes that only bring something into line with an accepted decision, behind the reviewer and the
gate. Everything a reader sees anew stays yours.

- **A (recommended):** Accept as written, and tighten later if something ships that you would have stopped.
- **B:** Tier 1 also waits for me: only unseen changes go ahead alone.

### Q3 · The identity reading

Asked: 2026-10-01

[`PRINCIPLES.md`](PRINCIPLES.md), "What makes the site itself", is a draft of six traits. It becomes
the test for every later design call.

- **A:** Accept it as written.
- **B:** I will correct it: leave a note with what is wrong or missing.

### Q4 · Two phone-only changes

Asked: 2026-10-01

Both differ between desktop and phone, so both are yours. X03: let long post titles wrap on a
phone; today "War Declaration Upon the Tyranny of Boredom" is cut at "Bo". X11: the subscribe field
at 16 px on touch devices, so iPhone stops zooming the page.

- **A (recommended):** Both.
- **B:** The title wrap only.
- **C:** Neither.

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

### Q7 · The audit's findings

Asked: 2026-10-01

73 findings, each to mark Fix, Later or Leave, on their own page:
https://claude.ai/artifact/LUVt4jie4qHH9jwLYdVUP6. The High ones first, when you have time. Until
then stage 1 proceeds only with findings that are tier 0 and not in doubt.

- **A:** I have marked them.

---

## Answered

- 2026-10-01 · Where does the plan live? → Tracked in git, in the cloud. Design work this session goes straight on `master`; nothing is pushed without the owner's approval.
- 2026-10-01 · Should choices come with prototypes? → Yes; the hub builds them unasked ([0005](decisions/0005-choices-arrive-as-prototypes.md)).
