const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeEmail,
  normalizeSource,
  isHoneypotTripped,
} = require('../functions/api/_lib.js');

test('normalizeEmail accepts ordinary addresses and lowercases/trims them', () => {
  assert.equal(normalizeEmail('  QSD@Example.COM '), 'qsd@example.com');
  assert.equal(normalizeEmail('a.b+c@sub.domain.io'), 'a.b+c@sub.domain.io');
});

test('normalizeEmail rejects malformed input', () => {
  assert.equal(normalizeEmail(''), null);
  assert.equal(normalizeEmail('   '), null);
  assert.equal(normalizeEmail('no-at-sign'), null);
  assert.equal(normalizeEmail('two@@ats.com'), null);
  assert.equal(normalizeEmail('spaces in@mail.com'), null);
  assert.equal(normalizeEmail('no-tld@host'), null);
  assert.equal(normalizeEmail('trailing@dot.c'), null); // TLD shorter than 2
  assert.equal(normalizeEmail(null), null);
  assert.equal(normalizeEmail(42), null);
  assert.equal(normalizeEmail({}), null);
});

test('normalizeEmail rejects overlong addresses', () => {
  const local = 'a'.repeat(250);
  assert.equal(normalizeEmail(local + '@x.io'), null);
});

test('normalizeSource keeps only site-relative paths', () => {
  assert.equal(normalizeSource('/voyage/rome/'), '/voyage/rome/');
  assert.equal(normalizeSource('  /posts/2026/essay/ '), '/posts/2026/essay/');
  assert.equal(normalizeSource('https://evil.example/'), null);
  assert.equal(normalizeSource('//protocol-relative.example'), null);
  assert.equal(normalizeSource('relative/path'), null);
  assert.equal(normalizeSource('/' + 'x'.repeat(300)), null);
  assert.equal(normalizeSource(undefined), null);
});

test('isHoneypotTripped detects filled honeypot field', () => {
  assert.equal(isHoneypotTripped({ website: 'http://spam.example' }), true);
  assert.equal(isHoneypotTripped({ website: '   ' }), false);
  assert.equal(isHoneypotTripped({ website: '' }), false);
  assert.equal(isHoneypotTripped({}), false);
});
