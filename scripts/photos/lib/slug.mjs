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
