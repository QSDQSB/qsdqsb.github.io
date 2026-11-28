# Features

Every thing the site does, where its code lives, and which journey proves it still works. This is
the map a session reads instead of searching: find the row, open the files it names.

`scripts/check-plan.mjs` checks that every path here exists and every journey id is real, so the
table cannot quietly go stale. A feature with no journey is a feature the gate cannot defend: the
check counts them. Add the row when a feature ships; add its journey to
`tests/journeys/<id>.mjs` in the same change.

