const test = require('node:test');
const assert = require('node:assert');

// Reverie's rules, shared by the page and a post's card of a colour (assets/js/colour/reverie-parts.js).
const lib = () => import('../assets/js/colour/reverie-parts.js');

// A frame of 24 dots (rrggbbss each), `hex` filling `share` of the picture, the rest a dark blue.
const frame = (g, slug, hex, share = 0.5, v = g) => {
  const dot = (h, s) => h.slice(1) + Math.round(s * 255).toString(16).padStart(2, '0');
  return { g, v, slug, name: slug, sizes: [480, 960], url: 'https://img.example/t/x', r: 1.5, sig: [[hex, share * 100], ['#10203a', 100 - share * 100]], dots: dot(hex, share) + dot('#10203a', 1 - share) };
};

test('a colour is named by the nearest of Ridgway\'s within reach, else by nothing', async () => {
  const { namer } = await lib();
  const nameOf = namer([['Daphne Pink', 'd0819d'], ['Indulin Blue (2)', '2f3b57']]);
  assert.equal(nameOf('#ce7d99'), 'Daphne Pink');
  assert.equal(nameOf('#2f3d59'), 'Indulin Blue', 'a plate number after a name is dropped');
  assert.equal(nameOf('#002fa7'), '', 'Klein blue lies too far from either');
  assert.equal(namer([])('#ce7d99'), '', 'no book, no name');
});

test('the count is said as Reverie says it', async () => {
  const { countLine } = await lib();
  assert.equal(countLine(1, 1), 'QSD reveries in only this photograph… for now');
  assert.equal(countLine(4, 4), 'QSD reveries in 4 photographs');
  assert.equal(countLine(30, 52), 'QSD reveries: the 30 nearest of 52 photographs');
});

test('a colour opens on the photograph that holds it most, and one nothing holds on the closest', async () => {
  const { opening } = await lib();
  const { closest } = await import('../assets/js/colour/cards.js');
  const frames = [frame('rigi', 'a', '#ce7d99', 0.3), frame('rigi', 'b', '#ce7d99', 0.6), frame('bled', 'c', '#3a6ea5', 0.5)];
  assert.equal(opening(frames, { hex: '#ce7d99' }).f.slug, 'b');
  assert.equal(opening(frames, { hex: '#ce7d99', from: 'rigi/a' }).f.slug, 'a', 'the photograph it was found in is kept');
  assert.equal(opening(frames, { hex: '#3a6fa6', from: 'rigi/a' }).f.slug, 'c', 'a photograph that does not hold it gives way to one that does');
  assert.equal(opening(frames, { hex: '#00ff00' }).f, closest(frames, '#00ff00'), 'a colour nothing holds opens on the closest photograph, never one at random');
  assert.match(opening(frames, { from: 'bled/c' }).hex, /^#[0-9a-f]{6}$/, 'without a colour, the photograph\'s own');
});

test('what a colour holds: the photograph it was found in first, every other counted', async () => {
  const { opening, gather } = await lib();
  const frames = [frame('rigi', 'a', '#ce7d99', 0.3), frame('rigi', 'b', '#ce7d99', 0.6), frame('bled', 'c', '#3a6ea5', 0.5)];
  const at = opening(frames, { hex: '#ce7d99' }), got = gather(frames, at);
  assert.equal(got.all, 2);
  assert.deepEqual(got.found.map(({ f }) => f.slug), ['b', 'a']);
  assert.equal(got.focused[0][0], '#ce7d99', 'the dye is turned toward the colour');
  assert.equal(got.around.filter((c) => c.here).length, 1, 'the colour here stands once among those nearby');
});
