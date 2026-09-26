/**
 * Where each gallery sits on the map: the coordinates the voyage atlas already publishes
 * (assets/maps/*.geojson, written by `npm run geocode`). The processor falls back on them for the
 * sun of a frame whose original carries no GPS; at city precision the two agree to the minute.
 *
 * A gallery resolves through the page that names it (gallery_name in _voyage/ or _subvoyage/),
 * then through its own path: prague/twilight → voyage-prague.geojson "twilight" → the atlas "prague".
 */

import fs from 'node:fs';
import path from 'node:path';

const GALLERY_NAME = /^gallery_name:\s*["']?([^"'\n]+?)["']?\s*$/m;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function pointsOf(file) {
  const points = new Map();
  for (const f of readJson(file)?.features || []) {
    const [lng, lat] = f.geometry?.coordinates || [];
    if (f.properties?.slug && Number.isFinite(lat) && Number.isFinite(lng)) points.set(f.properties.slug, { lat, lng });
  }
  return points;
}

/** gallery → { parent, slug } of the page that shows it. */
function pagesOf(root) {
  const pages = new Map();
  const scan = (dir, parent) => {
    let names = [];
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      if (d.isDirectory() && !parent) { scan(path.join(dir, d.name), d.name); continue; }
      if (!d.name.endsWith('.md')) continue;
      const m = fs.readFileSync(path.join(dir, d.name), 'utf8').match(GALLERY_NAME);
      if (m) pages.set(m[1], { parent, slug: d.name.replace(/\.md$/, '') });
    }
  };
  scan(path.join(root, '_voyage'), null);
  scan(path.join(root, '_subvoyage'), null);
  return pages;
}

/** A function gallery → { lat, lng } | null, read once from the repository at `root`. */
export function galleryPlaces(root) {
  const maps = path.join(root, 'assets', 'maps');
  const atlas = pointsOf(path.join(maps, 'voyage-atlas.geojson'));
  const parts = new Map();
  const partsOf = (parent) => {
    if (!parts.has(parent)) parts.set(parent, pointsOf(path.join(maps, `voyage-${parent}.geojson`)));
    return parts.get(parent);
  };
  const pages = pagesOf(root);

  return (gallery) => {
    const page = pages.get(gallery);
    const [top, rest] = [gallery.split('/')[0], gallery.split('/').slice(1).join('/')];
    return (page?.parent && partsOf(page.parent).get(page.slug))
      || (page && !page.parent && atlas.get(page.slug))
      || (rest && partsOf(top).get(rest))
      || (page?.parent && atlas.get(page.parent))
      || atlas.get(top)
      || null;
  };
}
