/**
 * Renders the public tiers for one original and computes the small
 * per-photo facts the grid needs before any tier loads: oriented size,
 * a thumbhash placeholder, and the dominant colour.
 *
 * Every output is re-encoded through Sharp, which drops metadata by
 * default, so no EXIF (and no GPS) ever reaches the public bucket.
 */

import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';
import { ALL_SIZES, FORMATS } from './config.mjs';

/** @returns {Promise<{w:number,h:number,thumbhash:string,tint:string}>} */
export async function analyse(buffer) {
  const base = sharp(buffer).rotate(); // apply EXIF orientation, then forget it
  const meta = await sharp(buffer).metadata();
  const swap = meta.orientation >= 5 && meta.orientation <= 8;
  const w = swap ? meta.height : meta.width, h = swap ? meta.width : meta.height;

  const { data, info } = await base.clone().resize({ width: 100, height: 100, fit: 'inside' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const thumbhash = Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString('base64');

  const { dominant } = await base.clone().stats();
  const hex = (n) => n.toString(16).padStart(2, '0');
  return { w, h, thumbhash, tint: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` };
}

/**
 * @param {Buffer} buffer
 * @param {{sizes?:number[], formats?:string[], longEdge:number}} opts
 * @returns {Promise<Array<{name:string, size:number, format:string, buffer:Buffer}>>}
 */
export async function renderTiers(buffer, { sizes = ALL_SIZES, formats = Object.keys(FORMATS), longEdge }) {
  const base = sharp(buffer).rotate();
  const wanted = sizes.filter((s, i) => i === 0 || s <= longEdge); // never upscale; keep the smallest tier always
  const jobs = [];
  for (const size of wanted) {
    for (const fmt of formats) {
      const f = FORMATS[fmt];
      if (!f || size > f.maxSize) continue;
      const p = base.clone().resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
      const enc = fmt === 'webp' ? p.webp({ quality: f.quality })
                : fmt === 'jpg'  ? p.jpeg({ quality: f.quality, mozjpeg: f.mozjpeg })
                : p.avif({ quality: f.quality, effort: f.effort });
      jobs.push(enc.toBuffer().then(buf => ({ name: `${size}.${fmt}`, size, format: fmt, buffer: buf })));
    }
  }
  return Promise.all(jobs);
}
