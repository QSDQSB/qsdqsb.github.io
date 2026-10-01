'use strict';

// The hub's own tools: the plan is only as durable as the scripts that keep it.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PLAN = path.join(ROOT, '_plan');

/** plan.mjs against a throwaway copy of the plan, on a fixed day. */
function withPlanCopy(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
  fs.cpSync(PLAN, dir, { recursive: true });
  const plan = (...args) => spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), ...args], {
    encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir, PLAN_TODAY: '2031-01-02' },
  });
  try { return run(plan, (rel) => fs.readFileSync(path.join(dir, rel), 'utf8'), (rel, body) => fs.writeFileSync(path.join(dir, rel), body)); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('the plan in the repo is sound', () => {
  const out = spawnSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--json'], { encoding: 'utf8' });
  const state = JSON.parse(out.stdout);
  assert.deepStrictEqual(state.errors.filter((e) => !/CHANGELOG/.test(e)), [], 'check-plan reports the plan broken');
  assert.ok(state.stages.length >= 10, 'the roadmap lists its stages');
  assert.ok(state.decisions.length >= 6);
});

test('the session brief is short and names the plan', () => {
  const out = execFileSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--brief'], { encoding: 'utf8' });
  assert.match(out, /_plan\/ROADMAP\.md/);
  assert.ok(out.split('\n').length <= 14, 'the brief is put in front of every session: it stays short');
});

test('a finding gets the next id, today\'s date, and goes to the top of Waiting', () => {
  withPlanCopy((plan, read) => {
    const before = read('findings/inbox.md');
    const highest = Math.max(0, ...[...before.matchAll(/\bF(\d{3,})\b/g)].map((m) => Number(m[1])));
    const res = plan('finding', '/reverie/', 'the vat is not\n full screen', '--by', 'owner');
    assert.strictEqual(res.status, 0, res.stderr);
    const id = `F${String(highest + 1).padStart(3, '0')}`;
    const after = read('findings/inbox.md');
    const waiting = after.slice(after.indexOf('## Waiting'), after.indexOf('## Taken'));
    assert.match(waiting.split('\n').filter((l) => l.startsWith('- '))[0], new RegExp(`^- 2031-01-02 · ${id} · /reverie/ · the vat is not full screen \\(owner\\)$`));

    assert.strictEqual(plan('take', id, 'stage 3').status, 0);
    const moved = read('findings/inbox.md');
    assert.ok(!moved.slice(moved.indexOf('## Waiting'), moved.indexOf('## Taken')).includes(id), 'a taken finding leaves Waiting');
    assert.match(moved.slice(moved.indexOf('## Taken')), new RegExp(`${id} · .* → stage 3`));
    assert.strictEqual(plan('take', id, 'stage 3').status, 1, 'taking it twice is an error, not a second line');
  });
});

test('a call is asked with a new number and answered into Answered', () => {
  withPlanCopy((plan, read) => {
    const before = read('QUEUE.md');
    const highest = Math.max(0, ...[...before.matchAll(/\bQ(\d+)\b/g)].map((m) => Number(m[1])));
    const res = plan('ask', 'What colour are links?', '--body', 'In-content links are blue today.', '--option', 'A*: Brass.', '--option', 'B: As today.');
    assert.strictEqual(res.status, 0, res.stderr);
    const id = `Q${highest + 1}`;
    const asked = read('QUEUE.md');
    const open = asked.split('## Answered')[0];
    assert.match(open, new RegExp(`### ${id} · What colour are links\\?\\n\\nAsked: 2031-01-02\\n\\nIn-content links are blue today\\.\\n\\n- \\*\\*A \\(recommended\\):\\*\\* Brass\\.\\n- \\*\\*B:\\*\\* As today\\.`));
    assert.ok(open.trimEnd().endsWith('---'), 'the open calls still end at the rule above Answered');

    assert.strictEqual(plan('answer', id, 'A: brass').status, 0);
    const answered = read('QUEUE.md');
    assert.ok(!answered.split('## Answered')[0].includes(`### ${id} ·`), 'an answered call leaves the open list');
    assert.match(answered.split('## Answered')[1], new RegExp(`- 2031-01-02 · ${id} · What colour are links\\? → A: brass`));
    assert.strictEqual(plan('answer', 'Q999', 'yes').status, 1);
  });
});

// The repository's own queue may be empty (the owner answers): each test asks its own call first.
const ASK = ['ask', 'A call for the test?', '--body', 'One line.', '--option', 'A*: This.', '--option', 'B: That.'];

test('an answer is kept as written, whatever characters it holds', () => {
  withPlanCopy((plan, read) => {
    assert.strictEqual(plan(...ASK).status, 0);
    const before = read('QUEUE.md');
    const first = before.split('## Answered')[0].match(/^### (Q\d+) · A call for the test\?/m)[1];
    // `$&`, `$'` and a backtick would each be expanded by a replacement string.
    const said = "B: pay $& now, see `$` and $' end";
    assert.strictEqual(plan('answer', first, said).status, 0);
    const after = read('QUEUE.md');
    assert.ok(after.split('## Answered')[1].includes(`→ ${said}`), 'the answer is recorded verbatim');
    assert.ok(after.length < before.length + said.length + 80, 'nothing else was pasted into the file');
    assert.ok(!after.split('## Answered')[0].includes(`### ${first} ·`));
  });
});

test('an answer that cannot be recorded changes nothing', () => {
  withPlanCopy((plan, read, write) => {
    assert.strictEqual(plan(...ASK).status, 0);
    const broken = read('QUEUE.md').replace(/## Answered[\s\S]*$/, '');
    write('QUEUE.md', broken);
    const first = broken.match(/^### (Q\d+) · A call for the test\?/m)[1];
    const res = plan('answer', first, 'A');
    assert.notStrictEqual(res.status, 0, 'a queue with no Answered section is an error, not a silent loss');
    assert.strictEqual(read('QUEUE.md'), broken, 'the open call is still there');
  });
});

test('a colour in a finding is not taken for an id', () => {
  withPlanCopy((plan, read) => {
    const highest = Math.max(0, ...[...read('findings/inbox.md').matchAll(/^- \d{4}-\d{2}-\d{2} · F(\d{3,}) · /gm)].map((m) => Number(m[1])));
    assert.strictEqual(plan('finding', 'Reverie', 'the dye for #F00900 is wrong').status, 0);
    const res = plan('finding', 'Reverie', 'and again');
    assert.match(res.stdout, new RegExp(`· F${String(highest + 2).padStart(3, '0')} ·`));
  });
});

test('a change is logged at the top of its year', () => {
  withPlanCopy((plan, read) => {
    assert.strictEqual(plan('log', 'Long titles wrap on a phone.', '--ids', 'X03', '--tier', '1').status, 0);
    assert.match(read('CHANGELOG.md'), /## 2031\n\n- 2031-01-02 · Long titles wrap on a phone \(X03\) · tier 1\n/);
  });
});

test('the plan\'s Markdown is drawn, and an unknown block never stalls the walk', async () => {
  const { markdown, inline } = await import(path.join(ROOT, 'scripts/lib/plan-markdown.mjs'));
  assert.strictEqual(inline('a `b` **c** [d](../x.md) [e](https://f.g)'), 'a <code>b</code> <strong>c</strong> d <a href="https://f.g">e</a>');
  const html = markdown('# T\n\n> quoted\n> twice\n\n- [x] done\n- [ ] not\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```\n<x>\n```\n\n---\n\n1. one\n');
  assert.ok(!html.includes('<h3>T'), 'the page draws its own title');
  assert.match(html, /<blockquote>quoted twice<\/blockquote>/);
  assert.match(html, /data-done="true"><\/span>done/);
  assert.match(html, /<th>a<\/th>/);
  assert.match(html, /<pre>&lt;x&gt;<\/pre>/);
  assert.match(html, /<ol><li>one<\/li><\/ol>/);
  // Code is set aside first: nothing inside it is markup, and a bar inside it does not end a cell.
  assert.strictEqual(inline('`_sass/**` and `**/*.md`'), '<code>_sass/**</code> and <code>**/*.md</code>');
  assert.strictEqual(inline('(see https://a.b/c)'), '(see <a href="https://a.b/c">https://a.b/c</a>)');
  const table = markdown('| a | b |\n|---|---|\n| `x | y` | z \\| w |\n', { skipTitle: false });
  assert.match(table, /<td><code>x \| y<\/code><\/td><td>z \| w<\/td>/);
  assert.strictEqual((table.match(/<td>/g) || []).length, 2, 'two cells, not four');
  // Every file in the plan renders in bounded time.
  for (const f of fs.readdirSync(PLAN, { recursive: true }).filter((x) => String(x).endsWith('.md'))) {
    assert.ok(markdown(fs.readFileSync(path.join(PLAN, String(f)), 'utf8')).length > 0, `${f} renders`);
  }
});

const SHAPED = `# I900 · A test idea

**Status:** shaped · **Raised:** 2031-01-01 by the owner · **Stage:** none yet

## In the owner's words

> I want a thing

## Verdict

**Pursue, turned.** Build the small one. A cost of $& would change this.

## Made explicit

"A thing" read two ways; the first is taken.

## Shapes it could take

1. The small one.

## What it changes

| Part of the site | Today | With this idea | Size |
|---|---|---|---|
| Pages and addresses | One page | The same page | none |
| Scripts | \`a.js\` | One more function | small |
| Upkeep | 14 journeys | One more | medium, once |

## Can it be delivered

| What must be true | How it was tried | Result |
|---|---|---|
| The browser can make it | A script, in two engines | proved: 30 ms |
| A phone takes it | Not here | open: by hand on a phone |

## Does it fit

Fits.

## For and against

**For**
- It is small.
- It reuses
  what exists.

**Against**
- It can go stale.

## Challenged

By: the site reviewer, 2031-01-01.

- **Answered:** It is only a toy. It is the part of the site nobody else has.
- **Changed:** It showed a photograph. The photograph is
  gone from shape 1.
- **Stands:** Nobody will use it.

## Questions for the owner

### 1 · Which first?
- **A (recommended):** This.
- **B:** That.

Why: it is smaller.

## Next

A study.
`;

test('a shaped idea is read into its verdict, its weighing and its questions', async () => {
  const { readIdea } = await import('../scripts/lib/plan-ideas.mjs');
  const { idea, errors } = readIdea(SHAPED, 'I900-a-test-idea.md');
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(idea.verdict, 'Pursue, turned');
  assert.ok(idea.verdictText.startsWith('Build the small one.'));
  assert.deepStrictEqual(idea.pros, ['It is small.', 'It reuses what exists.']);
  assert.deepStrictEqual(idea.cons, ['It can go stale.']);
  assert.deepStrictEqual(idea.sizes, { none: 1, small: 1, medium: 1, large: 0 });
  assert.strictEqual(idea.touched, 2);
  assert.deepStrictEqual(idea.changes[1], { part: 'Scripts', today: '`a.js`', after: 'One more function', size: 'small' });
  assert.deepStrictEqual(idea.results, { proved: 1, failed: 0, open: 1 });
  assert.deepStrictEqual(idea.delivery[1], { claim: 'A phone takes it', tried: 'Not here', result: 'open: by hand on a phone', is: 'open' });
  assert.strictEqual(idea.challengedBy, 'the site reviewer, 2031-01-01.');
  assert.deepStrictEqual(idea.outcomes, { answered: 1, changed: 1, stands: 1 });
  assert.deepStrictEqual(idea.objections[1], { is: 'changed', text: 'It showed a photograph. The photograph is gone from shape 1.' });
  assert.strictEqual(idea.by, 'owner');

  // What it waits on is kept apart from the verdict's words, and an option may wrap.
  const wrapped = readIdea(SHAPED.replace('would change this.\n', 'would change this.\n\n**Waits on:** F006, settled\nfirst.\n').replace('- **B:** That.', '- **B:** That,\n  on a second line.'), 'I900-a-test-idea.md').idea;
  assert.strictEqual(wrapped.waitsOn, 'F006, settled first.');
  assert.ok(!wrapped.verdictText.includes('Waits on'));
  assert.strictEqual(wrapped.questions[0].options[1].text, 'That, on a second line.');
  assert.strictEqual(wrapped.questions[0].why, 'it is smaller.');
  assert.deepStrictEqual(idea.questions, [{ n: 1, title: 'Which first?', options: [{ key: 'A', recommended: true, text: 'This.' }, { key: 'B', recommended: false, text: 'That.' }], why: 'it is smaller.' }]);
});

test('an idea is not returned to the owner without a verdict, an impact and both lists', async () => {
  const { readIdea } = await import('../scripts/lib/plan-ideas.mjs');
  const wrong = (body) => readIdea(body, 'I900-a-test-idea.md').errors.join('\n');
  assert.match(wrong(SHAPED.replace('**Pursue, turned.** ', 'It seems fine. ')), /"## Verdict" does not open with/);
  assert.match(wrong(SHAPED.replace(/## What it changes[\s\S]*?## Does it fit/, '## What it changes\n\nNot much.\n\n## Does it fit')), /no table of what it changes/);
  assert.match(wrong(SHAPED.replace('- It can go stale.\n', '')), /a list under \*\*For\*\* and a list under \*\*Against\*\*/);
  assert.match(wrong(SHAPED.replace('- **B:** That.\n', '')), /question 1 has 1 option/);
  assert.match(wrong(SHAPED.replace(/## Made explicit[\s\S]*?## Shapes/, '## Shapes')), /"## Made explicit" is empty or missing/);
  // Tried, not supposed; and argued against by someone who did not shape it.
  assert.match(wrong(SHAPED.replace(/## Can it be delivered[\s\S]*?## Does it fit/, '## Can it be delivered\n\nIt should be possible.\n\n## Does it fit')), /tried, not supposed/);
  assert.match(wrong(SHAPED.replace('| proved: 30 ms |', '| it should work |')), /"Can it be delivered" row "The browser can make it" needs three cells, the last opening with proved, failed, open/);
  assert.match(wrong(SHAPED.replace('By: the site reviewer, 2031-01-01.\n', '')), /no "By:" line/);
  assert.match(wrong(SHAPED.replace('- **Stands:** Nobody will use it.', '- Nobody will use it.')), /does not open with \*\*Answered:\*\*/);
  assert.match(wrong(SHAPED.replace('By: the site reviewer', 'By: the design lead')), /signed by the lead/);
  assert.deepStrictEqual(readIdea(SHAPED.replace('| proved: 30 ms |', '| **proved**: 30 ms |'), 'I900-a-test-idea.md').errors, [], 'the docs write the word in bold');
  // The shapes the command centre cannot draw.
  assert.match(wrong(SHAPED.replace('| Upkeep | 14 journeys | One more | medium, once |', '| Upkeep | 14 journeys | tiny |')), /row "Upkeep" needs four cells/);
  assert.match(wrong(SHAPED.replace('Why: it is smaller.', 'Why: it is smaller.\n\n### 1 · And then?\n- **A:** Yes.\n- **B:** No.')), /two questions are numbered 1/);
  // A bar inside code is not a new cell, and an empty "Waits on" line is not part of the verdict.
  assert.strictEqual(readIdea(SHAPED.replace('`a.js`', '`a | b`'), 'I900-a-test-idea.md').idea.changes[1].today, '`a | b`');
  const bare = readIdea(SHAPED.replace('would change this.\n', 'would change this.\n\n**Waits on:**\n'), 'I900-a-test-idea.md').idea;
  assert.strictEqual(bare.waitsOn, '');
  assert.ok(!bare.verdictText.includes('Waits on'));
  // A raw idea owes nothing yet, and neither does one the owner dropped before it was shaped.
  for (const status of ['raw', 'dropped']) assert.deepStrictEqual(readIdea(`# I900 · A test idea\n\n**Status:** ${status}\n\n## In the owner's words\n\n> x\n`, 'I900-a-test-idea.md').errors, []);
});

test('the owner\'s decision is written under the verdict, once, and moves the status', async () => {
  const { readIdea } = await import('../scripts/lib/plan-ideas.mjs');
  withPlanCopy((plan, read, write) => {
    write('ideas/I900-a-test-idea.md', SHAPED);
    assert.strictEqual(plan('decide', 'I900', 'park', 'Not before $& the Bestiary').status, 0);
    assert.strictEqual(plan('decide', 'I900', 'pursue', 'Q1: A. Go on').status, 0);
    const { idea, errors } = readIdea(read('ideas/I900-a-test-idea.md'), 'I900-a-test-idea.md');
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(idea.status, 'study');
    assert.deepStrictEqual(idea.owner, { decision: 'pursue', date: '2031-01-02', note: 'Q1: A. Go on' });
    assert.strictEqual(idea.verdict, 'Pursue, turned', 'the lead\'s verdict stays as written');
    assert.ok(idea.verdictText.includes('A cost of $& would change this.'));
    assert.strictEqual(read('ideas/I900-a-test-idea.md').match(/\*\*The owner:\*\*/g).length, 1);
    assert.ok(idea.explicit && idea.pros.length === 2, 'the sections after the verdict are untouched');

    assert.strictEqual(plan('idea', 'I want another thing').status, 0);
    assert.strictEqual(plan('decide', 'I901', 'pursue').status, 1, 'a raw idea is shaped before it is pursued');
    assert.strictEqual(plan('decide', 'I901', 'drop', 'On reflection, no').status, 0);
    assert.strictEqual(plan('decide', 'I999', 'drop').status, 1);
    assert.strictEqual(plan('decide', 'I900', 'maybe').status, 2);
    assert.strictEqual(plan('decide', 'I900', 'pursue', 'go', '--to', 'dropped').status, 2, '--to names where a pursued idea goes, nothing else');
    assert.strictEqual(plan('decide', 'I900', 'park', '--to', 'staged').status, 2);

    // A note that opens with dashes is a note; and the lead's own proposal is marked as the lead's.
    assert.strictEqual(plan('decide', 'I900', 'park', '-- not before the Bestiary').status, 0);
    assert.strictEqual(readIdea(read('ideas/I900-a-test-idea.md'), 'I900-a-test-idea.md').idea.owner.note, '-- not before the Bestiary');
    assert.strictEqual(plan('idea', 'A sheet of every vat', '--by', 'lead').status, 0);
    const proposed = readIdea(read('ideas/I902-a-sheet-of-every-vat.md'), 'I902-a-sheet-of-every-vat.md').idea;
    assert.strictEqual(proposed.by, 'lead');
    assert.strictEqual(proposed.words, 'A sheet of every vat');
    assert.strictEqual(plan('idea', 'Another', '--by', 'design-lead').status, 2, 'nobody else\'s sentence is filed as the owner\'s words');
  });
});

test('the same decision read again from the page changes nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
  fs.cpSync(PLAN, dir, { recursive: true });
  const on = (day, ...args) => spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir, PLAN_TODAY: day } });
  const file = path.join(dir, 'ideas/I900-a-test-idea.md');
  try {
    fs.writeFileSync(file, SHAPED);
    assert.strictEqual(on('2031-01-02', 'decide', 'I900', 'pursue', '1: A').status, 0);
    const first = fs.readFileSync(file, 'utf8');
    assert.strictEqual(on('2031-01-03', 'decide', 'I900', 'pursue', '1: A').status, 0);
    assert.strictEqual(fs.readFileSync(file, 'utf8'), first, 'the daily run reads the same answer every day');
    assert.strictEqual(on('2031-01-03', 'decide', 'I900', 'pursue').status, 0);
    assert.strictEqual(fs.readFileSync(file, 'utf8'), first, 'and a bare repeat does not strike the note');
    assert.strictEqual(on('2031-01-04', 'decide', 'I900', 'pursue', '1: B').status, 0);
    assert.match(fs.readFileSync(file, 'utf8'), /\*\*The owner:\*\* pursue · 2031-01-04 · 1: B/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the command centre draws an idea: its questions as taps of their own, its text escaped, no buttons once decided', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
  fs.cpSync(PLAN, dir, { recursive: true });
  const out = path.join(dir, 'hub.html');
  const build = () => spawnSync('node', [path.join(ROOT, 'scripts/hub-page.mjs'), '--out', out], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir, PLAN_TODAY: '2031-01-02' } });
  const card = () => fs.readFileSync(out, 'utf8').split('<article class="call" id="I900"')[1].split('</article>')[0];
  try {
    fs.writeFileSync(path.join(dir, 'ideas/I900-a-test-idea.md'), SHAPED.replace('# I900 · A test idea', '# I900 · A <img src=x onerror=alert(1)> idea'));
    assert.strictEqual(build().status, 0, build().stderr);
    assert.ok(card().includes('&lt;img src=x'), 'an idea\'s title is text, never markup');
    assert.ok(!card().includes('<img src=x'));
    assert.match(card(), /data-q="I900-1" data-o="A"/);
    assert.match(card(), /data-q="I900" data-o="pursue"/);
    assert.match(card(), /Can it be delivered<span>1 proved, 1 open<\/span>/);
    assert.match(card(), /3 objections: 1 stands, 1 changed, 1 answered/);
    assert.ok(!fs.readFileSync(out, 'utf8').includes('takes the recommended answer'), 'an unanswered question is never a yes');

    spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), 'decide', 'I900', 'park', 'Later'], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir } });
    assert.strictEqual(build().status, 0);
    assert.ok(!card().includes('data-o="pursue"'), 'a decided idea asks nothing more');
    assert.match(card(), /You: park/);

    // Pursued with a question left untapped: the question stays on the card, the decision row goes.
    spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), 'decide', 'I900', 'pursue'], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir } });
    assert.strictEqual(build().status, 0);
    assert.match(card(), /data-q="I900-1" data-o="A"/, 'an untapped question is still there to answer');
    assert.ok(!card().includes('data-q="I900" data-o="pursue"'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

/** A throwaway repository with a plan, a site file and this checkout's own plan.mjs, on a branch off master. */
function withRepo(run) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'only-plan-')));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const put = (rel, body) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), body); };
  const commit = (msg) => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', msg); };
  const only = (base = 'master') => spawnSync('node', ['scripts/plan.mjs', 'only-plan', base], { cwd: dir, encoding: 'utf8' });
  try {
    git('init', '-q');
    fs.cpSync(path.join(ROOT, 'scripts/plan.mjs'), path.join(dir, 'scripts/plan.mjs'), { recursive: true });
    fs.cpSync(path.join(ROOT, 'scripts/lib'), path.join(dir, 'scripts/lib'), { recursive: true });
    put('_plan/QUEUE.md', 'queue\n'); put('_includes/head.html', '<head>\n'); put('.gitignore', 'node_modules\n');
    commit('start');
    git('branch', '-M', 'master');
    git('checkout', '-q', '-b', 'hub/daily');
    return run({ dir, git, put, commit, only });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('a branch that touches only the plan passes, with a linked node_modules and names of any shape', () => {
  withRepo(({ dir, put, commit, only }) => {
    put('_plan/findings/a finding – déjà vu.md', 'x\n');
    commit('plan');
    put('_plan/ideas/I900-new.md', 'not committed yet\n');
    fs.symlinkSync(os.tmpdir(), path.join(dir, 'node_modules'));
    const res = only();
    assert.strictEqual(res.status, 0, res.stderr);
    assert.match(res.stdout, /Only the plan: hub\/daily against master/);
  });
});

test('anything else on the branch is refused: a site file, a rename into the plan, a link, a change and its revert', () => {
  const refused = (make, why) => withRepo((r) => { make(r); const res = r.only(); assert.strictEqual(res.status, 1, `${why}: ${res.stdout}`); return res.stderr; });
  assert.match(refused(({ put, commit }) => { put('_includes/head.html', '<head><!-- -->\n'); commit('site'); }, 'a site file'), /_includes\/head\.html is outside _plan\//);
  assert.match(refused(({ put }) => { put('_includes/new.html', 'x\n'); }, 'an untracked site file'), /not committed: _includes\/new\.html/);
  assert.match(refused(({ git, commit }) => { git('mv', '_includes/head.html', '_plan/head.html'); commit('moved in'); }, 'a rename into the plan'), /_includes\/head\.html is outside _plan\//);
  assert.match(refused(({ git }) => { git('mv', '_includes/head.html', '_plan/head.html'); }, 'a staged rename'), /_includes\/head\.html/);
  assert.match(refused(({ dir, commit }) => { fs.symlinkSync('/etc/hosts', path.join(dir, '_plan/linked.md')); commit('a link'); }, 'a link'), /_plan\/linked\.md is not an ordinary file \(mode 120000\)/);
  assert.match(refused(({ put, commit, git }) => { put('_includes/head.html', 'changed\n'); commit('site'); git('-c', 'user.name=t', '-c', 'user.email=t@t', 'revert', '--no-edit', 'HEAD'); }, 'a change and its revert'), /commit [0-9a-f]{7}: _includes\/head\.html/);
  assert.match(refused(({ git }) => { git('rm', '-q', '_includes/head.html'); }, 'a deleted site file'), /_includes\/head\.html/);
  // In the owner's checkout, on the base itself, there is no branch to judge: the run is in the wrong place.
  assert.match(refused(({ git, put }) => { git('checkout', '-q', 'master'); put('_plan/QUEUE.md', 'edited on master\n'); }, 'the base itself'), /is on master itself/);
  // A commit with no parent, merged in and then emptied, still put a site file into the history.
  assert.match(refused(({ git, put, commit }) => {
    git('checkout', '-q', '--orphan', 'side'); git('rm', '-rqf', '.'); put('_includes/orphan.html', 'x\n'); commit('orphan');
    git('checkout', '-q', 'hub/daily');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '--allow-unrelated-histories', '--no-edit', 'side');
    git('rm', '-q', '_includes/orphan.html'); commit('dropped');
  }, 'an orphan commit'), /_includes\/orphan\.html is outside _plan\//);
});

test('the daily branch after a merge of master that brought site commits still holds only the plan', () => {
  withRepo(({ git, put, commit, only }) => {
    put('_plan/findings/day-one.md', 'x\n'); commit('day one');
    git('checkout', '-q', 'master'); put('_includes/head.html', '<head>new\n'); commit('the owner, on master');
    git('checkout', '-q', 'hub/daily');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '--no-edit', 'master');
    put('_plan/findings/day-two.md', 'y\n'); commit('day two');
    const res = only();
    assert.strictEqual(res.status, 0, res.stderr);
  });
});

test('only-plan judges nothing it cannot read, and plan.mjs refuses to act on another checkout', () => {
  withRepo(({ dir, only }) => {
    assert.strictEqual(only('nosuchbranch').status, 2);
    // This checkout's copy, called from inside the other repository: the wrong tree, so it refuses.
    const res = spawnSync('node', [path.join(ROOT, 'scripts/plan.mjs'), 'only-plan', 'master'], { cwd: dir, encoding: 'utf8' });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /Run the copy in the checkout you are in/);
  });
});

test('the plan check gives its whole state through a pipe, however large, and refuses a base it cannot read', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
  fs.cpSync(PLAN, dir, { recursive: true });
  try {
    // Past 64 KiB, where a pipe used to be cut off.
    for (let n = 900; n < 906; n++) fs.writeFileSync(path.join(dir, `ideas/I${n}-a-test-idea.md`), SHAPED.replace(/I900/g, `I${n}`).replace('Build the small one.', `Build the small one. ${'More words. '.repeat(900)}`));
    const res = spawnSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--json'], { encoding: 'utf8', env: { ...process.env, PLAN_DIR: dir }, maxBuffer: 64 * 1024 * 1024 });
    assert.ok(res.stdout.length > 100000, `only ${res.stdout.length} bytes`);
    assert.strictEqual(JSON.parse(res.stdout).ideas.filter((i) => i.id.startsWith('I90')).length, 6);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  assert.strictEqual(spawnSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--since', 'nosuchref'], { encoding: 'utf8' }).status, 2);
});
