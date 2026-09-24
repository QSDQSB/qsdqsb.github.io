/**
 * Photo identity. A photograph's slug is its camera frame number, lowercased:
 * `DSCF1797.jpg` → `dscf1797`. A re-collected original of the same frame keeps
 * the same slug, so captions, pinned order, and shared links survive.
 *
 * Also parses the legacy filename convention the site used before the
 * pipeline existed, where place and exposure were encoded in the name:
 *   DSCF1797_East_Smithfield,_London__XF90mm_f4.3_1:2000s_ISO320.jpg
 */

const FRAME_RE = /^_?([A-Za-z]{2,5})[_-]?(\d{3,6})(?=[_.\-\s,]|$)/;

/** `DSCF1797_anything.jpg` → `DSCF1797`; `IMG_0042.jpg` → `IMG0042`; null when no frame pattern. */
export function frameFromName(filename) {
  const stem = String(filename).replace(/\.[^.]+$/, '');
  const m = stem.match(FRAME_RE);
  return m ? `${m[1].toUpperCase()}${m[2]}` : null;
}

/** Slug for a file: the frame number lowercased, else the sanitised stem. */
export function slugFor(filename) {
  const frame = frameFromName(filename);
  if (frame) return frame.toLowerCase();
  return String(filename).replace(/\.[^.]+$/, '').toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'photo';
}

/**
 * Parse the legacy convention. Every field is optional; missing pieces are
 * null rather than guessed.
 */
export function parseLegacyName(filename) {
  const stem = String(filename).replace(/\.[^.]+$/, '');
  const frame = frameFromName(stem);
  let left = stem, right = '';
  if (stem.includes('__')) [left, right] = stem.split('__', 2);
  else {
    // No place segment: `DSCF4258_90mm_f5.6_1:1250s_ISO320`
    const parts = stem.split('_');
    if (parts.slice(1).some(looksLikeExposure)) { left = parts[0]; right = parts.slice(1).join('_'); }
  }
  let place = frame ? left.replace(FRAME_RE, '').replace(/^,?_?/, '') : left;
  place = place.replace(/_/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim() || null;

  const parts = right.split('_').filter(Boolean);
  const lensTok = parts.find(p => /mm$/i.test(p)) || null;
  const apTok   = parts.find(p => /^f\d+(\.\d+)?$/i.test(p)) || null;
  const isoTok  = parts.find(p => /^ISO\d+$/i.test(p)) || null;

  let shutter = null;
  // `_1_180s` variant first: a colon that became an underscore, `1/180`.
  const split = parts.findIndex((p, k) => /^\d+$/.test(p) && /^\d+s$/i.test(parts[k + 1] || ''));
  if (split >= 0) shutter = `${parts[split]}/${parts[split + 1].replace(/s$/i, '')}`;
  else {
    const shTok = parts.find(p => /^(\d+:\d+|\d+(\.\d+)?)s$/i.test(p)) || null;
    if (shTok) { const m = shTok.match(/^(\d+):(\d+)s$/i); shutter = m ? `${m[1]}/${m[2]}` : shTok.replace(/s$/i, ''); }
  }
  const focalFrom = (tok) => { const m = tok && tok.match(/(\d+)(?:-(\d+))?mm$/i); return m && !m[2] ? Number(m[1]) : null; };

  return {
    frame,
    place,
    lens: lensTok ? lensTok.replace(/^(XF|XC|GF)(?=\d)/i, (p) => p.toUpperCase() + ' ') : null,
    focal: focalFrom(lensTok),
    aperture: apTok ? Number(apTok.slice(1)) : null,
    shutter,
    iso: isoTok ? Number(isoTok.slice(3)) : null,
  };
}
/**
 * The legacy names stored the aperture as an APEX value (Av = 2·log2 N),
 * not an f-number: `f7.6` is f/14, `f8` is f/16, `f3` is f/2.8. Every
 * re-collected original confirms it. Convert, and snap to the camera's own
 * third-stop scale (Fujifilm writes 3.6 and 6.4 where others write 3.5 and 6.3).
 */
const THIRD_STOPS = [1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.6, 4, 4.5, 5, 5.6, 6.4, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32];
export function fNumberFromLegacy(av) {
  if (typeof av !== 'number' || !Number.isFinite(av)) return null;
  const n = 2 ** (av / 2);
  return THIRD_STOPS.reduce((best, s) => Math.abs(Math.log2(s / n)) < Math.abs(Math.log2(best / n)) ? s : best);
}

/**
 * The old site named files two ways. With a place and an `XF`/`XC`/`GF`
 * lens (`…__XF90mm_f7.6_…`) the aperture is an APEX value; with a bare lens
 * (`…_90mm_f8.0_…`) it is the f-number itself. Checked against every
 * re-collected original: 540 names of the first kind, 34 of the second.
 */
export function legacyAperture(legacy) {
  if (!legacy || typeof legacy.aperture !== 'number') return null;
  const apex = /^(XF|XC|GF)\s/i.test(legacy.lens || '');
  return apex ? fNumberFromLegacy(legacy.aperture) : legacy.aperture;
}

function looksLikeExposure(p) { return /^(f\d|ISO\d|\d+:\d+s$|\d+mm$)/i.test(p); }

/** Assign unique slugs to a list of filenames; a collision gets `-2`, `-3`… and a warning entry. */
export function assignSlugs(filenames) {
  const seen = new Map(); const out = []; const warnings = [];
  for (const f of [...filenames].sort()) {
    const base = slugFor(f); let slug = base, n = 1;
    while (seen.has(slug)) slug = `${base}-${++n}`;
    if (slug !== base) warnings.push(`slug collision: ${f} → ${slug} (also ${seen.get(base)})`);
    seen.set(slug, f); out.push({ file: f, slug });
  }
  return { slugs: out, warnings };
}
