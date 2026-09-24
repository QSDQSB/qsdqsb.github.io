'use strict';

// photos:locate: which OpenStreetMap features may name a photo, the house
// style a suggestion is written in, that the committed sidecar never holds
// a coordinate, and that --accept only replaces captions nobody wrote.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const geo = () => import('../scripts/photos/lib/reverse-geocode.mjs');
const loc = () => import('../scripts/photos/locate.mjs');

test('only well-known roads-and-landmarks kinds qualify; museums, theatres, plaques never do', async () => {
  const { tierOf, effectiveTier, weightOf } = await geo();
  const wd = { wikidata: 'Q1' };
  assert.strictEqual(tierOf({ name: 'Tower of London', historic: 'castle', ...wd }), 0);
  assert.strictEqual(tierOf({ name: 'Potters Fields Park', leisure: 'park', ...wd }), 0);
  assert.strictEqual(tierOf({ name: 'Heathrow Airport', aeroway: 'aerodrome', ...wd }), 0);
  assert.strictEqual(tierOf({ name: 'St Mary Woolnoth', amenity: 'place_of_worship', ...wd }), 1);
  assert.strictEqual(tierOf({ name: 'The Old Bell Inn', amenity: 'pub', ...wd }), 1, 'an inn qualifies');
  assert.strictEqual(tierOf({ name: 'The Crown', amenity: 'pub', ...wd }), -1, 'a pub that is not an inn does not');
  assert.strictEqual(tierOf({ name: 'Tower of London', historic: 'castle' }), -1, 'no Wikidata or Wikipedia link, no landmark');
  assert.strictEqual(tierOf({ name: 'Fusiliers Museum', tourism: 'museum', historic: 'building', ...wd }), -1);
  assert.strictEqual(tierOf({ name: 'Up the Creek', amenity: 'theatre', ...wd }), -1);
  assert.strictEqual(tierOf({ name: 'Victims of Human BSE', historic: 'memorial', ...wd }), -1);
  // A mapped point is small, the whole outranks its parts.
  assert.strictEqual(effectiveTier({ type: 'node', tags: { name: 'London Stone', historic: 'monument', ...wd } }), 1);
  assert.strictEqual(effectiveTier({ type: 'node', tags: { name: 'Monte Solaro', natural: 'peak', wikipedia: 'en:Monte Solaro', ...wd } }), 0);
  assert.ok(weightOf({ historic: 'castle' }) < weightOf({ historic: 'tower' }), 'the Tower of London before Martin Tower');
  // Renown: tier 1 wants an English article or name, or an attraction; local fame only counts up close.
  assert.strictEqual(effectiveTier({ type: 'way', tags: { name: 'Sterneggovský palác', historic: 'palace', wikidata: 'Q2', wikipedia: 'cs:Sterneggovský palác' } }), 1);
  assert.strictEqual(effectiveTier({ type: 'way', tags: { name: 'Palácio da Bolsa', historic: 'palace', wikidata: 'Q3', wikipedia: 'en:Palácio da Bolsa' } }), 0);
  assert.strictEqual(tierOf({ name: 'Minack Theatre', amenity: 'theatre', tourism: 'attraction', ...wd }), 0, 'an attraction overrides the theatre exclusion');
});

test('suggestions read like the voyage\'s own captions', async () => {
  const { compose, captionSuffix } = await loc();
  const london = { photos: { a: { caption: 'East Smithfield, London' }, b: { caption: 'Lambeth, London' }, c: { caption: 'Heathrow, UK' } } };
  assert.strictEqual(captionSuffix(london), 'London');
  assert.strictEqual(captionSuffix({ photos: { a: { caption: null } } }), null);
  const inLondon = { street: 'Middlesex Street', area: 'Aldgate', city: 'City of London', country: 'United Kingdom', country_code: 'gb' };
  assert.strictEqual(compose(inLondon, 'London'), 'Middlesex Street, London');
  assert.strictEqual(compose({ ...inLondon, landmark: 'Tower of London' }, 'London'), 'Tower of London, London');
  const cornwall = { landmark: 'Minack Theatre', street: 'Porthcurno', city: 'Penzance', country: 'United Kingdom', country_code: 'gb' };
  assert.strictEqual(compose(cornwall, 'UK'), 'Minack Theatre, Penzance, UK', 'a country tail names the town between');
  assert.strictEqual(compose({ street: 'Rue Jean Mermoz', city: 'Paris', country: 'France', country_code: 'fr' }, 'Paris'), 'Rue Jean Mermoz, Paris');
});

test('the committed sidecar carries names only, never a coordinate', async () => {
  const { writeSidecar, readSidecar } = await loc();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-locate-'));
  writeSidecar('london', { dscf1797: { suggested: 'Tower of London, London', landmark: 'Tower of London', gps: 'present', source: 'OpenStreetMap reverse geocode' } }, dir);
  const text = fs.readFileSync(path.join(dir, 'london.yml'), 'utf8');
  assert.doesNotMatch(text, /-?\d{1,3}\.\d{4,}/, 'no decimal coordinates');
  assert.match(text, /OpenStreetMap contributors/);
  assert.strictEqual(readSidecar('london', dir).dscf1797.gps, 'present');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('--accept replaces only empty or file-name captions, and only the caption line', async () => {
  const { writeSidecar, acceptSuggestions } = await loc();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-accept-'));
  const authoredDir = path.join(root, 'authored'), dir = path.join(root, 'locations');
  fs.mkdirSync(authoredDir);
  fs.writeFileSync(path.join(authoredDir, 'london.yml'), [
    '# header kept',
    'photos:',
    '  dscf1797:',
    '    caption: East Smithfield, London',
    '    story: |',
    '      Taken between two buses.',
    '  dscf2245:',
    '    caption: Written by hand, not to be touched',
    '  dscf2229:',
    '    caption:',
    '  dscf6358: {}',
    'order: [dscf2245]',
    '',
  ].join('\n'));
  writeSidecar('london', {
    dscf1797: { suggested: 'Tower of London, London' }, dscf2245: { suggested: "St Paul's Cathedral, London" },
    dscf2229: { suggested: "St Paul's Cathedral, London" }, dscf6358: { suggested: 'Middlesex Street, London' },
    dscf9999: { suggested: 'Piccadilly Circus, London' },
  }, dir);
  const legacy = new Map([['dscf1797', 'East Smithfield, London'], ['dscf2245', 'St Pauls, London']]);

  const r = acceptSuggestions('london', { legacy, authoredDir, dir });
  assert.deepStrictEqual(r.done.map(d => d.slug).sort(), ['dscf1797', 'dscf2229', 'dscf6358', 'dscf9999']);
  assert.deepStrictEqual(r.kept.map(k => k.slug), ['dscf2245']);
  const text = fs.readFileSync(path.join(authoredDir, 'london.yml'), 'utf8');
  assert.match(text, /^# header kept/);
  assert.match(text, /  dscf1797:\n    caption: Tower of London, London\n    story: \|\n      Taken between two buses\./);
  assert.match(text, /caption: Written by hand, not to be touched/);
  assert.match(text, /  dscf2229:\n    caption: "St Paul's Cathedral, London"|  dscf2229:\n    caption: St Paul's Cathedral, London/);
  assert.match(text, /  dscf6358:\n    caption: Middlesex Street, London/);
  assert.match(text, /order: \[dscf2245\]\n/);
  const yaml = require('js-yaml');
  assert.strictEqual(yaml.load(text).photos.dscf9999.caption, 'Piccadilly Circus, London');

  assert.deepStrictEqual(acceptSuggestions('london', { legacy, authoredDir, dir }).done, [], 'a second run changes nothing');
  fs.rmSync(root, { recursive: true, force: true });
});
