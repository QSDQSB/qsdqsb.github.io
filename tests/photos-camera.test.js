'use strict';

// The camera record: Fujifilm maker notes mapped to database columns, and
// identity kept private.

const test = require('node:test');
const assert = require('node:assert');

const cam = () => import('../scripts/photos/lib/camera.mjs');

test('film simulation reads FilmMode, or Saturation for the monochrome ones', async () => {
  const { filmSimulation } = await cam();
  assert.strictEqual(filmSimulation({ FilmMode: 'Classic Negative', Saturation: 'Film Simulation' }), 'Classic Negative');
  assert.strictEqual(filmSimulation({ Saturation: 'Acros+R Filter' }), 'Acros+R Filter');
  assert.strictEqual(filmSimulation({ Saturation: 'B&W' }), 'B&W');
  assert.strictEqual(filmSimulation({ Saturation: '+1 (medium high)' }), null, 'a colour saturation is not a film simulation');
  assert.strictEqual(filmSimulation({}), null);
});

test('settings are public, no serial is kept anywhere, and a file without maker notes has no settings', async () => {
  const { splitCamera } = await cam();
  const x = splitCamera({
    FilmMode: 'Classic Negative', DynamicRange: 'Standard', GrainEffectRoughness: 'Off', ShutterType: 'Mechanical',
    FocusMode: 'Auto', FocusMode2: 'AF-S', ImageCount: 11391, SerialNumber: '0D018089', LensSerialNumber: '85B01025',
    ExposureProgram: 'Program AE', MeteringMode: 'Multi-segment', Saturation: 'Film Simulation',
  });
  assert.strictEqual(x.pub.settings.filmSimulation, 'Classic Negative');
  assert.strictEqual(x.pub.settings.focusMode, 'AF-S', 'the specific focus mode wins');
  assert.strictEqual(x.pub.settings.color, 'Film Simulation');
  assert.strictEqual(x.pub.shutterCount, 11391);
  assert.strictEqual(x.pub.exposureProgram, 'Program AE');
  assert.ok(!JSON.stringify(x).includes('0D018089') && !JSON.stringify(x).includes('85B01025'), 'no serial, public or private');
  assert.deepStrictEqual(x.priv, { shutterCount: 11391 });
  assert.strictEqual(splitCamera({ ExposureProgram: 'Manual' }).pub.settings, null);
});
