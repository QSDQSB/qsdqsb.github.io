'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseFrontMatter, checkFile, collectionOf } = require('../scripts/check-frontmatter.js');

const ROOT = path.join(__dirname, '..');

// checkFile() resolves gallery paths against the real repo root, so tests that
// exercise path resolution write fixtures into the repo's own collections and
// clean up after themselves.
function withFixture(relPath, body, run) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  try {
    return run(abs);
  } finally {
    fs.unlinkSync(abs);
  }
}

const levels = (r, lvl) => r.findings.filter((f) => f.level === lvl).map((f) => f.message);
const hasError = (r, re) => levels(r, 'error').some((m) => re.test(m));
const hasWarn = (r, re) => levels(r, 'warn').some((m) => re.test(m));

test('parseFrontMatter reads a YAML block and returns null without one', () => {
  assert.deepStrictEqual(parseFrontMatter('---\ntitle: X\n---\nbody'), { title: 'X' });
  assert.strictEqual(parseFrontMatter('no frontmatter here'), null);
});

test('parseFrontMatter reports malformed YAML instead of throwing', () => {
  const fm = parseFrontMatter('---\ntitle: "unclosed\n---\n');
  assert.ok(fm.__parseError, 'expected a __parseError marker');
});

test('collectionOf maps paths to collections and ignores others', () => {
  assert.strictEqual(collectionOf(path.join('_voyage', 'x.md')), '_voyage');
  assert.strictEqual(collectionOf(path.join('_subvoyage', 'p', 'c.md')), '_subvoyage');
  assert.strictEqual(collectionOf(path.join('assets', 'x.md')), null);
});

test('a post dated only by filename is not flagged as missing date', () => {
  // Jekyll derives the date from the YYYY-MM-DD- prefix; requiring an explicit
  // `date:` key flagged real, working posts.
  withFixture('_posts/2024-01-02-fixture.md', '---\ntitle: Fixture\n---\n', (abs) => {
    const r = checkFile(abs, null);
    assert.ok(!hasError(r, /missing required key: date/), 'filename date should satisfy the contract');
  });
});

test('a post with neither filename date nor date key is an error', () => {
  withFixture('_posts/fixture-undated.md', '---\ntitle: Fixture\n---\n', (abs) => {
    const r = checkFile(abs, null);
    assert.ok(hasError(r, /missing required key: date/));
  });
});

test('a voyage must pick exactly one of gallery_name / subgalleries', () => {
  const base = 'title: T\ndate: 2024-01-01\nheader:\n  overlay_image: x.jpg\n';
  withFixture('_voyage/fixture-neither.md', `---\n${base}---\n`, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /exactly one of gallery_name or subgalleries/));
  });
  withFixture('_voyage/fixture-both.md', `---\n${base}gallery_name: x\nsubgalleries: true\n---\n`, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /mutually exclusive/));
  });
});

test('a voyage without date warns rather than errors', () => {
  // Real content (_voyage/prague.md) relies on this and renders fine.
  const body = '---\ntitle: T\ngallery_name: nope\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-undated-voyage.md', body, (abs) => {
    const r = checkFile(abs, null);
    assert.ok(!hasError(r, /missing required key: date/), 'missing voyage date must not be an error');
    assert.ok(hasWarn(r, /no date/));
  });
});

test('voyage map lat/lng/query are valid without subgalleries', () => {
  // resolveVoyageCoords() in geocode-maps.js reads these for the GLOBAL atlas,
  // so flagging them on a plain gallery voyage was a false positive.
  const body = '---\ntitle: T\ndate: 2024-01-01\ngallery_name: nope\n'
    + 'map:\n  query: "Kangchenjunga"\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-mapquery.md', body, (abs) => {
    const r = checkFile(abs, null);
    assert.ok(!hasError(r, /map/), `map.query must not error, got: ${levels(r, 'error')}`);
  });
});

test('voyage map viewport keys without subgalleries warn as inert', () => {
  const body = '---\ntitle: T\ndate: 2024-01-01\ngallery_name: nope\n'
    + 'map:\n  zoom: 12\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-mapzoom.md', body, (abs) => {
    assert.ok(hasWarn(checkFile(abs, null), /inert here/));
  });
});

test('map lat without lng is an error (geocode-maps.js throws on it)', () => {
  const body = '---\ntitle: T\ndate: 2024-01-01\ngallery_name: nope\n'
    + 'map:\n  lat: 41.9\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-halfcoord.md', body, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /must be given together/));
  });
});

test('a sub-voyage in _subvoyage root is an error', () => {
  const body = '---\ntitle: T\ndate: 2024-01-01\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_subvoyage/fixture-rootlevel.md', body, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /_subvoyage\/ root/));
  });
});

test('a sub-voyage under a non-existent parent is an error', () => {
  const body = '---\ntitle: T\ndate: 2024-01-01\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_subvoyage/no-such-parent/fixture.md', body, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /no parent voyage/));
  });
});

test('gallery_name pointing nowhere is an error', () => {
  const body = '---\ntitle: T\ndate: 2024-01-01\ngallery_name: definitely-not-a-gallery\n'
    + 'header:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-badgallery.md', body, (abs) => {
    assert.ok(hasError(checkFile(abs, null), /missing gallery\//));
  });
});

test('tag palettes are collection-specific', () => {
  // _data/tag_colours.yml keeps voyage and post tags in separate maps; reading
  // only one of them flagged 41 correctly-coloured tags.
  const palettes = {
    voyage_tag_colours: { '🍝Italy': '#a77772' },
    post_tag_colours: { '📘Diary': '#cccccc' },
  };
  const post = '---\ntitle: T\ntags:\n  - 📘Diary\n---\n';
  withFixture('_posts/2024-01-03-fixture-tags.md', post, (abs) => {
    assert.ok(!hasWarn(checkFile(abs, palettes), /tag/), 'post tag should resolve in post palette');
  });
  const voyage = '---\ntitle: T\ndate: 2024-01-01\nsubgalleries: true\n'
    + 'tags:\n  - 📘Diary\nheader:\n  overlay_image: x.jpg\n---\n';
  withFixture('_voyage/fixture-tags.md', voyage, (abs) => {
    assert.ok(hasWarn(checkFile(abs, palettes), /tag "📘Diary"/), 'post tag on a voyage should warn');
  });
});
