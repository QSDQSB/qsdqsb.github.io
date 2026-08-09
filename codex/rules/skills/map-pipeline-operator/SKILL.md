---
name: map-pipeline-operator
description: Validate map dataset integrity across both sources (global voyage atlas, always; per-parent atlas auto-derived from `subgalleries: true` + sub-voyage `map:` blocks) through to the generated GeoJSON cache and include/runtime wiring.
---

# Map Pipeline Operator

## Use This Skill When
- Editing map datasets, map pages, map include, or map renderer.
- Adding or removing sub-voyages under `_subvoyage/<parent>/`.
- Touching a parent voyage's `subgalleries:` or `map:` keys.

## Two Map Sources

| Source | Trigger | Generated artifact |
|---|---|---|
| Global voyage atlas | Always | `assets/maps/voyage-atlas.geojson` (one feature per `_voyage/*.md`) |
| Per-parent atlas (auto-derived) | `_voyage/<slug>.md` has `subgalleries: true` | `assets/maps/voyage-<slug>.geojson` (one feature per `_subvoyage/<slug>/*.md`) |

The old hand-curated `_data/maps/*.yml` pipeline (arbitrary named datasets, generated independently of voyage content) is retired — `_data/maps/` doesn't exist and `geocode-maps.js` no longer produces named datasets from it. `page.map_dataset` frontmatter itself still works as a direct pointer to one of the two generated ids above; the only live user is `_portfolio/voyage.html` (`map_dataset: voyage-atlas`), which includes `map.html` directly (not via gallery.html) to show the global atlas. Don't scaffold new `map_dataset` usage pointing at anything other than `voyage-atlas` or an existing `voyage-<slug>` — nothing generates other names anymore.

Both sources end up rendered by the same Leaflet engine in `assets/js/map.js`.

## Workflow

1. **Global atlas**: confirm every voyage page either provides geocodable `title` or has explicit `map.lat`/`map.lng` in frontmatter — else `scripts/geocode-maps.js` will fail the atlas build.
2. **Per-parent atlas**: for each `_voyage/<slug>.md` with `subgalleries: true`:
   - Confirm `_subvoyage/<slug>/` exists.
   - For each child `.md`, confirm one of: explicit `map.lat`/`map.lng`, a `map.query` override, or a geocodable `title` (combined with parent title automatically as the default query). Atmospheric titles ("Twilight", "Portraits", "Flow", "Streetscape") need explicit handling — flag them.
   - Confirm optional `map:` viewport on the parent is shaped correctly (`center: [lat, lng]`, numeric `zoom`/`minZoom`/`maxZoom`).
3. **Generated artifacts**: verify `assets/maps/voyage-atlas.geojson` plus one `voyage-<slug>.geojson` per `subgalleries: true` voyage exist after running `npm run geocode`. Stale `<slug>.geojson` files with no matching `subgalleries: true` voyage are orphans — flag them.
4. **Runtime wiring**:
   - `_includes/map.html` — accepts `include.dataset` (preferred, used by gallery.html) or falls back to `page.map_dataset` (used directly by `_portfolio/voyage.html`).
   - `_layouts/gallery.html` — in the `subgalleries:true` branch, passes `dataset="voyage-<basename>"` to the include.
   - `_includes/head/custom.html` — Leaflet + map.js gate must match `page.subgalleries OR page.map_dataset`.
5. Emit `DATA-001` and related `CT-*` findings with remediation.

## Enforcement Mapping
- `../../data-integrity.md`
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- PASS/WARN/FAIL with dataset id (`voyage-atlas`, `voyage-<slug>`, or `<dataset>`), missing artifact, and fix sequence.
