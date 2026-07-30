Run `npm run geocode` to (re)build map GeoJSON caches.

The script produces two classes of output under `assets/maps/`:

1. **`voyage-atlas.geojson`** — the global atlas (one feature per `_voyage/*.md`). `_portfolio/voyage.html` references this directly via `map_dataset: voyage-atlas`.
2. **`voyage-<slug>.geojson`** — auto-derived from every `_voyage/<slug>.md` with `subgalleries: true` (one feature per `_subvoyage/<slug>/*.md`).

Before running, capture `ls -la assets/maps/` so you can report which cache files were created or updated.

After the run completes, list the changed files and any geocoding warnings the script printed (atmospheric sub-voyage titles that Nominatim couldn't resolve — these are gracefully skipped; suggest the user add `map: { lat, lng }`, `map: { query }`, or `map: { exclude: true }` to the offending sub-voyages if they want those features on the map).
