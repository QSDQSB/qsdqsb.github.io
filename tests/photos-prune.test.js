const test = require('node:test');
const assert = require('node:assert');

const report = () => new Map([
  ['london', { orphan: ['london/DSCF0001.jpg'], referenced: [] }],
  ['oxford', { orphan: ['oxford/DSCF0002.jpg', 'oxford/DSCF0003.jpg'], referenced: [] }],
  ['rigi', { orphan: ['rigi/DSCF0004.jpg'], referenced: [] }],
  ['wengen', { orphan: [], referenced: [] }],
]);

test('pruneScope gathers every gallery with --all, and only the named ones otherwise', async () => {
  const { pruneScope } = await import('../scripts/photos/prune.mjs');
  const all = pruneScope(report(), { all: true });
  assert.deepEqual([...all.orphans.keys()], ['london', 'oxford', 'rigi']);
  const two = pruneScope(report(), { named: ['oxford', 'wengen'] });
  assert.deepEqual([...two.orphans.keys()], ['oxford']);
});

test('pruneScope skips, with --all, a gallery this machine has no folder for', async () => {
  const { pruneScope } = await import('../scripts/photos/prune.mjs');
  const s = pruneScope(report(), { all: true, hasLocal: (g) => g !== 'rigi' });
  assert.deepEqual(s.skipped, ['rigi']);
  assert.ok(!s.orphans.has('rigi'));
  // Named explicitly, it is pruned whatever this machine holds.
  assert.ok(pruneScope(report(), { named: ['rigi'], hasLocal: () => false }).orphans.has('rigi'));
});

test('pruneScope reports every referenced orphan in scope, so nothing moves while one exists', async () => {
  const { pruneScope } = await import('../scripts/photos/prune.mjs');
  const r = report(); r.get('oxford').referenced.push('oxford/DSCF0009.jpg');
  assert.deepEqual(pruneScope(r, { all: true }).referenced, ['oxford/DSCF0009.jpg']);
});
