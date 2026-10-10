const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const check = (...files) => spawnSync('node', [path.join(ROOT, 'scripts/check-image-privacy.mjs'), ...files], { cwd: ROOT, encoding: 'utf8' });

// Made here, never committed: a committed picture with a position is what the check refuses.
test('a picture that says where it was taken is refused, and one that does not passes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gps-'));
  try {
    const plain = sharp({ create: { width: 8, height: 8, channels: 3, background: '#888' } }).jpeg();
    const placed = path.join(dir, 'placed.jpg'), bare = path.join(dir, 'bare.jpg');
    await plain.clone().withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 45/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '1/1 15/1 0/1' } }).toFile(placed);
    await plain.clone().withExif({ IFD0: { Artist: 'QSD' } }).toFile(bare);
    const r = check(placed, bare);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /placed\.jpg/);
    assert.doesNotMatch(r.stdout, /bare\.jpg/);
    assert.equal(check(bare).status, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('no tracked picture carries a GPS position', () => {
  const r = check();
  assert.equal(r.status, 0, r.stdout);
});
