# Workflow Contract

Defines the canonical AI workflow for this repository.

## Canonical Flow

1. `prepare`
2. `serve` or `build`
3. `verify`
4. `document` (implementation note for completed functionality)

## `prepare` Requirements

`prepare` must include both preprocessing pipelines:
- Map geocoding: `node scripts/geocode-maps.js` (or `npm run geocode`)
- Gallery thumbnails: `bundle exec rake generate_thumbnails`

## Build/Serve Requirements

- Preferred build command sequence:
  1. `bundle exec rake generate_thumbnails`
  2. `npm run geocode`
  3. `bundle exec jekyll build`

- Preferred serve command sequence:
  1. `bundle exec rake generate_thumbnails`
  2. `npm run geocode`
  3. `bundle exec jekyll serve`

## JS Source-of-Truth Contract

- JS source file: `assets/js/_main.js`
- Generated artifact: `assets/js/main.min.js`
- Do not hand-edit `assets/js/main.min.js` as source behavior change.
- Source change must include artifact sync (`npm run build:js`).

## Failure Semantics

- Missing preprocess step: workflow non-compliant.
- Source/artifact JS drift: non-compliant.
- Map/galleries changed without corresponding preprocess execution: non-compliant.
- Completed functionality without tiny implementation note in `for_agents/IMPLEMENTATIONS`: non-compliant.

## Related Checks

- `WF-001` canonical sequence applied
- `WF-002` preprocess completeness
- `WF-003` JS source/artifact sync
- `IMPL-001` implementation note presence
- `IMPL-002` implementation note completeness
