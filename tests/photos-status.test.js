'use strict';

// photos:status row building, and the orphan classification it shares with
// photos:plan: a bucket original whose slug a local file still provides has
// been superseded, not orphaned-while-referenced.

const test = require('node:test');
const assert = require('node:assert');

const status = () => import('../scripts/photos/status.mjs');
const plan = () => import('../scripts/photos/plan.mjs');

const merged = (slugs, extra = {}) => ({
  generated: '2026-09-24T10:00:00Z',
  inventory: slugs.map(s => ({ slug: s, file: `${s.toUpperCase()}.jpg`, taken: null, camera: null, compressed: true, formats: ['jpg', 'webp'], processed: '2026-09-24T10:00:00Z', ...(extra[s] || {}) })),
});
const files = (names) => ({ files: names.map(n => ({ file: n, slug: n.replace(/\..*$/, '').toLowerCase(), size: 100 })), warnings: [] });
const bucketOf = (g, names, size = 100) => new Map([[g, names.map(n => ({ file: n, key: `${g}/${n}`, slug: n.replace(/\..*$/, '').toLowerCase(), size }))]]);

test('a fully processed, captioned gallery reports no problems', async () => {
  const { buildStatus } = await status();
  const [row] = buildStatus({
    galleries: ['paris'], referenced: new Set(['paris']),
    local: () => files(['DSCF0001.jpg', 'DSCF0002.jpg']),
    bucket: bucketOf('paris', ['DSCF0001.jpg', 'DSCF0002.jpg']),
    merged: () => merged(['dscf0001', 'dscf0002'], { dscf0002: { camera: 'FUJIFILM X-T5', taken: '2024-05-01T09:00:00', compressed: false } }),
    authored: () => ({ doc: { photos: { dscf0001: { caption: 'Rue Jean Mermoz' }, dscf0002: { caption: null } } }, problems: [] }),
  });
  assert.deepStrictEqual(row.problems, []);
  assert.strictEqual(row.processed, 2);
  assert.strictEqual(row.compressed, 1, 'only the stamped copy counts as compressed');
  assert.strictEqual(row.captioned, 1, 'an empty scaffolded caption is not a caption');
  assert.deepStrictEqual(row.unlisted, []);
  assert.deepStrictEqual(row.formats, ['jpg', 'webp']);
  assert.strictEqual(row.lastProcessed, '2026-09-24T10:00:00Z');
});

test('orphans, referenced orphans, unprocessed originals and stray captions are problems; pending is a note', async () => {
  const { buildStatus } = await status();
  const [row] = buildStatus({
    galleries: ['london'], referenced: new Set(['london']),
    local: () => files(['DSCF0001.jpg', 'DSCF0005.jpg']),
    bucket: bucketOf('london', ['DSCF0001.jpg', 'DSCF0002.jpg', 'DSCF0003.jpg', 'DSCF0004.jpg']),
    merged: () => merged(['dscf0001', 'dscf0002', 'dscf0003']),
    authored: () => ({ doc: { photos: { dscf0002: { caption: 'Tower' }, dscf0009: { caption: 'nowhere' } } }, problems: [] }),
  });
  assert.deepStrictEqual(row.referencedOrphans, ['london/DSCF0002.jpg']);
  assert.deepStrictEqual(row.orphans, ['london/DSCF0003.jpg', 'london/DSCF0004.jpg']);
  assert.deepStrictEqual(row.unprocessed, ['dscf0004']);
  assert.deepStrictEqual(row.pending, ['DSCF0005.jpg']);
  assert.ok(row.problems.some(p => p.includes('dscf0009')), 'a caption matching no photo is flagged');
  assert.ok(row.notes.some(n => n.includes('not pushed yet')));
  assert.ok(!row.problems.some(p => p.includes('not pushed')), 'pending uploads never fail the report');
});

test('a format change supersedes the old original instead of making it a referenced orphan', async () => {
  const { buildStatus } = await status();
  const [row] = buildStatus({
    galleries: ['rigi'], referenced: new Set(['rigi']),
    local: () => files(['DSCF0001.tif']),
    bucket: bucketOf('rigi', ['DSCF0001.jpg', 'DSCF0001.tif']),
    merged: () => merged(['dscf0001', 'dscf0001-2']),
    authored: () => ({ doc: { photos: { dscf0001: { caption: 'Summit' } } }, problems: [] }),
  });
  assert.deepStrictEqual(row.referencedOrphans, []);
  assert.deepStrictEqual(row.orphans, ['rigi/DSCF0001.jpg']);

  const { diff } = await plan();
  const local = new Map([['rigi/DSCF0001.tif', { size: 1, md5: () => 'a' }]]);
  const remote = new Map([['rigi/DSCF0001.jpg', { size: 2 }], ['rigi/DSCF0001.tif', { size: 1 }], ['rigi/DSCF0002.jpg', { size: 3 }]]);
  const r = diff(local, remote, '', () => new Set(['dscf0001', 'dscf0002'])).get('rigi');
  assert.deepStrictEqual(r.orphan, ['rigi/DSCF0001.jpg']);
  assert.deepStrictEqual(r.referenced, ['rigi/DSCF0002.jpg'], 'a named slug with no local file is still protected');
});

test('offline, a voyage with nothing processed reports one problem, and one with no photos at all another', async () => {
  const { buildStatus, formatStatus } = await status();
  const rows = buildStatus({
    galleries: ['bled', 'stoos'], referenced: new Set(['bled', 'stoos']), bucket: null,
    local: (g) => files(g === 'bled' ? ['DSCF0001.jpg', 'DSCF0002.jpg'] : []),
    merged: () => null,
    authored: () => ({ doc: null, problems: [] }),
  });
  assert.deepStrictEqual(rows[0].problems, ['not processed yet: no manifest for its 2 original(s)']);
  assert.deepStrictEqual(rows[1].problems, ['a voyage names this gallery but no photograph exists for it anywhere']);
  const text = formatStatus(rows, { bucketNote: '--offline' }).join('\n');
  assert.match(text, /bucket columns skipped: --offline/);
  assert.match(text, /2 galleries · 2 local · 0 processed/);
});

test('dashboard totals add up stage by stage and escape gallery names', async () => {
  const { buildStatus } = await status();
  const { totals, renderDashboard } = await import('../scripts/photos/dashboard.mjs');
  const rows = buildStatus({
    galleries: ['<odd>', 'paris'], referenced: new Set(['paris']),
    local: (g) => files(g === 'paris' ? ['DSCF0001.jpg', 'DSCF0002.jpg', 'DSCF0003.jpg'] : ['DSCF0009.jpg']),
    bucket: new Map([['paris', ['DSCF0001.jpg', 'DSCF0002.jpg', 'DSCF0003.jpg'].map(n => ({ file: n, key: `paris/${n}`, slug: n.slice(0, 8).toLowerCase(), size: 100 }))]]),
    merged: (g) => g === 'paris' ? merged(['dscf0001', 'dscf0002'], { dscf0001: { compressed: false } }) : null,
    authored: () => ({ doc: null, problems: [] }),
  });
  assert.deepStrictEqual(rows[1].stages, { original: 1, compressed: 1, awaiting: 1, localOnly: 0 });
  assert.deepStrictEqual(rows[0].stages, { original: 0, compressed: 0, awaiting: 0, localOnly: 1 });
  const t = totals(rows);
  assert.strictEqual(t.photos, 4);
  assert.strictEqual(t.original + t.compressed + t.awaiting + t.localOnly, t.photos);
  const html = renderDashboard(rows, { generated: '2026-09-23T00:00:00Z' });
  assert.ok(!html.includes('<odd>') && html.includes('&lt;odd&gt;'));
  assert.match(html, /<title>Photo migration<\/title>/);
});

test('pipeline checks read gh answers, and the dashboard draws one pill per check', async () => {
  const { missingSecrets, workflowCheck } = await import('../scripts/photos/lib/setup-checks.mjs');
  const { renderDashboard } = await import('../scripts/photos/dashboard.mjs');
  assert.deepStrictEqual(missingSecrets('[{"name":"R2_ACCOUNT_ID"},{"name":"CLAUDE_CODE_OAUTH_TOKEN"}]'), ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'CF_PAGES_DEPLOY_HOOK']);
  assert.deepStrictEqual(missingSecrets('not json').length, 4);
  assert.deepStrictEqual(workflowCheck('[]'), { state: 'todo', detail: 'never run' });
  assert.strictEqual(workflowCheck('[{"status":"completed","conclusion":"failure","createdAt":"2026-09-24T10:00:00Z","event":"workflow_dispatch"}]').state, 'fail');
  assert.strictEqual(workflowCheck('[{"status":"in_progress","conclusion":"","createdAt":"2026-09-24T10:00:00Z","event":"repository_dispatch"}]').state, 'ok');
  const html = renderDashboard([], { setup: [{ id: 'rclone', label: 'rclone remote r2:', state: 'ok', detail: 'configured' }, { id: 'bucket', label: 'qsdqsb-originals', state: 'fail', detail: '<denied>' }] });
  assert.match(html, /class="chk ok"/);
  assert.match(html, /class="chk fail"/);
  assert.ok(html.includes('&lt;denied&gt;') && !html.includes('<denied>'));
});
