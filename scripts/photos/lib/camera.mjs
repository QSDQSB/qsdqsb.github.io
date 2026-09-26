/**
 * The camera's full record of a photograph, read with ExifTool (bundled by
 * exiftool-vendored), which decodes the Fujifilm maker notes exifr cannot:
 * film simulation, dynamic range, grain, colour chrome, tone, focus and
 * drive modes, shutter type, stabilisation, and the shutter count.
 *
 * Split in two:
 *   pub   settings for the public manifest and the database's columns
 *   priv  the whole tag dump, which only ever goes to the private manifest
 *
 * No serial number is kept anywhere: body, internal and lens serials are
 * stripped from the dump. The camera model with the shutter count is
 * enough to name one exposure: the database matches a re-exported or
 * re-collected file to its photo by that pair.
 *
 * Edited exports from Apple Photos drop the maker notes; photos:enrich
 * copies them back from the unedited original.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

let tool = null;
async function et() {
  if (!tool) {
    const { ExifTool } = await import('exiftool-vendored');
    tool = new ExifTool({ taskTimeoutMillis: 60000, maxProcs: 2 });
  }
  return tool;
}
/** Shut the ExifTool process down; call once when a run ends. */
export async function closeCamera() { if (tool) { await tool.end(); tool = null; } }

// The monochrome simulations are not recorded as FilmMode but in Saturation.
const MONO = /^(Acros|B&W|Sepia|Monochrome)/i;

// ExifTool reports some simulations by their internal names ("F2/Fujichrome
// (Velvia)", "F1b/Studio Portrait Smooth Skin Tone (Astia)"): the names
// photographers know, first match wins.
const FILMS = [
  [/bleach bypass/i, 'Eterna Bleach Bypass'], [/eterna|cinema/i, 'Eterna'], [/nostalgic/i, 'Nostalgic Neg.'],
  [/classic neg/i, 'Classic Negative'], [/classic chrome/i, 'Classic Chrome'], [/reala/i, 'Reala Ace'],
  [/pro neg\.? ?hi/i, 'Pro Neg. Hi'], [/pro neg\.? ?std/i, 'Pro Neg. Std'],
  [/velvia|fujichrome|F2\b/i, 'Velvia'], [/astia|F1b|soft/i, 'Astia'], [/provia|F0\b|^standard$/i, 'Provia'],
  [/acros/i, null], [/sepia/i, 'Sepia'], [/B&W|monochrome/i, null],
];
export function normalizeFilm(raw) {
  if (!raw) return null;
  const v = String(raw);
  // Acros and Monochrome keep their filter: "Acros+R Filter" → "Acros · R filter".
  const filter = v.match(/\+\s*([YRG])\s*Filter|([YRG])e?(?:llow|ed|reen)? Filter/i);
  const f = filter ? ` · ${(filter[1] || filter[2]).toUpperCase()} filter` : '';
  if (/acros/i.test(v)) return `Acros${f}`;
  if (/B&W|monochrome/i.test(v)) return `Monochrome${f}`;
  for (const [re, name] of FILMS) if (name && re.test(v)) return name;
  return v;
}
export function filmSimulation(t) {
  if (t.FilmMode) return normalizeFilm(t.FilmMode);
  if (t.Saturation && MONO.test(String(t.Saturation))) return normalizeFilm(t.Saturation);
  return null;
}

const s = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Map an ExifTool tag object to the public settings and the private identity. */
export function splitCamera(t) {
  const settings = {
    filmSimulation: filmSimulation(t),
    dynamicRange: s(t.DynamicRange), dynamicRangeSetting: s(t.DynamicRangeSetting),
    grainRoughness: s(t.GrainEffectRoughness), grainSize: s(t.GrainEffectSize),
    colorChrome: s(t.ColorChromeEffect), colorChromeBlue: s(t.ColorChromeFXBlue),
    highlightTone: s(t.HighlightTone), shadowTone: s(t.ShadowTone),
    color: s(t.Saturation && !MONO.test(String(t.Saturation)) ? t.Saturation : null),
    sharpness: s(t.Sharpness), noiseReduction: s(t.NoiseReduction), clarity: s(t.Clarity),
    whiteBalanceFineTune: s(t.WhiteBalanceFineTune),
    focusMode: s(t.FocusMode2 || t.FocusMode), afMode: s(t.AFMode), shutterType: s(t.ShutterType),
    driveMode: s(t.DriveMode), stabilization: s(t.ImageStabilization),
  };
  const hasMakerNotes = Object.values(settings).some(v => v !== null);
  return {
    pub: {
      exposureProgram: s(t.ExposureProgram), meteringMode: s(t.MeteringMode), whiteBalance: s(t.WhiteBalance), flash: s(t.Flash),
      shutterCount: n(t.ImageCount),
      settings: hasMakerNotes ? settings : null,
    },
    priv: { shutterCount: n(t.ImageCount) },
  };
}

// Tags that are bulky, binary, or describe the file rather than the photograph.
const DROP = /^(SourceFile|errors|warnings|Directory|FileName|FileModifyDate|FileAccessDate|FileInodeChangeDate|FilePermissions|ThumbnailImage|PreviewImage|MPImage\d*|ExifToolVersion)$|Serial/i;

/** Read a buffer's full camera record. */
export async function readCamera(buffer) {
  const tmp = path.join(os.tmpdir(), `photos-camera-${crypto.randomBytes(6).toString('hex')}.jpg`);
  fs.writeFileSync(tmp, buffer);
  try {
    const t = await (await et()).read(tmp);
    const { pub, priv } = splitCamera(t);
    const all = {};
    for (const [k, v] of Object.entries(t)) {
      if (DROP.test(k) || v === undefined || typeof v === 'function' || (typeof v === 'object' && v !== null && 'rawValue' in v && String(v.rawValue).startsWith('(Binary'))) continue;
      all[k] = v?.toISOString ? v.toISOString() : (typeof v === 'object' && v !== null && 'rawValue' in v ? v.rawValue : v);
    }
    return { pub, priv: { ...priv, all } };
  } finally { fs.rmSync(tmp, { force: true }); }
}
