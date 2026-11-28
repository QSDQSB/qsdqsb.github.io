'use strict';

// The plan's running lists as one file an entry (decisions/0014): the round trip, and the point of it.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

const DOCS = {
  changelog: '# Changelog\n\nNewest first.\n\n## 2031\n\n- 2031-01-02 · Two (X03) · tier 1\n- 2031-01-01 · One · tier 0\n\n## 2030\n\n- 2030-12-31 · Old\n',
  features: '# Features\n\n| Feature | Where a reader meets it | Code | Journey | Standing calls and notes |\n|---|---|---|---|---|\n| Search | Every page | `a.js` | `search` | Opens on press. |\n| Cat | Home | `b.js` | | None yet. |\n',
  inbox: '# Inbox\n\n## Waiting\n\n- 2031-01-02 · F002 · /b/ · second (owner)\n- 2031-01-01 · F001 · /a/ · first (session)\n\n## Taken\n\nWhere each went is at the end of its line.\n\n- 2030-12-31 · F000 · /c/ · old → stage 3\n',
  requests: '# Requests\n\n## Open\n\n- 2031-01-02 · R002 · Make it calmer\n\n## Done\n\n- 2031-01-01 · R001 · Fix the vat → done 2031-01-01, #1\n',
};

test('an old document reads into entries and renders back to the same lines', async () => {
  const { docToEntries, renderDoc, formatEntry, parseEntry } = await import('../scripts/lib/plan-entries.mjs');
  for (const [kind, text] of Object.entries(DOCS)) {
    const { head, entries } = docToEntries(kind, text);
    // Through the files they would be, and back.
    const again = entries.map((e) => parseEntry(formatEntry(e), e.name));
    assert.strictEqual(renderDoc(kind, head, again), text, `${kind} renders to the document it came from`);
  }
});

test('an entry is its own: names are unique, and a new id is the day and the words', async () => {
  const { docToEntries, slugOf } = await import('../scripts/lib/plan-entries.mjs');
  const twice = docToEntries('changelog', '## 2031\n\n- 2031-01-01 · Same words\n- 2031-01-01 · Same words\n');
  assert.deepStrictEqual(twice.entries.map((e) => e.name), ['2031-01-01-same-words', '2031-01-01-same-words-2']);
  assert.strictEqual(slugOf('The vat: is it "full screen"?'), 'the-vat-is-it-full-screen');
  assert.strictEqual(slugOf('日本'), 'entry');
});

/** A repository with the split layout, as the hub has it. */
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-entries-'));
  const GIT = fs.existsSync('/usr/bin/git') ? '/usr/bin/git' : 'git';
  const git = (...a) => execFileSync(GIT, ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const put = (rel, body) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), body); };
  git('init', '-q', '-b', 'master');
  put('.gitignore', '/_plan/CHANGELOG.md\n/_plan/FEATURES.md\n/_plan/requests.md\n/_plan/findings/inbox.md\n');
  put('_plan/changelog/_head.md', '# Changelog\n\n');
  put('_plan/changelog/2031-01-01-a-line.md', '---\ndate: 2031-01-01\n---\nA line\n');
  put('_plan/findings/inbox/_head.md', '# Inbox\n\n');
  put('_plan/requests/_head.md', '# Requests\n\n');
  put('_plan/features/_head.md', '# Features\n\n');
  put('tests/journeys/a.mjs', "export default { id: 'a', name: 'A', async run() {} };\n");
  put('tests/visual/hashes/home--desktop.sha', `${'a'.repeat(64)}\n`);
  put('tests/visual/hashes/about--desktop.sha', `${'b'.repeat(64)}\n`);
  git('add', '-A'); git('commit', '-q', '-m', 'start');
  const plan = (...a) => spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: path.join(dir, '_plan'), PLAN_TODAY: '2031-01-02' } });
  return { dir, git, put, plan, done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('two branches that each log a change, file a finding, ask for a request, add a journey and re-capture a picture merge without a conflict', () => {
  const r = repo();
  try {
    for (const [branch, n] of [['one', 1], ['two', 2]]) {
      r.git('switch', '-q', '-c', branch, 'master');
      assert.strictEqual(r.plan('log', `Change number ${n}.`, '--tier', '1').status, 0);
      assert.strictEqual(r.plan('finding', '/page/', `finding number ${n}`).status, 0);
      assert.strictEqual(r.plan('request', `request number ${n}`).status, 0);
      r.put(`tests/journeys/j${n}.mjs`, `export default { id: 'j${n}', name: 'J', async run() {} };\n`);
      r.put(n === 1 ? 'tests/visual/hashes/home--desktop.sha' : 'tests/visual/hashes/about--desktop.sha', `${String(n).repeat(64)}\n`);
      r.git('add', '-A'); r.git('commit', '-q', '-m', `branch ${n}`);
    }
    r.git('switch', '-q', 'master');
    r.git('merge', '-q', '--no-edit', 'one');
    r.git('merge', '-q', '--no-edit', 'two');   // throws on a conflict
    assert.strictEqual(r.git('status', '--porcelain').trim(), '', 'the rendered documents are not tracked');
    r.plan('render');
    const log = fs.readFileSync(path.join(r.dir, '_plan/CHANGELOG.md'), 'utf8');
    assert.match(log, /Change number 1 · tier 1/);
    assert.match(log, /Change number 2 · tier 1/);
    const inbox = fs.readFileSync(path.join(r.dir, '_plan/findings/inbox.md'), 'utf8');
    assert.ok(/finding number 1/.test(inbox) && /finding number 2/.test(inbox));
    assert.deepStrictEqual(fs.readdirSync(path.join(r.dir, 'tests/journeys')).sort(), ['a.mjs', 'j1.mjs', 'j2.mjs']);
  } finally { r.done(); }
});

test('two branches that re-capture the same picture do conflict: that is a real one', () => {
  const r = repo();
  try {
    for (const [branch, n] of [['one', 1], ['two', 2]]) {
      r.git('switch', '-q', '-c', branch, 'master');
      r.put('tests/visual/hashes/home--desktop.sha', `${String(n).repeat(64)}\n`);
      r.git('add', '-A'); r.git('commit', '-q', '-m', `branch ${n}`);
    }
    r.git('switch', '-q', 'master'); r.git('merge', '-q', '--no-edit', 'one');
    assert.throws(() => r.git('merge', '-q', '--no-edit', 'two'));
  } finally { r.done(); }
});

test('the plan\'s fingerprint is of the entries, not of the documents made from them', async () => {
  const r = repo();
  try {
    const { planHash } = await import('../scripts/lib/plan-hash.mjs');
    const before = planHash(path.join(r.dir, '_plan'));
    r.plan('render');
    assert.ok(fs.existsSync(path.join(r.dir, '_plan/CHANGELOG.md')));
    assert.strictEqual(planHash(path.join(r.dir, '_plan')), before);
    r.plan('log', 'A new line.');
    assert.notStrictEqual(planHash(path.join(r.dir, '_plan')), before);
  } finally { r.done(); }
});
