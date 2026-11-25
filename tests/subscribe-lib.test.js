const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeEmail,
  normalizeSource,
  isHoneypotTripped,
  SUBSCRIBE_SQL,
  UNSUBSCRIBE_SQL,
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

// The live table is D1's (SQLite); these are the columns and the UNIQUE rule the two statements rely on.
test('subscribe welcomes a new or returning address once, and a resubscribe keeps its token', () => {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE subscribers (email TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE, status TEXT NOT NULL,
    source TEXT, subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP, unsubscribed_at TEXT)`);
  const subscribe = (email, token) => db.prepare(SUBSCRIBE_SQL).get(email, token, '/');
  const unsubscribe = (token) => db.prepare(UNSUBSCRIBE_SQL).run(token).changes;

  assert.equal(subscribe('a@x.io', 't1').token, 't1');   // new: a row, so a welcome
  assert.equal(subscribe('a@x.io', 't2'), undefined);     // already active: no row, no second welcome
  assert.equal(unsubscribe('t1'), 1);
  assert.equal(unsubscribe('t1'), 0);                      // an old link clicked twice does nothing
  assert.equal(subscribe('a@x.io', 't3').token, 't1');    // returning: welcomed, the old links still work
});
