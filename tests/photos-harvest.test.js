const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const lib = () => import('../scripts/photos/lib/harvest.mjs');

// A small site: Kyoto across two trips, Florence on one, Prague in parts sharing a city.
const voyage = (gallery, photos) => {
  const cities = new Set(photos.map((p) => p.city?.toLowerCase()).filter(Boolean));
  const countries = new Set(photos.map((p) => p.country?.toLowerCase()).filter(Boolean));
  return { gallery, title: gallery, photos: photos.map((p) => ({ ...p, at: Date.parse(p.taken) })), cities, countries };
};
const SITE = [
  voyage('japan/kyoto', [
    { frame: 'DSCF7443', taken: '2026-05-31T13:04:22+09:00', city: 'Kyoto', country: 'Japan' },
    { frame: 'DSCF7651', taken: '2026-06-01T13:00:22+09:00', city: 'Kyoto', country: 'Japan' },
  ]),
  voyage('florence', [{ frame: 'DSCF2617', taken: '2025-05-31T17:26:00+02:00', city: 'Florence', country: 'Italy' }]),
  voyage('london', [{ frame: 'DSCF1797', taken: '2024-07-27T10:00:00+01:00', city: 'City of Westminster', country: 'United Kingdom' }]),
  voyage('prague/twilight', [{ frame: 'DSCF0001', taken: '2023-06-14T21:00:00+02:00', city: 'Prague', country: 'Czechia' }]),
  voyage('prague/charles-bridge', [{ frame: 'DSCF0002', taken: '2023-06-14T09:00:00+02:00', city: 'Prague', country: 'Czechia' }]),
];

test('a photo taken hours from a published one, in the same country, is sure', async () => {
  const { attribute } = await lib();
  // Otsu, on Mount Hiei: another city's name, the same afternoon's walk.
  const r = attribute({ frame: 'DSCF7548', taken: '2026-05-31T15:20:08+09:00', city: 'Ōtsu', country: 'Japan' }, SITE);
  assert.equal(r.gallery, 'japan/kyoto');
  assert.equal(r.confidence, 'sure');
  assert.match(r.why, /2\.3 h from DSCF7443/);
});

test('a later visit to a city goes to its voyage, as likely', async () => {
  const { attribute } = await lib();
  const r = attribute({ frame: 'DSCF3744', taken: '2025-06-08T11:58:31+01:00', city: 'City of Westminster', country: 'United Kingdom' }, SITE);
  assert.deepEqual([r.gallery, r.confidence], ['london', 'likely']);
});

test('a city with several parts is left open, with each part a candidate', async () => {
  const { attribute } = await lib();
  const r = attribute({ frame: 'DSCF0500', taken: '2025-01-01T12:00:00+01:00', city: 'Prague', country: 'Czechia' }, SITE);
  assert.equal(r.gallery, null);
  assert.equal(r.confidence, 'open');
  assert.deepEqual(r.candidates.sort(), ['prague/charles-bridge', 'prague/twilight']);
});

test('nowhere the site has been is open, and says a new voyage may be wanted', async () => {
  const { attribute } = await lib();
  const r = attribute({ frame: 'DSCF9000', taken: '2026-08-01T12:00:00+02:00', city: 'Lisbon', country: 'Portugal' }, SITE);
  assert.equal(r.confidence, 'open');
  assert.match(r.why, /a new one\?/);
});

test('the time of a published photo from another country does not pull a photo in', async () => {
  const { attribute } = await lib();
  // Two hours after a Kyoto frame, but in Singapore (a flight's worth of hours).
  const r = attribute({ frame: 'DSCF7700', taken: '2026-05-31T15:00:00+08:00', city: 'Singapore', country: 'Singapore' }, SITE);
  assert.notEqual(r.gallery, 'japan/kyoto');
});

test('the same frame at the same second is already on the site', async () => {
  const { attribute } = await lib();
  const r = attribute({ frame: 'DSCF7443', taken: '2026-05-31T13:04:22+09:00', city: 'Kyoto', country: 'Japan' }, SITE);
  assert.deepEqual([r.status, r.gallery], ['on-site', 'japan/kyoto']);
  // A repeated frame number from another day is not.
  assert.equal(attribute({ frame: 'DSCF7443', taken: '2027-01-01T10:00:00+09:00', city: 'Kyoto', country: 'Japan' }, SITE).status, 'waiting');
});

test('the plan hash names the set and where each goes, and nothing else', async () => {
  const { planHash } = await lib();
  const a = [{ id: '1', status: 'waiting', gallery: 'florence' }, { id: '2', status: 'waiting', gallery: 'london' }, { id: '3', status: 'on-site', gallery: 'london' }];
  assert.equal(planHash(a), planHash([a[1], a[0], { ...a[2], gallery: 'x' }]));
  assert.notEqual(planHash(a), planHash([{ ...a[0], gallery: 'hold' }, a[1]]));
  assert.notEqual(planHash(a), planHash([a[0]]));
});

test('a new gallery name is lower-case words, a part after one slash', async () => {
  const { validGallery } = await lib();
  for (const g of ['lake-como', 'japan/kyoto', 'rome/vatican-museum-vol-1']) assert.equal(validGallery(g), true, g);
  for (const g of ['Lake Como', '../etc', 'a/b/c', '-x', 'japan/', '']) assert.equal(validGallery(g), false, g);
});

// The owner, 2026-10-10: Photos is open to Claude only through the album. harvest may use only
// the album's helpers, and each of those starts from the album by name.
test('harvest reaches Photos only through the album', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/photos/harvest.mjs'), 'utf8');
  const imported = src.match(/import \{([^}]+)\} from '\.\/lib\/apple-photos\.mjs'/)[1].split(',').map((s) => s.trim()).sort();
  assert.deepEqual(imported, ['albumItems', 'exportFromAlbum', 'tagInAlbum']);
  assert.doesNotMatch(src, /osascript|findByFilename|findByMoment|exportPhotos/);
  const helpers = fs.readFileSync(path.join(ROOT, 'scripts/photos/lib/apple-photos.mjs'), 'utf8');
  for (const name of imported) {
    const body = helpers.slice(helpers.indexOf(`export function ${name}`)).split(/\nexport function /)[0];
    assert.match(body, /album \$\{q\(album\)\}|inAlbum\(album/, `${name} starts from the album`);
    assert.doesNotMatch(body, /every media item(?! of)/, `${name} never lists the library`);
  }
  // ingest is called without enrich, which searches the whole library.
  assert.match(src, /'--skip-enrich'/);
});

test('the scope hook refuses every other way into Photos', () => {
  const hook = path.join(ROOT, 'scripts/hooks/pre-tool-photos-scope.sh');
  const run = (tool_name, tool_input) => spawnSync('bash', [hook], { input: JSON.stringify({ tool_name, tool_input }), encoding: 'utf8' }).status;
  assert.equal(run('Bash', { command: 'npm run photos:harvest -- look' }), 0);
  assert.equal(run('Bash', { command: 'npm run photos:status' }), 0);
  assert.equal(run('Bash', { command: 'osascript -e \'tell application "Photos" to count media items\'' }), 2);
  assert.equal(run('Bash', { command: 'npm run photos:harvest && osascript -e x' }), 2);
  assert.equal(run('Bash', { command: 'npm run photos:enrich' }), 2);
  assert.equal(run('Bash', { command: 'node scripts/photos/ingest.mjs --from x' }), 2);
  assert.equal(run('Bash', { command: 'node -e "import(\'./scripts/photos/lib/apple-photos.mjs\')"' }), 2);
  assert.equal(run('Bash', { command: 'sqlite3 ~/Pictures/Photos\\ Library.photoslibrary/database/Photos.sqlite' }), 2);
  assert.equal(run('Read', { file_path: '/Users/x/Pictures/Photos Library.photoslibrary/database/Photos.sqlite' }), 2);
  assert.equal(run('mcp__computer-use__request_access', { apps: ['Photos'] }), 2);
  assert.equal(run('mcp__computer-use__request_access', { apps: ['Photoshop'] }), 0);
});

test('the command centre shows the album: each photo, where it goes, and one yes for the set', () => {
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harvest-hub-'));
  const plan = path.join(dir, 'plan'), harvest = path.join(dir, 'harvest'), out = path.join(dir, 'hub.html');
  fs.cpSync(path.join(ROOT, '_plan'), plan, { recursive: true });
  const build = (env) => spawnSync('node', [path.join(ROOT, 'scripts/hub-page.mjs'), '--out', out], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: plan, ...env } });
  try {
    // A plan from elsewhere has no album: no section, no chip.
    assert.strictEqual(build({}).status, 0);
    assert.ok(!fs.readFileSync(out, 'utf8').includes('id="h-album"'));

    fs.mkdirSync(harvest, { recursive: true });
    fs.writeFileSync(path.join(harvest, 'plan.json'), JSON.stringify({
      album: 'Voyage-of-QSDQSB', looked: '2026-10-10T16:00:00Z', hash: 'abc123', voyages: ['florence', 'japan/kyoto'],
      items: [
        { id: 'A/L0/001', frame: 'DSCF2632', taken: '2025-05-31T18:06:31+02:00', status: 'waiting', gallery: 'florence', confidence: 'sure', why: '40 min from DSCF2617 in florence', place: { city: 'Florence', country: 'Italy' } },
        { id: 'B/L0/001', frame: 'DSCF9000', taken: '2026-08-01T12:00:00+01:00', status: 'waiting', gallery: null, confidence: 'open', why: 'no voyage near <Lisbon>: a new one?' },
        { id: 'C/L0/001', frame: 'DSCF7443', status: 'on-site', gallery: 'japan/kyoto', confidence: 'sure', why: 'tagged in Photos' },
      ],
    }));
    const r = build({ HARVEST_DIR: harvest });
    assert.strictEqual(r.status, 0, r.stderr);
    const page = fs.readFileSync(out, 'utf8');
    const section = page.split('id="h-album"')[1].split('</section>')[0];
    assert.match(section, /2 photographs waiting to come in/);
    assert.match(section, /<option value="florence" selected>florence<\/option>/, 'the proposal is chosen already');
    assert.match(section, /Choose a voyage…/, 'an open photo asks, and Bring them in waits for it');
    assert.match(section, /<option value="hold">Hold: leave it in the album<\/option>/);
    assert.ok(section.includes('&lt;Lisbon&gt;') && !section.includes('<Lisbon>'), 'the why is text, never markup');
    assert.match(section, /id="bring" data-hash="abc123"/, 'the yes is for this plan and no other');
    // A quote escaped for the template once broke every tap on the page (2026-10-10): the script must parse.
    for (const js of page.split('<script>').slice(1).map((x) => x.split('</script>')[0])) assert.doesNotThrow(() => new Function(js), 'the page\'s script parses');
    assert.ok(!section.includes('DSCF7443'), 'a photo already on the site is not asked about');
    const targets = [...page.split('<nav class="jump"')[1].split('</nav>')[0].matchAll(/data-to="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(targets.includes('h-album'));
    for (const id of targets) assert.ok(page.includes(` id="${id}"`), `the jump to ${id} lands nowhere`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
