const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('the index names pictures by hash, and stale finds the copies that do not match', async () => {
  const { sha, stale, readIndex, writeIndex } = await import('../scripts/lib/visual-store.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-store-'));
  fs.writeFileSync(path.join(dir, 'a.png'), 'one');
  fs.writeFileSync(path.join(dir, 'b.png'), 'two');
  const index = { 'b.png': sha(path.join(dir, 'b.png')), 'a.png': sha(path.join(dir, 'a.png')), 'c.png': 'f'.repeat(64) };
  assert.deepStrictEqual(stale(index, dir), ['c.png'], 'a missing copy is stale');
  fs.writeFileSync(path.join(dir, 'a.png'), 'changed');
  assert.deepStrictEqual(stale(index, dir).sort(), ['a.png', 'c.png'], 'a changed copy is stale');
  const hashes = path.join(dir, 'hashes');
  writeIndex(index, hashes);
  assert.deepStrictEqual(fs.readdirSync(hashes), ['a.sha', 'b.sha', 'c.sha'], 'one file a picture');
  assert.strictEqual(fs.readFileSync(path.join(hashes, 'c.sha'), 'utf8'), 'f'.repeat(64) + '\n');
  assert.deepStrictEqual(readIndex(hashes), index);
  const before = fs.statSync(path.join(hashes, 'a.sha')).mtimeMs;
  writeIndex({ 'c.png': 'e'.repeat(64) }, hashes);
  assert.strictEqual(fs.statSync(path.join(hashes, 'a.sha')).mtimeMs, before, 'a picture that was not re-captured keeps its file');
  assert.strictEqual(readIndex(hashes)['c.png'], 'e'.repeat(64));
  assert.deepStrictEqual(readIndex(path.join(dir, 'none')), {}, 'no folder reads as empty');
});

test('the store sits in a dotted folder, which the photo pipeline never takes for a gallery', async () => {
  const { REMOTE } = await import('../scripts/lib/visual-store.mjs');
  const { galleriesFrom } = await import('../workers/photos-trigger/src/index.mjs');
  const folder = REMOTE.split(':').pop().split('/').slice(1).join('/');
  assert.ok(folder.startsWith('.'), `${folder} must start with a dot`);
  assert.deepStrictEqual(galleriesFrom([{ body: { object: { key: `${folder}/${'a'.repeat(64)}.png` } } }]), []);
});

const hasRclone = !require('node:child_process').spawnSync('rclone', ['version']).error;

test('store then fetch round-trips; a failed upload leaves the index untouched', { skip: !hasRclone && 'rclone not installed' }, async () => {
  process.env.RCLONE_CONFIG_VSTEST_TYPE = 'local'; // an rclone remote that is a plain folder
  const { storeBaselines, fetchBaselines, readIndex, writeIndex, sha } = await import('../scripts/lib/visual-store.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-store-rt-'));
  const shots = path.join(tmp, 'shots');
  fs.mkdirSync(shots);
  fs.writeFileSync(path.join(shots, 'x--desktop.png'), 'picture one');
  const opts = { indexDir: path.join(tmp, 'hashes'), cache: path.join(tmp, 'cache'), remote: `vstest:${tmp}/remote` };

  assert.strictEqual(storeBaselines(shots, ['x--desktop.png'], opts), 1);
  assert.deepStrictEqual(fs.readdirSync(opts.cache).filter((f) => f.endsWith('.png')), [], 'uploaded pictures leave the cache');
  const index = readIndex(opts.indexDir);
  assert.strictEqual(index['x--desktop.png'], sha(path.join(shots, 'x--desktop.png')));

  const fresh = path.join(tmp, 'fresh');
  assert.strictEqual(fetchBaselines(fresh, { ...opts, cache: path.join(tmp, 'cache2') }), 1, 'fetched from the remote, not the cache');
  assert.strictEqual(fs.readFileSync(path.join(fresh, 'x--desktop.png'), 'utf8'), 'picture one');
  assert.strictEqual(fetchBaselines(path.join(tmp, 'other'), { ...opts, names: ['z--mobile.png'] }), 0, 'names limits the fetch');

  fs.writeFileSync(path.join(shots, 'x--desktop.png'), 'picture two');
  assert.throws(() => storeBaselines(shots, ['x--desktop.png'], { ...opts, remote: 'nosuchremote:nowhere' }));
  assert.deepStrictEqual(readIndex(opts.indexDir), index, 'the index still names only what the remote holds');

  writeIndex({ 'y--desktop.png': 'e'.repeat(64) }, path.join(tmp, 'bad'));
  assert.throws(() => fetchBaselines(path.join(tmp, 'fresh2'), { ...opts, indexDir: path.join(tmp, 'bad'), cache: path.join(tmp, 'cache3') }), /not in/);
});
