const test = require('node:test');
const assert = require('node:assert');

// A frame's specs, shared by the lightbox and a post's frame figure (assets/js/photobook/specs.js).
const lib = () => import('../assets/js/photobook/specs.js');

const frame = {
  slug: 'dscf5789', frame: 'DSCF5789', place: 'Rigi, Arth', city: 'Switzerland', shots: 31987,
  focal: 90, aperture: 5, shutter: '1/15', iso: 3200, bias: null, camera: 'Fujifilm X-S10', lens: 'XF 90 mm f/2',
  film: 'Classic Chrome', hue: '#b8ab8e', code: 'CC',
  light: { alt: -10, text: 'Night', phase: 'night', below: true, x: 16.4, y: 12 },
  weather: { t: -7, kind: 'overcast', text: 'Overcast' },
  settings: [['Chrome', 'Weak'], ['Focus', 'AF-S · Single Point']],
  signature: [['#441d19', 36.7], ['#e4654f', 14.2]],
};
const to = { base: '/palette/', gallery: 'rigi', title: "QSD's Palette for Rigi" };

test('the specs set the figures, the sun below the horizon and the film on its edge', async () => {
  const { specsHTML } = await lib();
  const html = specsHTML(frame, 8, to);
  assert.match(html, /DSCF5789 · <span title="Shutter count">№ 31,987<\/span>/);
  assert.match(html, /<b>90<small>mm<\/small><\/b>/);
  assert.match(html, /<b>3200<\/b><span>ISO<\/span>/);
  assert.match(html, /−7°C/);
  assert.match(html, /−10°<svg class="photobook-sun__glyph"[^>]*>.*photobook-sun__dot--below/);
  assert.match(html, /<span>Night<\/span>/);
  assert.match(html, /Classic Chrome<span>CC<\/span><i>8&emsp;▸8A<\/i>/);
  assert.match(html, /<div class="is-wide"><dt>Focus<\/dt><dd>AF-S · Single Point<\/dd><\/div>/);
});

test('its palette leads to the frame on its voyage\'s palette page', async () => {
  const { specsHTML, paletteStrip } = await lib();
  assert.match(specsHTML(frame, 8, to), /href="\/palette\/\?at=dscf5789#rigi" data-tip="QSD's Palette for Rigi"/);
  assert.equal(paletteStrip({ ...frame, signature: [] }, to), '');
});

test('a frame with no sun, weather or film leaves their cells out', async () => {
  const { specsHTML } = await lib();
  const html = specsHTML({ slug: 'a', frame: 'A' }, 1, to);
  assert.doesNotMatch(html, /photobook-specs__(sun|weather|film|gear|settings)/);
  assert.match(html, /<b>—<small>mm<\/small><\/b>/);
});
