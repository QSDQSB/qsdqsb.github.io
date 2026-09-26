/**
 * The Apple Photos library, through the Photos app itself (AppleScript),
 * so iCloud-only originals are downloaded by Photos on export and no
 * database is read behind its back. macOS asks once to let this app
 * control Photos.
 *
 *   findByFilename(names)       → Map<NAME, [{ id, filename, date }]>
 *   exportPhotos(ids, dir)      → each photo as edited in Photos (crop and all), full size, with its EXIF
 *   guardMemory()               → restart Photos when it holds more than the ceiling
 *
 * Dates come back as the camera's local wall-clock ISO string, the same
 * shape the manifests use for `taken`.
 *
 * Only exact-name lookups. A `whose` over dates, or a prefix such as
 * "begins with DSCF", makes Photos load the whole library: it once grew
 * to 66 GB and had to be stopped. guardMemory() quits and reopens Photos
 * whenever it passes a ceiling, so a long run cannot starve the machine.
 */

import { spawnSync } from 'node:child_process';

function osa(script, timeoutS = 900) {
  const r = spawnSync('osascript', ['-e', `with timeout of ${timeoutS} seconds\n${script}\nend timeout`], { encoding: 'utf8', timeout: (timeoutS + 60) * 1000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`Photos: ${(r.stderr || r.error?.message || '').trim()}`);
  return r.stdout.replace(/\n$/, '');
}
const MAX_GB = 6;

function photosPid() {
  const r = spawnSync('pgrep', ['-x', 'Photos'], { encoding: 'utf8' });
  return r.status === 0 ? Number(r.stdout.trim().split('\n')[0]) : null;
}
/** Photos' memory footprint in GB, as Activity Monitor counts it (top's MEM). */
export function photosMemoryGB() {
  const pid = photosPid();
  if (!pid) return 0;
  const r = spawnSync('top', ['-l', '1', '-pid', String(pid), '-stats', 'mem'], { encoding: 'utf8' });
  const m = (r.stdout || '').trim().split('\n').pop().trim().match(/^([\d.]+)([KMGT])/);
  return m ? Number(m[1]) * ({ K: 1 / 1048576, M: 1 / 1024, G: 1, T: 1024 }[m[2]]) : 0;
}
const sleep = (ms) => spawnSync('sleep', [String(ms / 1000)]);
/** Quit Photos (terminate if it will not answer) and reopen it, when it holds more than the ceiling. */
export function guardMemory({ max = MAX_GB, log = () => {} } = {}) {
  const gb = photosMemoryGB();
  if (gb <= max) return false;
  log(`Photos holds ${gb.toFixed(1)} GB (ceiling ${max} GB): restarting it`);
  spawnSync('osascript', ['-e', 'with timeout of 60 seconds\ntell application "Photos" to quit\nend timeout'], { timeout: 90000 });
  for (let i = 0; i < 20 && photosPid(); i++) sleep(2000);
  const pid = photosPid();
  if (pid) { process.kill(pid, 'SIGTERM'); for (let i = 0; i < 20 && photosPid(); i++) sleep(2000); }
  spawnSync('open', ['-g', '-a', 'Photos']);
  sleep(15000);
  return true;
}

const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// One line per item: id, filename, ISO date. «class isot» gives 2023-09-16T15:16:22.
const LINES = `
  set out to ""
  repeat with m in hits
    set out to out & (id of m) & tab & (filename of m) & tab & (((date of m) as «class isot») as string) & linefeed
  end repeat`;
const parse = (text) => text.split('\n').filter(Boolean).map(l => { const [id, filename, date] = l.split('\t'); return { id, filename, date }; });

/** Candidates for each file name, e.g. `DSCF1148.JPG` → every item Photos holds under that original name. */
export function findByFilename(names, { batch = 25 } = {}) {
  const out = new Map();
  for (let i = 0; i < names.length; i += batch) {
    const chunk = names.slice(i, i + batch);
    const script = `tell application "Photos"
  set res to ""
  repeat with n in {${chunk.map(q).join(', ')}}
    set hits to (every media item whose filename is (n as text))${LINES}
    set res to res & out
  end repeat
  return res
end tell`;
    for (const item of parse(osa(script))) {
      const key = item.filename.toUpperCase();
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(item);
    }
  }
  return out;
}

/**
 * Candidates for each capture time, found by date alone: every item Photos dates within 14 hours
 * of it (the most a time zone can move a clock). For a file whose name Photos does not know (a
 * renamed export); sameMoment then picks the one taken at the same second. Photos cannot filter
 * items by date, so the library's ids, names and dates are read once, as three lists.
 * @param {string[]} takens  capture times as the camera wrote them (local, offset optional)
 * @returns {Map<string, {id, filename, date}[]>}
 */
export function findByMoment(takens) {
  const script = `tell application "Photos"
  set ids to id of every media item
  set names to filename of every media item
  set ds to date of every media item
end tell
set out to ""
repeat with i from 1 to count of ids
  set out to out & (item i of ids) & tab & (item i of names) & tab & (((item i of ds) as «class isot») as string) & linefeed
end repeat
return out`;
  const all = parse(osa(script, 1800));
  const out = new Map();
  for (const taken of takens) {
    const local = Date.parse(`${taken.slice(0, 19)}Z`); // the wall clock as written, read as if UTC
    out.set(taken, all.filter((it) => Math.abs(Date.parse(`${it.date.slice(0, 19)}Z`) - local) <= 14 * 3600e3));
  }
  return out;
}

/**
 * Whether a Photos item's date and a file's capture time name the same
 * moment. Photos gives its dates on this Mac's clock; the camera records
 * the local time where the photograph was taken, with its UTC offset when
 * it knows it. Without an offset, the two can only differ by a whole
 * number of quarter hours (a time zone), at the same minute and second.
 */
export function sameMoment(photosDate, taken) {
  if (!photosDate || !taken) return false;
  const here = new Date(photosDate.slice(0, 19)).getTime();
  if (/(Z|[+-]\d\d:?\d\d)$/.test(taken)) return Math.abs(here - new Date(taken).getTime()) < 1000;
  const gap = Math.abs(here - new Date(taken.slice(0, 19)).getTime());
  return gap <= 14 * 3600e3 && gap % 900e3 < 1000;
}

/**
 * Export photos as they are in Photos now: the edited version, crop and
 * all, full size, camera EXIF kept. That is what the site publishes (an
 * unedited original of a cropped photo fails the aspect check), and what
 * a manual File → Export gives. `originals: true` exports the camera file.
 */
export function exportPhotos(ids, dir, { batch = 20, originals = false } = {}) {
  for (let i = 0; i < ids.length; i += batch) {
    const chunk = ids.slice(i, i + batch);
    osa(`tell application "Photos"
  set L to {}
  repeat with i in {${chunk.map(q).join(', ')}}
    set end of L to media item id (i as text)
  end repeat
  export L to (POSIX file ${q(dir)})${originals ? ' with using originals' : ''}
end tell`, 1800);
  }
}
