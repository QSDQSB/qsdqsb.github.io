'use strict';

const test = require('node:test');
const assert = require('node:assert');

const lib = () => import('../scripts/photos/lib/slug.mjs');

test('frame number becomes the slug, whatever follows it', async () => {
  const { slugFor, frameFromName } = await lib();
  assert.strictEqual(slugFor('DSCF1797_East_Smithfield,_London__XF90mm_f4.3_1:2000s_ISO320.jpg'), 'dscf1797');
  assert.strictEqual(slugFor('DSCF1797.JPG'), 'dscf1797');
  assert.strictEqual(slugFor('DSCF0153,_St._Ulrich_in_Gröden__XF16-55mm_f8.6_1:160s_ISO320.jpg'), 'dscf0153');
  assert.strictEqual(frameFromName('IMG_0042.HEIC'), 'IMG0042');
  assert.strictEqual(frameFromName('holiday snap.png'), null);
  assert.strictEqual(slugFor('Holiday Snap (final).png'), 'holiday-snap-final');
});

test('legacy filename convention parses place and exposure', async () => {
  const { parseLegacyName } = await lib();
  const p = parseLegacyName('DSCF1797_East_Smithfield,_London__XF90mm_f4.3_1:2000s_ISO320.jpg');
  assert.deepStrictEqual(p, { frame: 'DSCF1797', place: 'East Smithfield, London', lens: 'XF 90mm', focal: 90, aperture: 4.3, shutter: '1/2000', iso: 320 });

  // No place segment at all.
  const q = parseLegacyName('DSCF4258_90mm_f5.6_1:1250s_ISO320.JPG');
  assert.strictEqual(q.place, null);
  assert.strictEqual(q.shutter, '1/1250');

  // Colon typed as underscore, long exposure, zoom lens without a single focal.
  assert.strictEqual(parseLegacyName('DSCF1719_Jardins,_Porto__XF90mm_f7.4_1_180s_ISO800.jpg').shutter, '1/180');
  const r = parseLegacyName('DSCF8646_Aeussere_Dorfstrasse,_Switzerland__XF16-55mm_f3.0_8.0s_ISO1600.jpg');
  assert.strictEqual(r.shutter, '8.0');
  assert.strictEqual(r.focal, null);
  assert.strictEqual(r.lens, 'XF 16-55mm');

  // A plain camera file has no place and no exposure.
  const s = parseLegacyName('IMG_0042.HEIC');
  assert.strictEqual(s.place, null);
  assert.strictEqual(s.aperture, null);
});

test('legacy apertures are APEX values, converted to the camera\'s third-stop f-numbers', async () => {
  const { fNumberFromLegacy } = await import('../scripts/photos/lib/slug.mjs');
  // Pairs observed between legacy names and the re-collected Fujifilm originals.
  for (const [av, n] of [[7.6, 14], [8, 16], [5.4, 6.4], [3, 2.8], [4.3, 4.5], [5.7, 7.1], [6.6, 10], [6.3, 9], [7.4, 13], [4.6, 5], [5, 5.6], [6, 8], [2, 2]]) {
    assert.strictEqual(fNumberFromLegacy(av), n, `f${av} → f/${n}`);
  }
  assert.strictEqual(fNumberFromLegacy(null), null);
  const { legacyAperture, parseLegacyName } = await import('../scripts/photos/lib/slug.mjs');
  assert.strictEqual(legacyAperture(parseLegacyName('DSCF1422_Tidal_Causeway,_Marazion,_UK__XF16-55mm_f7.6_1:6400s_ISO1600.jpg')), 14, 'XF lens: APEX');
  assert.strictEqual(legacyAperture(parseLegacyName('DSCF5594_title_90mm_f8.0_1:200s_ISO500.JPG')), 8, 'bare lens: the f-number itself');
  assert.strictEqual(legacyAperture(parseLegacyName('DSCF5135_90mm_f6.4_1:5800s_ISO640.JPG')), 6.4);
});

test('slug collisions get a numeric suffix and a warning', async () => {
  const { assignSlugs } = await lib();
  const { slugs, warnings } = assignSlugs(['DSCF0001.jpg', 'DSCF0001_again.jpg', 'x.png']);
  assert.deepStrictEqual(slugs.map(s => s.slug), ['dscf0001', 'dscf0001-2', 'x']);
  assert.strictEqual(warnings.length, 1);
});
