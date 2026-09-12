Check that `assets/js/main.min.js` is rebuilt from its sources.

1. Run `npm run check:js-sync`.
2. If it reports the bundle stale, run `npm run build:js`, then re-run the check.
3. Report whether the artifact is now in sync.

Never hand-edit `main.min.js` — it is generated from `assets/js/_main.js`
plus the plugins listed in the `uglify` script.
