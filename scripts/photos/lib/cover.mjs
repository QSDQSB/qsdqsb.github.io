/**
 * A voyage's cover: one of its own photographs, and where in it the subject sits.
 *
 * Authored (_data/photos/<gallery>.yml, or _data/photos/<parent>.yml for a voyage in parts):
 *   cover:
 *     photo: dscf0958            a slug of this gallery; a parent names a part's photo, sesto/dscf9474
 *     focus: [0.42, 0.61]        x, y of the subject, 0–1 from the photo's top-left
 *     crops: { "4:3": [x, y] }   optional: a shape whose subject sits elsewhere
 *
 * The same cover is cut to many shapes (a 3.5:1 card, a 3:1 Photobook, a phone's near-square),
 * all as cover-fit crops. For each shape the build works out the object-/background-position that
 * puts the focus in the middle of the box, as near as the photo's edges allow: a percentage p
 * places the image's point p on the box's point p, so centring the focus f of an image k times the
 * box along that axis wants p = (f·k − ½) / (k − 1).
 */

// The boxes a cover is shown in, by ratio (width / height).
export const SHAPES = {
  card: 3.5,        // /voyage/ grid, related, the book's closing cards (3.3 on hover)
  wide: 3,          // the Photobook cover on a desktop; Home's banner
  hero: 2.4,        // the page hero on a desktop (clamp(24rem, 68vh, 38rem) tall)
  og: 1.905,        // a link preview, 1200 × 630
  screen: 16 / 9,   // the Photobook cover on a tablet; Home's smaller cards
  tall: 4 / 3,      // the page hero on a phone
  portrait: 0.85,   // the Photobook cover on a phone; Home's 4:5 door plates
};

const inUnit = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const isPoint = (v) => Array.isArray(v) && v.length === 2 && v.every(inUnit);

/** "4:3" / "3.5:1" / "16:9" → the shape of that ratio (within 6%), else null. */
export function shapeOf(key) {
  const m = String(key).match(/^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/);
  if (!m) return SHAPES[key] ? key : null;
  const r = Number(m[1]) / Number(m[2]);
  const hit = Object.entries(SHAPES).find(([, s]) => Math.abs(Math.log(r / s)) < 0.06);
  return hit ? hit[0] : null;
}

/** Problems with an authored `cover:`; empty means fine. `photo` may be `slug` or `part/slug`. */
export function validateCover(cover, where) {
  if (cover == null) return [];
  if (typeof cover !== 'object' || Array.isArray(cover)) return [`${where}: "cover" must be a mapping with photo and focus`];
  const problems = [];
  for (const k of Object.keys(cover)) if (!['photo', 'focus', 'crops'].includes(k)) problems.push(`${where}: cover: unknown key "${k}"`);
  if (typeof cover.photo !== 'string' || !/^([a-z0-9-]+\/)?[a-z0-9_-]+$/.test(cover.photo)) problems.push(`${where}: cover.photo must be a lowercase slug (a parent voyage: part/slug)`);
  if (cover.focus != null && !isPoint(cover.focus)) problems.push(`${where}: cover.focus must be [x, y], each 0–1`);
  if (cover.crops != null) {
    if (typeof cover.crops !== 'object' || Array.isArray(cover.crops)) problems.push(`${where}: cover.crops must map a shape ("4:3") to [x, y]`);
    else for (const [k, v] of Object.entries(cover.crops)) {
      if (!shapeOf(k)) problems.push(`${where}: cover.crops."${k}": not a shape covers are shown in (${Object.values(SHAPES).map(ratioName).join(', ')})`);
      if (!isPoint(v)) problems.push(`${where}: cover.crops."${k}" must be [x, y], each 0–1`);
    }
  }
  return problems;
}
const ratioName = (r) => ({ 3.5: '3.5:1', 3: '3:1', 2.4: '2.4:1', 1.905: '1.91:1', 0.85: '0.85:1' }[r] || (Math.abs(r - 16 / 9) < 1e-6 ? '16:9' : '4:3'));

const round = (v) => Math.round(v * 10) / 10;
/** One axis: the percentage that centres `f` for an image `k` times the box, clamped to the edges. */
function axis(f, k) {
  if (k <= 1.0005) return 50;
  return round(Math.min(1, Math.max(0, (f * k - 0.5) / (k - 1))) * 100);
}

/** The object-/background-position that centres `focus` of a photo (ratio `r`) in a box of ratio `box`. */
export function positionFor(focus, r, box) {
  const [fx, fy] = focus;
  return `${axis(fx, Math.max(1, r / box))}% ${axis(fy, Math.max(1, box / r))}%`;
}

/** The pixel rectangle a box of ratio `box` takes from a w × h photo around `focus` (the link preview). */
export function cropRect(focus, w, h, box) {
  let cw = w, ch = Math.round(w / box);
  if (ch > h) { ch = h; cw = Math.round(h * box); }
  const left = Math.round(Math.min(w - cw, Math.max(0, focus[0] * w - cw / 2)));
  const top = Math.round(Math.min(h - ch, Math.max(0, focus[1] * h - ch / 2)));
  return { left, top, width: cw, height: ch };
}

/**
 * What the site needs to draw a cover: the photo's tiers, its placeholder, and a position per shape.
 * `photo` is a merged (book-layered) manifest photo; `cover` the authored block.
 */
export function coverEntry(photo, cover, gallery) {
  const focus = cover.focus || [0.5, 0.5];
  const ratio = photo.ratio || photo.w / photo.h;
  const points = {};
  for (const [k, v] of Object.entries(cover.crops || {})) points[shapeOf(k)] = v;
  const pos = {};
  for (const [name, box] of Object.entries(SHAPES)) pos[name] = positionFor(points[name] || focus, ratio, box);
  return {
    gallery, slug: photo.slug, url: photo.url, w: photo.w, h: photo.h, ratio: Math.round(ratio * 1e4) / 1e4,
    sizes: photo.sizes, ph: photo.ph || null, focus, og: points.og || focus, pos,
  };
}
