/**
 * The camera's full record of a photograph, read with ExifTool (bundled by
 * exiftool-vendored), which decodes the Fujifilm maker notes exifr cannot:
 * film simulation, dynamic range, grain, colour chrome, tone, focus and
 * drive modes, shutter type, stabilisation, and the shutter count.
 *
 * Split in two:
 *   pub   settings for the public manifest and the database's columns
 *   priv  identity (body and lens serials) and the whole tag dump, which
 *         only ever go to the private manifest
 *
 * The body serial with the shutter count names one exposure uniquely, for
 * ever: the database matches a re-exported or re-collected file to its
 * photo by that pair.
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
export function filmSimulation(t) {
  if (t.FilmMode) return String(t.FilmMode);
  if (t.Saturation && MONO.test(String(t.Saturation))) return String(t.Saturation);
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
    priv: { cameraSerial: s(t.SerialNumber), lensSerial: s(t.LensSerialNumber), shutterCount: n(t.ImageCount) },
  };
}

// Tags that are bulky, binary, or describe the file rather than the photograph.
const DROP = /^(SourceFile|errors|warnings|Directory|FileName|FileModifyDate|FileAccessDate|FileInodeChangeDate|FilePermissions|ThumbnailImage|PreviewImage|MPImage\d*|ExifToolVersion)$/;

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
