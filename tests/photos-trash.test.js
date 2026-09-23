'use strict';

// photos:trash: key parsing, expiry, restore planning, and (when rclone is
// installed) a real list + restore against a local-directory rclone remote.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const trash = () => import('../scripts/photos/trash.mjs');
const hasRclone = spawnSync('rclone', ['version']).status === 0;

test('trash keys parse with or without the trash/ prefix; anything else is null', async () => {
  const { parseTrashKey } = await trash();
  const want = { key: 'trash/2026-09-23/prague/twilight/DSCF0001.jpg', date: '2026-09-23', original: 'prague/twilight/DSCF0001.jpg', gallery: 'prague/twilight', file: 'DSCF0001.jpg' };
  assert.deepStrictEqual(parseTrashKey('trash/2026-09-23/prague/twilight/DSCF0001.jpg'), want);
  assert.deepStrictEqual(parseTrashKey('2026-09-23/prague/twilight/DSCF0001.jpg'), want);
  assert.strictEqual(parseTrashKey('london/DSCF0001.jpg'), null);
});

test('expiry is 30 days after the prune date, and the listing counts down to it', async () => {
  const { expiresOn, summariseTrash } = await trash();
  assert.strictEqual(expiresOn('2026-09-23'), '2026-10-23');
  const rows = summariseTrash([
    { Path: '2026-09-01/london/DSCF0001.jpg', Size: 10 },
    { Path: '2026-09-20/paris/DSCF0002.jpg', Size: 20 },
    { Path: 'stray.txt', Size: 1 },
  ], { now: new Date('2026-09-23T12:00:00Z') });
  assert.deepStrictEqual(rows.map(r => [r.key, r.daysLeft]), [
    ['trash/2026-09-20/paris/DSCF0002.jpg', 27],
    ['trash/2026-09-01/london/DSCF0001.jpg', 8],
  ]);
  assert.strictEqual(summariseTrash(rows.map(r => ({ Path: r.key.slice(6), Size: 1 })), { gallery: 'paris' }).length, 1);
});

test('a restore refuses to overwrite a live original, an ambiguous prefix, or a missing key', async () => {
  const { planRestore } = await trash();
  const rows = [{ Path: '2026-09-20/london/DSCF0001.jpg' }, { Path: '2026-09-21/london/DSCF0001.jpg' }, { Path: '2026-09-21/london/DSCF0002.jpg' }];
  assert.deepStrictEqual(planRestore('2026-09-21/london/DSCF0002.jpg', rows, new Set()).moves,
    [{ from: 'trash/2026-09-21/london/DSCF0002.jpg', to: 'london/DSCF0002.jpg', gallery: 'london', file: 'DSCF0002.jpg' }]);
  assert.strictEqual(planRestore('trash/2026-09-21/', rows, new Set()).moves.length, 2);
  assert.match(planRestore('2026-09-21/london/DSCF0002.jpg', rows, new Set(['london/DSCF0002.jpg'])).problems[0], /already in place/);
  assert.match(planRestore('trash/', rows, new Set()).problems.join(), /more than one day/);
  assert.match(planRestore('2026-01-01/x.jpg', rows, new Set()).problems[0], /nothing in trash/);
});

test('CLI lists trash and restores an original into the bucket and photos/', { skip: !hasRclone && 'rclone not installed', timeout: 30000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-trash-'));
  const bucket = path.join(root, 'bucket');
  fs.mkdirSync(path.join(bucket, 'trash', '2026-09-20', 'london'), { recursive: true });
  fs.writeFileSync(path.join(bucket, 'trash', '2026-09-20', 'london', 'DSCF0001.jpg'), 'original');
  const env = {
    ...process.env, RCLONE_CONFIG_TESTR2_TYPE: 'local', PHOTOS_RCLONE_REMOTE: 'testr2',
    PHOTOS_ORIGINALS_BUCKET: bucket, PHOTOS_DIR: path.join(root, 'photos'),
  };
  const cli = (...a) => spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos/trash.mjs'), ...a], { env, encoding: 'utf8' });

  let r = cli('list');
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /pruned 2026-09-20 · expires 2026-10-20/);
  assert.match(r.stdout, /trash\/2026-09-20\/london\/DSCF0001\.jpg/);

  r = cli('restore', 'trash/2026-09-20/london/DSCF0001.jpg', '--dry-run');
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(bucket, 'trash', '2026-09-20', 'london', 'DSCF0001.jpg')), 'a dry run moves nothing');

  r = cli('restore', '2026-09-20/london/DSCF0001.jpg');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(fs.readFileSync(path.join(bucket, 'london', 'DSCF0001.jpg'), 'utf8'), 'original');
  assert.ok(!fs.existsSync(path.join(bucket, 'trash', '2026-09-20', 'london', 'DSCF0001.jpg')));
  assert.strictEqual(fs.readFileSync(path.join(root, 'photos', 'london', 'DSCF0001.jpg'), 'utf8'), 'original');

  r = cli('list');
  assert.match(r.stdout, /trash\/ is empty/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('push moves an original it replaces into trash, where list finds it', { skip: !hasRclone && 'rclone not installed', timeout: 30000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-push-'));
  const bucket = path.join(root, 'bucket');
  fs.mkdirSync(path.join(bucket, 'london'), { recursive: true });
  fs.mkdirSync(path.join(root, 'photos', 'london'), { recursive: true });
  fs.writeFileSync(path.join(bucket, 'london', 'DSCF0001.jpg'), 'compressed copy');
  fs.writeFileSync(path.join(root, 'photos', 'london', 'DSCF0001.jpg'), 'camera original');
  fs.writeFileSync(path.join(root, 'photos', 'london', 'DSCF0002.jpg'), 'new frame');
  const env = {
    ...process.env, RCLONE_CONFIG_TESTR2_TYPE: 'local', PHOTOS_RCLONE_REMOTE: 'testr2',
    PHOTOS_ORIGINALS_BUCKET: bucket, PHOTOS_DIR: path.join(root, 'photos'),
  };
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos/push.mjs')], { env, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const today = new Date().toISOString().slice(0, 10);
  assert.strictEqual(fs.readFileSync(path.join(bucket, 'london', 'DSCF0001.jpg'), 'utf8'), 'camera original');
  assert.strictEqual(fs.readFileSync(path.join(bucket, 'trash', today, 'london', 'DSCF0001.jpg'), 'utf8'), 'compressed copy');
  assert.ok(!fs.existsSync(path.join(bucket, 'trash', today, 'london', 'DSCF0002.jpg')), 'a new file replaces nothing');

  const list = spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos/trash.mjs'), 'list'], { env, encoding: 'utf8' });
  assert.match(list.stdout, new RegExp(`trash/${today}/london/DSCF0001\\.jpg`));
  fs.rmSync(root, { recursive: true, force: true });
});
