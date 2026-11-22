/**
 * Where the pixel diff's baselines live: the pictures in R2, the record of them in git.
 *
 * `tests/visual/baseline.json` (committed) names each shot's picture by the SHA-256 of its bytes;
 * the bytes sit in the private originals bucket at `.visual-baseline/<sha>.png`, through the same
 * `r2:` rclone remote the photo scripts use. So a commit still says exactly what it is judged
 * against, a branch that re-captures cannot move master's baselines, and git carries a few KB
 * where it carried 80 MB a version. `tests/visual/baseline/` is a local copy, filled on demand.
 * The dot matters: any other folder of pictures in that bucket is a gallery to the photo pipeline
 * (workers/photos-trigger), so it would be processed, published and deployed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
export const INDEX = path.join(ROOT, 'tests', 'visual', 'baseline.json');
const CACHE = path.join(ROOT, 'tests', 'visual', '.store'); // pictures by hash, both ways
export const REMOTE = `${process.env.PHOTOS_RCLONE_REMOTE || 'r2'}:${process.env.PHOTOS_ORIGINALS_BUCKET || 'qsdqsb-originals'}/.visual-baseline`;

export const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export const readIndex = (file = INDEX) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});

export function writeIndex(index, file = INDEX) {
  const sorted = Object.fromEntries(Object.keys(index).sort().map((k) => [k, index[k]]));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 1) + '\n');
}

/** The shots whose local copy in `dir` is absent or is not the picture the index names. */
export const stale = (index, dir) =>
  Object.keys(index).filter((name) => {
    const f = path.join(dir, name);
    return !fs.existsSync(f) || sha(f) !== index[name];
  });

function rclone(args, remote) {
  const r = spawnSync('rclone', args, { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    throw new Error(`rclone ${args[0]} failed (${remote}): ${(r.error?.message || r.stderr || '').trim().split('\n').pop()}`);
  }
}

/** Bring `dir` to the pictures the index names, fetching only what is missing or changed. */
export function fetchBaselines(dir, { names, indexFile = INDEX, cache = CACHE, remote = REMOTE } = {}) {
  const index = readIndex(indexFile);
  const need = stale(index, dir).filter((n) => !names || names.includes(n));
  if (!need.length) return 0;
  fs.mkdirSync(cache, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  const want = [...new Set(need.map((n) => `${index[n]}.png`))].filter((k) => !fs.existsSync(path.join(cache, k)));
  if (want.length) {
    const list = path.join(cache, '.want');
    fs.writeFileSync(list, want.join('\n') + '\n');
    rclone(['copy', remote, cache, '--files-from', list], remote);
  }
  for (const name of need) {
    const from = path.join(cache, `${index[name]}.png`);
    if (!fs.existsSync(from) || sha(from) !== index[name]) throw new Error(`${name}: picture ${index[name]} is not in ${remote}`);
    fs.copyFileSync(from, path.join(dir, name));
  }
  return need.length;
}

/** Record the named shots in `dir` in the index and put any picture R2 does not hold yet. */
export function storeBaselines(dir, names, { indexFile = INDEX, cache = CACHE, remote = REMOTE } = {}) {
  const index = readIndex(indexFile);
  fs.mkdirSync(cache, { recursive: true });
  const keys = [];
  for (const name of names) {
    const h = sha(path.join(dir, name));
    index[name] = h;
    fs.copyFileSync(path.join(dir, name), path.join(cache, `${h}.png`));
    keys.push(`${h}.png`);
  }
  const list = path.join(cache, '.put');
  fs.writeFileSync(list, keys.join('\n') + '\n');
  rclone(['copy', cache, remote, '--files-from', list, '--ignore-existing'], remote); // a hash names one picture
  writeIndex(index, indexFile); // only after the upload: the index never names a picture R2 lacks
  for (const k of keys) fs.rmSync(path.join(cache, k), { force: true }); // uploaded; the shots stay in dir
  return keys.length;
}
