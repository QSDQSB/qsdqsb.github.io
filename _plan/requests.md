# Requests

What the owner asked for, in their words, newest first. A work run or a session takes the first open
one before the roadmap ([decisions/0010](decisions/0010-the-merge-is-the-yes.md)), claims it, and moves it
to Done with its pull request.

## Open

## Done

- 2026-10-17 · R008 · let's prepare for an email description. In the previous email, we included a snapshot of the feature in the email body. Can we have a similar template for a voyage page as well? Such that the user can see the title, excerpt and the cover, maybe the palette of the voyage? Let's firstly draft the design for this template. → done 2026-10-17: two drafts shown, the owner chose A (the magazine cover); a voyage's letter now carries that card (letter-card.mjs, send-letter), with the unmerged Reverie-card letter work brought in (#117)
- 2026-10-17 · R007 · it's a waste of resources and time to both specify each photo added, and to list the images in the Merge request. The merge request is supposed to be high-level description, not a heavy-weight line-by-line change narrator. → done 2026-10-17: harvest's hand-over and the work run's pull request now ask for a few high-level lines, with no list of frames and no thumbnails; a dated line in PRINCIPLES and 0010 (#116)
- 2026-10-17 · R006 · Let's add a new voyage "Lungern", provide close-match tags for the voyage. The photos are in Apple Photos album Voyage-of-QSDQSB - plus a previous "Wengen" picture (there is a DSCF9794). Dated 2026.10.16, Give me a few candidate of the excerpt, based on the impression of the photography we shot, and i will decide. → done 2026-10-17: Lungern, 20 photographs (19 from the album, DSCF9794 moved from Wengen), the excerpt and tags the owner chose, DSCF8729 as cover (#115)
- 2026-10-11 · R005 · please run and re-capture the baseline yourself → done 2026-10-11: master's pixel diff failed on 14 shots of six pages, every one from the eight photographs of 2026-10-10 (Home's Recent Updates and the search over it, Palette's Florence, Kyoto, London and Singapore, and London's Photobook, lightbox and colour page); re-captured, nothing else moved (#113)
- 2026-10-10 · R004 · Make sure no credentials or private information is carried in PR 110 or anywhere in the git repo → done 2026-10-10: no credential in any commit or either PR; GPS stripped from 15 committed pictures and a gate check added (#112); rewriting history is the owner's call
- 2026-10-10 · R003 · Delete the comment '# its photographs last changed: how Recent Updates ranks it' from the voyages' updated: lines → done 2026-10-10: removed from all nine voyages (#111), and harvest no longer writes it (#110)
- 2026-10-10 · R002 · Add to the command centre: a script that reads the Apple Photos album Voyage-of-QSDQSB, exports the selected pictures, uses Claude's judgement on their metadata to attribute each to its voyage album, and takes them out of that album once exported (they stay in the library). Work out how it is run: a command, or a button on the command centre. → done 2026-10-10: photos:harvest and /harvest, with From the album and Bring them in on the command centre; Photos reached only through the album (#110)
- 2026-10-06 · R001 · F041: on a device without WebGL the colour vats should quietly show a still fallback instead of failing (add this to the command centre) → done 2026-10-06: the vats paint a still 2D version of themselves (#107)
