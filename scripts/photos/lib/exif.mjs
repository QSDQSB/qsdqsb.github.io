/**
 * EXIF extraction. Returns the fields the manifest carries, normalised into
 * the shapes the site displays, plus the raw GPS which only ever goes to the
 * private manifest.
 *
 * `taken` is kept as the camera wrote it: a local wall-clock string with the
 * timezone offset appended when the camera recorded one. Sorting by it as a
 * string is correct within a voyage, which is all the ordering needs.
 */

import exifr from 'exifr';

const PICK = [
  'Make', 'Model', 'LensModel', 'LensMake', 'FocalLength', 'FocalLengthIn35mmFormat',
  'FNumber', 'ExposureTime', 'ISO', 'ISOSpeedRatings', 'ExposureBiasValue', 'ExposureProgram',
  'DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTime', 'Orientation',
  'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef',
  'Software', 'Artist', 'Copyright', 'ImageDescription',
];

/** `2023:06:16 18:22:01` (+ optional `+02:00`) → `2023-06-16T18:22:01+02:00` */
export function normaliseTaken(raw, offset) {
  if (!raw) return null;
  let s = raw instanceof Date ? localIso(raw) : String(raw).trim();
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) s = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  else if (!/^\d{4}-\d{2}-\d{2}T/.test(s)) return null;
  s = s.slice(0, 19);
  if (offset && /^[+-]\d{2}:\d{2}$/.test(offset)) s += offset;
  return s;
}
function localIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 0.0037 → `1/270`, 8 → `8`, 0.5 → `1/2`, 2.5 → `2.5` */
export function formatShutter(t) {
  if (t == null || !(t > 0)) return null;
  if (t >= 1) return Number.isInteger(t) ? String(t) : String(+t.toFixed(1));
  return `1/${Math.round(1 / t)}`;
}

function cleanLens(model, make) {
  if (!model) return null;
  let s = String(model).trim();
  if (make && s.toUpperCase().startsWith(String(make).toUpperCase())) s = s.slice(String(make).length).trim();
  return s || null;
}

/**
 * @param {Buffer} buffer  image bytes
 * @returns {Promise<{taken, camera, lens, focal, aperture, shutter, iso, orientation, gps, raw}>}
 */
export async function readExif(buffer) {
  let x = null;
  try {
    x = await exifr.parse(buffer, { tiff: true, exif: true, gps: true, ifd0: true, ifd1: false, pick: PICK, reviveValues: false, translateValues: true });
  } catch { x = null; }
  x = x || {};

  const gps = (typeof x.GPSLatitude === 'number' || Array.isArray(x.GPSLatitude)) ? gpsFrom(x) : null;
  const iso = x.ISO ?? (Array.isArray(x.ISOSpeedRatings) ? x.ISOSpeedRatings[0] : x.ISOSpeedRatings) ?? null;

  return {
    taken:       normaliseTaken(x.DateTimeOriginal || x.CreateDate, x.OffsetTimeOriginal || x.OffsetTime),
    camera:      [x.Make, x.Model].filter(Boolean).map(String).join(' ').replace(/^(\w+) \1\b/i, '$1') || null,
    lens:        cleanLens(x.LensModel, x.LensMake),
    focal:       typeof x.FocalLength === 'number' ? +x.FocalLength.toFixed(1) : null,
    focal35:     typeof x.FocalLengthIn35mmFormat === 'number' ? x.FocalLengthIn35mmFormat : null,
    aperture:    typeof x.FNumber === 'number' ? +x.FNumber.toFixed(1) : null,
    shutter:     formatShutter(typeof x.ExposureTime === 'number' ? x.ExposureTime : null),
    exposureBias: typeof x.ExposureBiasValue === 'number' ? +x.ExposureBiasValue.toFixed(2) : null,
    iso:         typeof iso === 'number' ? iso : null,
    orientation: typeof x.Orientation === 'number' ? x.Orientation : 1,
    gps,
    raw: Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('GPS'))),
  };
}

function gpsFrom(x) {
  const toDec = (v, ref) => {
    let d = Array.isArray(v) ? v[0] + (v[1] || 0) / 60 + (v[2] || 0) / 3600 : Number(v);
    if (!Number.isFinite(d)) return null;
    if (ref && /^[SW]/i.test(String(ref))) d = -Math.abs(d);
    return +d.toFixed(6);
  };
  const lat = toDec(x.GPSLatitude, x.GPSLatitudeRef), lng = toDec(x.GPSLongitude, x.GPSLongitudeRef);
  if (lat == null || lng == null) return null;
  return { lat, lng, alt: typeof x.GPSAltitude === 'number' ? Math.round(x.GPSAltitude) : null };
}
