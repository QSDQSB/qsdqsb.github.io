Check JS source/artifact sync:

1. Compare `assets/js/_main.js` modification time against `assets/js/main.min.js`.
2. If `_main.js` is newer or has uncommitted changes not reflected in `main.min.js`, run `npm run build:js`.
3. Report whether the artifact is now in sync.
