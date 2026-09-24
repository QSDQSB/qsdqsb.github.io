'use strict';

// The integrity check's pipeline mode: gallery_name against the merged
// photo manifest index, and orphan galleries under photos/.

const test = require('node:test');
const assert = require('node:assert');
const { auditManifests } = require('../scripts/check-gallery-integrity.js');

test('every gallery_name needs a processed manifest with photos; unreferenced local galleries are orphans', () => {
  const refs = new Map([
    ['london', ['_voyage/london.md']], ['paris', ['_voyage/paris.md']], ['stoos', ['_voyage/stoos.md']],
    ['prague/twilight', ['_subvoyage/prague/twilight.md']], ['rigi', ['_voyage/rigi.md']], ['bled', ['_voyage/bled.md']],
  ]);
  const index = { galleries: {
    london: { processed: true, count: 35 },
    paris: { processed: false, count: 0 },
    'prague/twilight': { processed: true, count: 7 },
    rigi: { processed: true, count: 0 },
    bled: { processed: true, count: 18, note: 'bucket unreachable (timeout); kept the previous merge' },
  } };
  const f = auditManifests(index, refs, ['london', 'prague/twilight', 'venice/gondola', 'prague']);
  const by = (level) => f.filter((x) => x.level === level).map((x) => x.message);
  assert.strictEqual(by('error').length, 3);
  assert.ok(by('error').some((m) => m.includes('"paris" is not processed')));
  assert.ok(by('error').some((m) => m.includes('"stoos" has no photo manifest')));
  assert.ok(by('error').some((m) => m.includes('"rigi" is processed but shows no photos')));
  assert.deepStrictEqual(by('warn'), ['"bled": bucket unreachable (timeout); kept the previous merge']);
  assert.deepStrictEqual(by('orphan'), ['photos/venice/gondola/ is referenced by no voyage or sub-voyage'], 'a parent of a referenced gallery is not an orphan');
});
