---
name: map-pipeline-operator
description: Validate map dataset integrity across all three sources (parent-voyage frontmatter with `subgalleries: true`, sub-voyage `map:` blocks, and legacy `_data/maps/*.yml`) through to the generated GeoJSON cache and include/runtime wiring.
---

# Map Pipeline Operator

## Use This Skill When
- Editing map datasets, map pages, map include, or map renderer.
- Adding or removing sub-voyages under `_subvoyage/<parent>/`.
- Touching a parent voyage's `subgalleries:` or `map:` keys.

## Three Map Sources

| Source | Trigger | Generated artifact |
|---|---|---|
| Global voyage atlas | Always | `assets/maps/voyage-atlas.geojson` (one feature per `_voyage/*.md`) |
| Per-parent atlas (auto-derived) | `_voyage/<slug>.md` has `subgalleries: true` | `assets/maps/voyage-<slug>.geojson` (one feature per `_subvoyage/<slug>/*.md`) |
| Legacy hand-curated | A page has `map_dataset: <name>` | `assets/maps/<name>.geojson` (built from `_data/maps/<name>.yml`) |

All three end up rendered by the same Leaflet engine in `assets/js/map.js`; the renderer branches on `geojson.properties.kind === 'voyage-atlas'`.

## Workflow

1. **Global atlas**: confirm every voyage page either provides geocodable `title` or has explicit `map.lat`/`map.lng` in frontmatter — else `scripts/geocode-maps.js` will fail the atlas build.
2. **Per-parent atlas**: for each `_voyage/<slug>.md` with `subgalleries: true`:
   - Confirm `_subvoyage/<slug>/` exists.
   - For each child `.md`, confirm one of: explicit `map.lat`/`map.lng`, a `map.query` override, or a geocodable `title` (combined with parent title automatically as the default query). Atmospheric titles ("Twilight", "Portraits", "Flow", "Streetscape") need explicit handling — flag them.
   - Confirm optional `map:` viewport on the parent is shaped correctly (`center: [lat, lng]`, numeric `zoom`/`minZoom`/`maxZoom`).
3. **Legacy `map_dataset`**: confirm `_data/maps/<dataset>.yml` exists. Flag any voyage that has BOTH `subgalleries: true` AND `map_dataset:` — `page.map_dataset` wins via Liquid `default:`, which is almost never intended.
4. **Generated artifacts**: verify `assets/maps/voyage-atlas.geojson` plus one `voyage-<slug>.geojson` per `subgalleries: true` voyage exist after running `npm run geocode`. Stale `<slug>.geojson` files without a corresponding YAML or `map_dataset` reference are orphans — flag them.
5. **Runtime wiring**:
   - `_includes/map.html` — accepts `include.dataset` (preferred for the layout-driven auto-derive path) OR falls back to `page.map_dataset`.
   - `_layouts/gallery.html` — in the `subgalleries:true` branch, passes `dataset="voyage-<basename>"` to the include.
   - `_includes/head/custom.html` — Leaflet + map.js gate must match `page.subgalleries OR page.map_dataset`.
6. Emit `DATA-001` and related `CT-*` findings with remediation.

## Enforcement Mapping
- `../../data-integrity.md`
- `../../content-contracts.md`
- `../../quality-gates.md`

## Output Contract
- PASS/WARN/FAIL with dataset id (`voyage-atlas`, `voyage-<slug>`, or `<dataset>`), missing artifact, and fix sequence.
