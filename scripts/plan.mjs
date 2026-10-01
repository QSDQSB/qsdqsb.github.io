#!/usr/bin/env node
/**
 * The plan's own hands. The routine edits to `_plan/` (file a finding, move it on, ask the owner,
 * record an answer, log a change) are done here, not by hand, so every session writes them in the
 * same shape: the shape `check-plan.mjs` validates and `hub-page.mjs` draws.
 *
 *   node scripts/plan.mjs finding "<where>" "<what was seen>" [--by owner|session|reviewer|daily]
 *   node scripts/plan.mjs take F012 "stage 3"            # a finding has a home: move it to Taken
 *   node scripts/plan.mjs idea "<the owner's words>" [--name "a short name"] [--by owner|lead]
 *                                                        # an idea, kept verbatim in a file of its own
 *   node scripts/plan.mjs decide I001 pursue|park|drop "<the owner's note>" [--to study|staged]
 *                                                        # the owner decided on a shaped idea
 *   node scripts/plan.mjs ask "<question>" --body "<a short paragraph>" \
 *                         --option "A*: the recommended way" --option "B: the other"
 *   node scripts/plan.mjs answer Q5 "A: a designed holding page"   # the owner answered
 *   node scripts/plan.mjs log "<what a reader now gets>" [--ids X03,X11] [--tier 1]
 *   node scripts/plan.mjs published                      # the command centre was just republished
 *   node scripts/plan.mjs only-plan [base]               # exit 1 if anything outside _plan/ differs from base
 *   node scripts/plan.mjs status                         # the session brief
 *
 * Ids are never reused: F numbers count up across Waiting and Taken, Q numbers across open and
 * Answered. The command centre stores the owner's answers by Q number, and commits cite findings
 * by F number, so a reused id would point an old answer at a new question.
 *
 * `PLAN_DIR` points the tool at another folder (the tests use a copy).
 *
 * Exit codes: 0 done · 1 the thing named was not found · 2 usage
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planHash } from './lib/plan-hash.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = process.env.PLAN_DIR ? path.resolve(process.env.PLAN_DIR) : path.join(ROOT, '_plan');
const file = (rel) => path.join(PLAN, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8');
const write = (rel, body) => fs.writeFileSync(file(rel), body);
const today = () => process.env.PLAN_TODAY || new Date().toISOString().slice(0, 10);
const usage = (why) => { console.error(`${why}\nSee the head of scripts/plan.mjs for the commands.`); process.exit(2); };
const missing = (why) => { console.error(why); process.exit(1); };
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();

// This copy keeps this checkout's plan. Called by its path from inside another checkout (a worktree
// calling the main one's script), it would judge or write the wrong tree: refuse.
if (!process.env.PLAN_DIR) {
  let here = '';
  try { here = fs.realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { /* not in a checkout: nothing to mistake */ }
  if (here && here !== fs.realpathSync(ROOT)) usage(`This is ${ROOT}'s copy of plan.mjs, called from ${here}. Run the copy in the checkout you are in: node scripts/plan.mjs …`);
}

/** The daily run records on its own branch. While that branch holds commits this checkout lacks,
 *  an id given out here could be one it has already given out: merge it first. */
function idsAreSafeHere() {
  if (process.env.PLAN_DIR) return;
  const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
  const ahead = Number(git('rev-list', '--count', 'HEAD..hub/daily'));
  if (ahead > 0) missing(`The daily run's branch (hub/daily) holds ${ahead} commit(s) this checkout does not, with findings, calls or ideas already numbered. Ask the owner, merge it (git merge hub/daily), then run this again.`);
}

const [command, ...rest] = process.argv.slice(2);
const flags = {}, words = [];
for (let i = 0; i < rest.length; i++) {
  // A flag is a bare word (--by, --option). A note that opens with dashes is a note.
  if (/^--[a-z][a-z-]*$/.test(rest[i])) { const k = rest[i].slice(2); (flags[k] ||= []).push(rest[++i]); } else words.push(rest[i]);
}
const flag = (k) => flags[k]?.[0];

/** The inbox as its three parts, so a line can be added to one and nothing else moves. */
function inbox() {
  const body = read('findings/inbox.md');
  const w = body.indexOf('## Waiting'), t = body.indexOf('## Taken');
  if (w < 0 || t < 0) usage('findings/inbox.md has lost its "## Waiting" or "## Taken" heading.');
  return { head: body.slice(0, w), waiting: body.slice(w, t), taken: body.slice(t) };
}
// An id is read only where an id sits ("· F012 ·"), so a colour such as #F00900 in a finding's words is not one.
const nextId = (text, letter) => `${letter}${String(Math.max(0, ...[...text.matchAll(new RegExp(`^- \\d{4}-\\d{2}-\\d{2} · ${letter}(\\d{3,}) · `, 'gm'))].map((m) => Number(m[1]))) + 1).padStart(3, '0')}`;

switch (command) {
  case 'finding': {
    const [where, what] = words;
    if (!where || !what) usage('finding needs two things: where, and what was seen.');
    idsAreSafeHere();
    const box = inbox();
    const id = nextId(box.waiting + box.taken, 'F');
    const line = `- ${today()} · ${id} · ${oneLine(where)} · ${oneLine(what)} (${flag('by') || 'session'})`;
    const waiting = box.waiting.replace(/## Waiting\n+/, (m) => `${m}${line}\n`);
    write('findings/inbox.md', box.head + waiting + box.taken);
    console.log(line);
    break;
  }

  case 'idea': {
    const [said] = words;
    if (!said) usage('idea needs the idea, in the words it was said in.');
    idsAreSafeHere();
    const dir = file('ideas');
    const taken = fs.readdirSync(dir).map((f) => Number(f.match(/^I(\d{3,})-/)?.[1] || 0));
    const id = `I${String(Math.max(0, ...taken) + 1).padStart(3, '0')}`;
    // A short name: given, or the first few words that carry meaning.
    const name = oneLine(flag('name') || said.replace(/^(i|we) (want|would like|wish|think|need)( that| to)? /i, '').split(/\s+/).slice(0, 7).join(' ').replace(/[.,;:!?]+$/, ''));
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'idea';
    const rel = `ideas/${id}-${slug}.md`;
    if (flag('by') && !['owner', 'lead'].includes(flag('by'))) usage('An idea is the owner\'s or the lead\'s: --by owner (the default) or --by lead.');
    const lead = flag('by') === 'lead';
    const sections = ['Verdict', 'Made explicit', 'Shapes it could take', 'What it changes', 'Can it be delivered', 'Does it fit', 'For and against', 'Challenged', 'Questions for the owner', 'Next'];
    write(rel, `# ${id} · ${name.charAt(0).toUpperCase()}${name.slice(1)}\n\n**Status:** raw · **Raised:** ${today()} by ${lead ? 'the lead' : 'the owner'} · **Stage:** none yet\n\n## ${lead ? 'As proposed' : "In the owner's words"}\n\n${said.trim().split('\n').map((l) => `> ${l}`).join('\n')}\n\n${sections.map((h) => `## ${h}\n`).join('\n')}`);
    console.log(`${id} · ${name} → _plan/${rel}`);
    break;
  }

  case 'decide': {
    const [id, what, note] = words;
    if (flag('to') && (what !== 'pursue' || !['study', 'staged'].includes(flag('to')))) usage('--to says where a pursued idea goes: study or staged.');
    const to = { pursue: flag('to') || 'study', park: 'parked', drop: 'dropped' }[what];
    if (!/^I\d{3,}$/.test(id || '') || !to) usage('decide needs an idea id (I001) and pursue, park or drop; --to study or staged says where a pursued idea goes.');
    const name = fs.readdirSync(file('ideas')).find((f) => f.startsWith(`${id}-`) && f.endsWith('.md'));
    if (!name) missing(`${id} is not in _plan/ideas/.`);
    const rel = `ideas/${name}`;
    const body = read(rel);
    // CLAUDE.md: an idea of the owner's is never built from the sentence.
    if (what === 'pursue' && /\*\*Status:\*\*\s*raw\b/.test(body)) missing(`${id} is still raw: it is shaped (/idea) before it is pursued. Nothing was changed.`);
    const at = body.search(/^## Verdict\s*$/m);
    if (at < 0 || !/\*\*Status:\*\*\s*[a-z]+/.test(body)) usage(`_plan/${rel} has lost its Status line or its "## Verdict" heading: nothing was changed.`);
    const after = body.indexOf('\n## ', at + 1);
    const end = after < 0 ? body.length : after;
    // The lead's verdict stays as written; the owner's line sits under it, and a second decision replaces the first.
    const kept = body.slice(at, end).replace(/^\*\*The owner:\*\*.*\n?/m, '').replace(/\n+$/, '');
    // The same decision read again from the page (the daily run does) is not a new decision: the date
    // stays, and so does the note unless a new one is given.
    const was = body.slice(at, end).match(/^\*\*The owner:\*\*\s*(\w+) · \d{4}-\d{2}-\d{2}(?: · (.+))?$/m);
    if (was && was[1] === what && (!note || (was[2] || '') === oneLine(note)) && new RegExp(`\\*\\*Status:\\*\\*\\s*${to}\\b`).test(body)) { console.log(`${id}: already ${what}, unchanged.`); break; }
    const line = `**The owner:** ${what} · ${today()}${note ? ` · ${oneLine(note)}` : ''}`;
    const next = `${body.slice(0, at)}${kept}\n\n${line}\n${body.slice(end)}`.replace(/(\*\*Status:\*\*\s*)[a-z]+/, (m, lead) => `${lead}${to}`);
    write(rel, next);
    console.log(`${id}: ${what} → ${to}`);
    break;
  }

  case 'take': {
    const [id, where] = words;
    if (!/^F\d{3,}$/.test(id || '') || !where) usage('take needs a finding id (F012) and where it went.');
    const box = inbox();
    const line = box.waiting.split('\n').find((l) => l.startsWith('- ') && new RegExp(`· ${id} ·`).test(l));
    if (!line) missing(`${id} is not waiting in the inbox.`);
    const waiting = box.waiting.replace(`${line}\n`, '');
    const taken = `${box.taken.replace(/\n+$/, '')}\n${line} → ${oneLine(where)}\n`;
    write('findings/inbox.md', box.head + waiting + taken);
    console.log(`${id} → ${oneLine(where)}`);
    break;
  }

  case 'ask': {
    const [question] = words;
    const options = flags.option || [];
    if (!question || !flag('body') || options.length < 2) usage('ask needs a question, --body, and at least two --option entries ("A*: …" marks the recommendation).');
    idsAreSafeHere();
    const body = read('QUEUE.md');
    const at = body.search(/\n---\n+## Answered/);
    if (at < 0) usage('QUEUE.md has lost its rule and "## Answered" heading: nothing was changed.');
    const id = `Q${Math.max(0, ...[...body.matchAll(/\bQ(\d+)\b/g)].map((m) => Number(m[1]))) + 1}`;
    const lines = options.map((o) => {
      const m = o.match(/^([A-Z])(\*)?:\s*(.+)$/);
      if (!m) usage(`An option reads "A: text" or "A*: text"; got "${o}".`);
      return `- **${m[1]}${m[2] ? ' (recommended)' : ''}:** ${oneLine(m[3])}`;
    });
    const entry = `### ${id} · ${oneLine(question)}\n\nAsked: ${today()}\n\n${flag('body').trim()}\n\n${lines.join('\n')}\n`;
    write('QUEUE.md', `${body.slice(0, at).replace(/\n+$/, '')}\n\n${entry}${body.slice(at)}`);
    console.log(`${id} · ${oneLine(question)}`);
    break;
  }

  case 'answer': {
    const [id, answer] = words;
    if (!/^Q\d+$/.test(id || '') || !answer) usage('answer needs a queue id (Q5) and the answer.');
    const body = read('QUEUE.md');
    const open = body.split('## Answered')[0];
    const m = open.match(new RegExp(`### ${id} · ([^\\n]+)\\n[\\s\\S]*?(?=\\n### Q\\d+ · |\\n---\\n*$)`));
    if (!m) missing(`${id} is not open in the queue.`);
    // Functions, not strings, as replacements: the owner's words may hold `$&` or `$'`, which a
    // replacement string would expand.
    const line = `- ${today()} · ${id} · ${m[1].trim()} → ${oneLine(answer)}`;
    const without = body.replace(m[0], () => '').replace(/\n{3,}/g, '\n\n');
    const next = without.replace(/## Answered\n+/, () => `## Answered\n\n${line}\n`);
    if (!next.includes(line)) usage('QUEUE.md has lost its "## Answered" heading: nothing was changed.');
    write('QUEUE.md', next);
    console.log(`${id} answered: ${oneLine(answer)}`);
    break;
  }

  case 'log': {
    const [text] = words;
    if (!text) usage('log needs what a reader now gets, in a line.');
    const body = read('CHANGELOG.md');
    const year = today().slice(0, 4);
    const ids = flag('ids') ? ` (${flag('ids').split(',').map((s) => s.trim()).join(', ')})` : '';
    const line = `- ${today()} · ${oneLine(text).replace(/\.$/, '')}${ids} · tier ${flag('tier') || '0'}`;
    const next = body.includes(`## ${year}\n`)
      ? body.replace(new RegExp(`## ${year}\\n+`), (h) => `${h}${line}\n`)
      : body.replace(/\n## \d{4}\n/, (h) => `\n## ${year}\n\n${line}\n${h}`);
    if (next === body) usage('CHANGELOG.md has no "## YYYY" section to add to.');
    write('CHANGELOG.md', next);
    console.log(line);
    break;
  }

  case 'published': {
    // Recorded so check-plan can tell when the page the owner reads is behind the plan.
    const hub = fs.existsSync(file('hub.json')) ? JSON.parse(read('hub.json')) : {};
    hub.published = { date: today(), hash: planHash(PLAN) };
    write('hub.json', `${JSON.stringify(hub, null, 2)}\n`);
    console.log(`The command centre is recorded as published on ${hub.published.date} (${hub.published.hash}).`);
    break;
  }

  case 'only-plan': {
    // The daily run's one promise, as a check and not a sentence: its branch holds nothing but the
    // plan. Judged commit by commit as well as end to end (a site change and its revert are both
    // refused), with renames off (a site file moved into _plan/ is a site file deleted), and only
    // ordinary files allowed (a link under _plan/ can point anywhere).
    const base = words[0] || 'master';
    const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    try { git('rev-parse', '--verify', '--quiet', `${base}^{commit}`); } catch { usage(`only-plan: "${base}" is not a commit here. Nothing was judged.`); }
    // Run on the base itself it would be judging the owner's checkout, where the run must not be.
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
    if (branch === base) missing(`only-plan judges a branch against ${base}; this checkout (${ROOT}) is on ${base} itself. The daily run works in its own worktree: you are in the wrong place.`);
    const bad = [];
    const inPlan = (f) => f.startsWith('_plan/');
    // `--raw -z`: ":old new sha sha S\0path\0" per file; a merge's has a colon and a mode per
    // parent, then the result's. The mode judged is the one the commit leaves.
    const raw = (where, out) => {
      const t = out.split('\0');
      for (let i = 0; i + 1 < t.length; i += 2) {
        const parents = t[i].match(/^:+/)[0].length, mode = t[i].replace(/^:+/, '').split(' ')[parents], f = t[i + 1];
        if (!inPlan(f)) bad.push(`${where}: ${f} is outside _plan/`);
        else if (mode !== '100644' && mode !== '000000') bad.push(`${where}: ${f} is not an ordinary file (mode ${mode})`);
      }
    };
    const short = (c) => c.slice(0, 7);
    for (const c of git('rev-list', '--no-merges', `${base}..HEAD`).split('\n').filter(Boolean)) raw(`commit ${short(c)}`, git('diff-tree', '--root', '-r', '--raw', '-z', '--no-renames', '--no-commit-id', c));
    // A merge of the base into the branch brings the base's own files; what a merge may not do is
    // change something neither side had.
    for (const c of git('rev-list', '--merges', `${base}..HEAD`).split('\n').filter(Boolean)) raw(`merge ${short(c)}`, git('diff-tree', '-c', '-r', '--raw', '-z', '--no-renames', '--no-commit-id', c));
    raw('the branch as a whole', git('diff', '--raw', '-z', '--no-renames', `${base}...HEAD`));
    // What is not committed yet: "XY path\0", and a rename's old path as the token after it.
    const st = git('status', '--porcelain', '-z', '--untracked-files=all').split('\0');
    for (let i = 0; i < st.length; i++) {
      if (!st[i]) continue;
      const xy = st[i].slice(0, 2), paths = [st[i].slice(3)];
      if (/[RC]/.test(xy)) paths.push(st[++i]);
      for (const f of paths) {
        if (!inPlan(f)) bad.push(`not committed: ${f} is outside _plan/`);
        else { const at = path.join(ROOT, f); if (fs.existsSync(at) && !fs.lstatSync(at).isFile()) bad.push(`not committed: ${f} is not an ordinary file`); }
      }
    }
    if (bad.length) missing(`Not only the plan (${branch} against ${base}, in ${ROOT}):\n${[...new Set(bad)].map((l) => `  ${l}`).join('\n')}`);
    console.log(`Only the plan: ${branch} against ${base}, in ${ROOT}.`);
    break;
  }

  case 'status':
    process.stdout.write(execFileSync('node', [path.join(ROOT, 'scripts/check-plan.mjs'), '--brief'], { cwd: ROOT, encoding: 'utf8' }));
    break;

  default:
    usage(command ? `Unknown command: ${command}` : 'A command is needed.');
}
