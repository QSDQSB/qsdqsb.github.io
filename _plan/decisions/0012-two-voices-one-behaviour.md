# 0012 · Two voices, one behaviour

**Status:** The owner's, 2026-11-27. Picked on two pages: Q20 (which voice a control speaks in) and
Q22 (eleven calls on one sheet, the rule itself among them, answered "Adopt these"). It amends
[0002](0002-one-control-vocabulary.md) and [0009](0009-how-much.md) where they differ.

## Context

The site had two control languages (requests R026, R027). The Photobook, Palette and Reverie spoke in
thin Barlow capitals over a hairline and nothing moved under the pointer. The menu bar and the older
pages spoke in Playfair bold inside pills, with a sheen, a lift and a shadow. 0002 had ruled for one
vocabulary and written its pieces, but no page used them, and its text button was a third look.

The owner did not want one voice: "it's interesting to combine the two voice, the poetic ones (didot,
playfair display) and the accurate helvetica ones (Barlow), but we need to establish a good rule".

## The rule

1. **A name is set in the serif** (Playfair): the site, a room in the menu, a title, an author and a
   work. Every other word on a control is Barlow.
2. **A number meant to be seen is Didot.** "Playfair's digits are somewhat smaller and inconsistent."
3. **Under the pointer a control answers in place**: its ink brightens, or a soft, still fill appears.
   Nothing moves or grows. Only a card lifts.
4. **Where you are, and what is on, is marked by a one-pixel brass hairline.**
5. **Everything pressable has 10 px corners. An icon is a hairline in ink. Keyboard focus is the brass
   ring.**

The test for a new word on a control: is it the name of a room or of a piece, or is it an
instruction, a label or a fact?

## Which scenario takes which voice

| Scenario | Voice | Set as |
|---|---|---|
| The site's name; a room in the menu; a page's, post's or voyage's own title | Poetic | Playfair bold |
| A title named as a way on (previous and next at a post's foot) | Poetic | Playfair regular, as the owner picked it |
| The line under a hero's title | Poetic | Playfair regular, upright, on every page |
| A picture's credit (an author and a work) | Poetic | Playfair, smaller than the line it follows |
| A figure meant to be seen; a hex code | Poetic | Didot |
| A card's own heading (the subscribe slip, the word card: the owner's two models) | Poetic | The serif in brass, over a Barlow body and a Barlow button |
| A label, a caption, a date, a count, "On This Page", "Previous", "Next" | Accurate | Barlow, spaced capitals (`eyebrow`) |
| A choice of view (Sequence / Colour, 中 / EN), a way on | Accurate | Barlow |
| An action (Subscribe, Copy) | Accurate | Barlow, in the one 10 px box |
| A tag, a tooltip, a form field, a utility's text | Accurate | Barlow, sentence case |

## The picks behind it

| Asked | Picked | The owner's note |
|---|---|---|
| Q20: where the serif stops on a control | Names are poetic | "it's to be consistent with the site's name. Barlow is to thin and we have a hovering menu bar, not good contrast for readability" |
| The menu's rooms | As strong as the site's name | |
| The menu under the pointer | A soft, still fill | |
| The menu bar's shape | 10 px corners | |
| On a phone, the search and menu buttons | Fine marks, no discs | "this is ugly as well" (R033), of the old button |
| On a phone, title, excerpt and credit | A larger title; the credit on its own line, right, in the serif | R031 |
| Previous and next | A label over the title | |
| The 中 / EN switch | Stays a joined pair, in Barlow | "Connecting the two elements indicate they are switchable. You can change to Barlow font for consistency." |
| A post's date and "On This Page" | Barlow | |
| Palette: a list or cards | Stays a list of bars | R028 |
| Palette's head | A hero made of the dye | R032; not built |
| The rule | Adopted | |

## The lead's values inside the picks

Reversible, and shown in the pull request's pictures:

- The fill under the pointer is white at a tenth (`--control-soft`), a little stronger than the quiet
  icon button's own on Palette.
- The switch keeps its joined shape but takes the 10 px corner (line 5), with 8 px inside it.
- The search mark is redrawn as a hairline glass, where the picture the owner picked showed the old
  glyph made smaller (line 5: an icon is a hairline).
- A phone's hero title is `clamp(1.45rem, 6.4vw, 1.9rem)`, about a quarter over what it was.
- The quiet icon button takes the 10 px corner, which 0009 had left "Not settled"; Palette's fold and
  step buttons light as rounded squares with it.
- The switch's "on" stays a filled chip, as the owner kept it; line 4's hairline is not drawn there.
- A picture's credit takes the serif at every width, where the pick was for a phone: its old face was
  never loaded, so it showed in Georgia. It is also shown now to a reader with motion off.

## Consequences

- 0002's "one mark for current" is the brass hairline; its text button stays the piece for an action.
- 0009's row "pill, round: not a control's shape" now covers the menu bar: no capsule is left in the chrome.
- The Photobook's own toggle marks "on" with an ink hairline, not brass. It was not asked, and stays.
- Not done by this record: the cards that still grow by 3 to 10 per cent (0009's lift is theirs, stage
  4); a check that refuses a transform in a control's hover; the older pages' controls, which the
  audit of 2026-11-27 lists and a second sheet puts to the owner.
