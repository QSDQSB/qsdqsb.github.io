/**
 * Lossless EXIF injection for JPEGs, for test fixtures: a synthetic picture
 * given a camera, a capture time and an exposure reads like a camera file.
 * The image bytes are untouched; only the APP1 segment is rewritten.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const piexif = require('piexifjs');

// piexifjs predates EXIF 2.31; teach it the timezone tag so `taken` round-trips with its offset.
const OFFSET_TIME_ORIGINAL = 36881;
piexif.TAGS.Exif[OFFSET_TIME_ORIGINAL] = piexif.TAGS.Exif[OFFSET_TIME_ORIGINAL] || { name: 'OffsetTimeOriginal', type: 'Ascii' };

const rational = (n, den = 1000) => [Math.round(n * den), den];

/** Shutter `1/270`, `8.0`, `0.2` → rational seconds. */
function shutterRational(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d+)\/(\d+)$/);
  if (m) return [Number(m[1]), Number(m[2])];
  const n = Number(s);
  return Number.isFinite(n) ? rational(n, 100) : null;
}

/**
 * @param {Buffer} jpeg
 * @param {{aperture?:number, shutter?:string, iso?:number, focal?:number, lens?:string, taken?:string, description?:string, camera?:string, software?:string}} f
 * @returns {Buffer} a new JPEG buffer
 */
export function injectExif(jpeg, f) {
  if (!(jpeg[0] === 0xff && jpeg[1] === 0xd8)) throw new Error('injectExif: not a JPEG');
  const zeroth = {}, exif = {};
  if (f.camera) { const [make, ...model] = f.camera.split(' '); zeroth[piexif.ImageIFD.Make] = make; if (model.length) zeroth[piexif.ImageIFD.Model] = model.join(' '); }
  if (f.description) zeroth[piexif.ImageIFD.ImageDescription] = f.description;
  if (f.software) zeroth[piexif.ImageIFD.Software] = f.software;
  if (typeof f.aperture === 'number') exif[piexif.ExifIFD.FNumber] = rational(f.aperture, 10);
  const sh = shutterRational(f.shutter); if (sh) exif[piexif.ExifIFD.ExposureTime] = sh;
  if (typeof f.iso === 'number') exif[piexif.ExifIFD.ISOSpeedRatings] = f.iso;
  if (typeof f.focal === 'number') exif[piexif.ExifIFD.FocalLength] = rational(f.focal, 10);
  if (f.lens) exif[piexif.ExifIFD.LensModel] = f.lens;
  if (f.taken) {
    const m = String(f.taken).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})?/);
    if (m) { exif[piexif.ExifIFD.DateTimeOriginal] = `${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6]}`; if (m[7]) exif[OFFSET_TIME_ORIGINAL] = m[7]; }
  }
  const bytes = piexif.dump({ '0th': zeroth, Exif: exif, GPS: {} });
  const out = piexif.insert(bytes, jpeg.toString('latin1'));
  return Buffer.from(out, 'latin1');
}
