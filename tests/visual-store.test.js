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
  const file = path.join(dir, 'index.json');
  writeIndex(index, file);
  assert.deepStrictEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))), ['a.png', 'b.png', 'c.png'], 'written sorted');
  assert.deepStrictEqual(readIndex(file), index);
  assert.deepStrictEqual(readIndex(path.join(dir, 'none.json')), {}, 'no index reads as empty');
});

test('the store sits in a dotted folder, which the photo pipeline never takes for a gallery', async () => {
  const { REMOTE } = await import('../scripts/lib/visual-store.mjs');
  const { galleriesFrom } = await import('../workers/photos-trigger/src/index.mjs');
  const folder = REMOTE.split(':').pop().split('/').slice(1).join('/');
  assert.ok(folder.startsWith('.'), `${folder} must start with a dot`);
  assert.deepStrictEqual(galleriesFrom([{ body: { object: { key: `${folder}/${'a'.repeat(64)}.png` } } }]), []);
});
