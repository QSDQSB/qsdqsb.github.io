Bring the album in: `$ARGUMENTS`

The owner gathers the photographs they want on the site in one Apple Photos album, **Voyage-of-QSDQSB**.
This takes them from there to their voyages. The script does what needs no judgement; you do the
rest, by looking at the pictures. Run it from the main checkout (it reads `photos/`, the fetched
manifests and `.photos-local/`).

**Photos is open to you only through this album** (the owner, 2026-10-10). Every step below is
`npm run photos:harvest`; a hook refuses `osascript`, enrich, ingest, the library's files and computer
use on Photos. Never work around it.

1. **Look.** `npm run photos:harvest`. It lists the album, exports each new photo as edited (the owner's
   crop) with its camera record restored from the same item's original, names its place, and proposes
   a voyage: `sure` (a published photo of the same day's walk), `likely` (the voyage of its city), or
   `open`. Minutes for new photos (Photos downloads from iCloud; Overpass is slow); seconds after.

2. **Judge.** Look at every waiting photo, not only the open ones: the thumbnails are
   `.photos-local/harvest/thumbs/<id>.jpg` (Read them; make a contact sheet in the scratchpad for many).
   The site's galleries are places, not trips: a later visit joins its city's voyage. Settle each
   `likely` and `open` one, and overrule a `sure` one the picture contradicts:
   ```bash
   npm run photos:harvest -- set DSCF3744 london --why "Whitehall's arcades by the Embankment"
   npm run photos:harvest -- set DSCF0500 prague/charles-bridge --why "the bridge's statues, from the Old Town side"
   npm run photos:harvest -- set DSCF9000 lisbon --why "a first trip to Lisbon: no voyage yet"   # a new gallery
   npm run photos:harvest -- set DSCF9001 hold --why "a near-duplicate of DSCF9000"
   ```
   Write the `--why` for the owner: what in the picture decided it. A new gallery's name is the
   place in lower-case kebab (`lake-como`), a part after a slash (`japan/nara`).

3. **Show the owner.** Rebuild and republish the command centre (`/hub page`). Its "From the album" part
   shows each photo, where it goes and why; the owner can change any, and **Bring them in** is their
   yes. Don't ask in chat: the tap is the decision. Then stop here until they tap.

4. **Take the yes.** The tap lands in the page's store, collection `harvest`, one document per plan
   hash (`ArtifactData`, action "list", collection "harvest"). Record the document for the current
   hash, as the store holds it:
   ```bash
   npm run photos:harvest -- go '{"hash":"…","destinations":{"<id>":"<gallery>"},"at":"…"}'
   ```
   It refuses a hash the plan no longer has (the album changed, or you set something after the owner
   looked): republish and let them look again. A yes in chat is not this; a tap is.

5. **Bring.** `npm run photos:harvest -- bring`. It pulls each voyage whole from R2 (so `photos:locate`
   keeps its place names), then runs `photos:ingest` from its own inbox with the owner's yes in place
   of typing QSD: import, locate, check, push. Each photo that reached the bucket is tagged in Photos
   `qsdqsb: <gallery>`, and its voyage's `updated:` moves to now. About a minute a photo, more while
   Overpass is slow. Run it in the background and wait for it.

6. **Hand it over.** Once the processing workflow has run (`gh run list --workflow photos-process.yml -L 3`,
   then `npm run photos:status -- --gallery <g>`: "no problems"), commit on a branch: the voyages'
   `updated:`, `_data/photo_locations/` (check `git diff --stat` shows no deletions), and a new
   voyage's page (the `voyage-scaffolder` agent; it needs a cover, `npm run covers:focus`). One pull
   request, with the photos' thumbnails as its pictures. The owner's merge is the yes for what a
   reader sees of it.

7. **The album.** When every photo in it is on the site, the script says so, and so does the command
   centre: the owner empties it in Photos (⌘A, then Delete → Remove from Album; never ⌘⌫, which deletes
   from the library). Until then, tagged photos are skipped, so nothing comes in twice.

If something fails, the plan in `.photos-local/harvest/plan.json` holds where each photo stands; a
re-run of `look` keeps every destination already decided.
