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
 *   node scripts/plan.mjs sync <folder>                  # record what the command centre's store holds
 *                                                        # (a dump of its "answers" and "ideas"): nothing twice
 *   node scripts/plan.mjs debt                           # files nothing loads, not yet in the inbox
 *   node scripts/plan.mjs published                      # the command centre was just republished
 *   node scripts/plan.mjs only-plan [base] [--of branch] # exit 1 if anything outside _plan/ differs from base
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
import { readIdea, optionsOf } from './lib/plan-ideas.mjs';
import { debt } from './lib/plan-debt.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = process.env.PLAN_DIR ? path.resolve(process.env.PLAN_DIR) : path.join(ROOT, '_plan');
const file = (rel) => path.join(PLAN, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8');
const write = (rel, body) => fs.writeFileSync(file(rel), body);
// The owner's day, not UTC's: a run after midnight here is today's.
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => process.env.PLAN_TODAY || localDay();
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
  if (ahead > 0) missing(`The daily run's branch (hub/daily) holds ${ahead} commit(s) this checkout does not, with findings, calls or ideas already numbered. Merge it (git merge hub/daily; /hub says how), then run this again.`);
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
    // Kept as said, but as text: one kind of line end (a paste brings \r and U+2028), no control characters.
    const said = (words[0] || '').replace(/\r\n?|[\u2028\u2029\u0085]/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
    if (!said) usage('idea needs the idea, in the words it was said in.');
    idsAreSafeHere();
    const dir = file('ideas');
    // The page's store keeps an idea until its file is on master, so the daily run meets it again:
    // the same words are filed once.
    const quoted = (body) => (body.match(/^> ?.*$/gm) || []).map((l) => l.replace(/^> ?/, '')).join('\n').trim();
    const twin = fs.readdirSync(dir).filter((f) => /^I\d{3,}-.*\.md$/.test(f)).find((f) => oneLine(quoted(fs.readFileSync(path.join(dir, f), 'utf8'))) === oneLine(said));
    if (twin) { console.log(`Already filed as ${twin.split('-')[0]} (_plan/ideas/${twin}): nothing was written.`); break; }
    const taken = fs.readdirSync(dir).map((f) => Number(f.match(/^I(\d{3,})-/)?.[1] || 0));
    const id = `I${String(Math.max(0, ...taken) + 1).padStart(3, '0')}`;
    // A short name: given, or the first few words that carry meaning.
    const name = oneLine(flag('name') || said.replace(/^(i|we) (want|would like|wish|think|need)( that| to)? /i, '').split(/\s+/).slice(0, 7).join(' ').replace(/[.,;:!?]+$/, '')).replace(/[*#`_[\]<>|]/g, '').trim() || 'An idea';
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
    if (what === 'pursue' && /^\*\*Status:\*\*\s*raw\b/m.test(body)) missing(`${id} is still raw: it is shaped (/idea) before it is pursued. Nothing was changed.`);
    const at = body.search(/^## Verdict\s*$/m);
    if (at < 0 || !/^\*\*Status:\*\*\s*[a-z]+/m.test(body)) usage(`_plan/${rel} has lost its Status line or its "## Verdict" heading: nothing was changed.`);
    const after = body.indexOf('\n## ', at + 1);
    const end = after < 0 ? body.length : after;
    // The lead's verdict stays as written; the owner's line sits under it, and a second decision replaces the first.
    const kept = body.slice(at, end).replace(/^\*\*The owner:\*\*.*\n?/m, '').replace(/\n+$/, '');
    // The same decision read again from the page (the daily run does) is not a new decision: the date
    // stays, and so does the note unless a new one is given.
    const was = body.slice(at, end).match(/^\*\*The owner:\*\*\s*(\w+) · \d{4}-\d{2}-\d{2}(?: · (.+))?$/m);
    if (was && was[1] === what && (!note || (was[2] || '') === oneLine(note)) && new RegExp(`^\\*\\*Status:\\*\\*\\s*${to}\\b`, 'm').test(body)) { console.log(`${id}: already ${what}, unchanged.`); break; }
    const line = `**The owner:** ${what} · ${today()}${note ? ` · ${oneLine(note)}` : ''}`;
    const next = `${body.slice(0, at)}${kept}\n\n${line}\n${body.slice(end)}`.replace(/^(\*\*Status:\*\*\s*)[a-z]+/m, (m, lead) => `${lead}${to}`);
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
    // A number is read only where a call's number sits (its heading, or its line under Answered), so a "Q999" in the owner's note is not one.
    const id = `Q${Math.max(0, ...[...body.matchAll(/^(?:### |- \d{4}-\d{2}-\d{2} · )Q(\d+) · /gm)].map((m) => Number(m[1]))) + 1}`;
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
    // The heading on a line of its own: the same words inside a call's paragraph are not it.
    const cut = body.search(/^## Answered\s*$/m);
    const open = cut < 0 ? body : body.slice(0, cut);
    const m = open.match(new RegExp(`### ${id} · ([^\\n]+)\\n[\\s\\S]*?(?=\\n### Q\\d+ · |\\n---\\n*$)`));
    if (!m) missing(`${id} is not open in the queue.`);
    // Functions, not strings, as replacements: the owner's words may hold `$&` or `$'`, which a
    // replacement string would expand.
    const line = `- ${today()} · ${id} · ${m[1].trim()} → ${oneLine(answer)}`;
    const without = body.replace(m[0], () => '').replace(/\n{3,}/g, '\n\n');
    const next = without.replace(/^## Answered\n+/m, () => `## Answered\n\n${line}\n`);
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

  case 'sync': {
    // The owner answers on the command centre; its store is dumped to a folder and read here. The
    // dump is the ArtifactData tool's (`out_dir`): `answers/<id>.json` holding { option, note, at },
    // `ideas/<id>.json` holding { text, at }. What is in it was typed into a page: every id and
    // letter is checked against the plan before anything is written, a note is kept as words and
    // never run, nothing stored is printed back (an unattended agent reads this output), and what
    // the plan already holds is left alone. So it can be run any number of times.
    const dir = path.resolve(words[0] || '');
    if (!words[0] || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) usage('sync needs the folder the store was dumped to (it holds answers/ and ideas/).');
    if (!fs.existsSync(path.join(dir, 'answers')) && !fs.existsSync(path.join(dir, 'ideas'))) missing(`sync: ${dir} holds neither answers/ nor ideas/. Either the store is empty or the dump did not happen: nothing was read, nothing written.`);
    const docs = (name) => {
      const at = path.join(dir, name);
      if (!fs.existsSync(at)) return [];
      return fs.readdirSync(at).filter((f) => f.endsWith('.json')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map((f) => {
        try { const data = JSON.parse(fs.readFileSync(path.join(at, f), 'utf8')); return { id: f.slice(0, -5), data: data && typeof data === 'object' && !Array.isArray(data) ? data : {} }; } catch { return { id: f.slice(0, -5), data: null }; }
      });
    };
    const done = [], session = [], skipped = [], early = [];
    let same = 0;
    // A name or a letter is shown only when it is plainly one; anything else stored is never echoed.
    const shown = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(v) ? v : 'something that is not a plain name');
    // The command's own handlers, by argument list and never through a shell. One that refuses is one line skipped, not a run lost.
    const self = (label, ...args) => { try { return execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch (e) { skipped.push(`${label}: could not be recorded (${args[0]} exited ${e.status ?? 'early'})`); return null; } };
    const text = (v, max) => (typeof v === 'string' ? oneLine(v.replace(/[\u0000-\u001F\u007F\u2028\u2029\u0085]/g, ' ')).slice(0, max) : '');
    const noted = (note) => (note ? ` The owner's note: "${note}".` : '');
    // The day of a tap, as the owner's day (the plan's dates are): '' when the page stored none that can be read.
    const tapped = (data) => { const t = new Date(typeof data.at === 'string' ? data.at : NaN); return Number.isNaN(t.getTime()) ? '' : localDay(t); };
    const answers = docs('answers'), ideas = docs('ideas');
    const stored = new Map(answers.map((d) => [d.id, d.data]));

    for (const { id, data } of answers) {
      if (!data) { skipped.push(`${shown(id)}: its file is not JSON`); continue; }
      const option = typeof data.option === 'string' ? data.option.trim() : '', note = text(data.note, 2000);

      if (/^Q\d+$/.test(id)) {
        const queue = read('QUEUE.md'), cut = queue.search(/^## Answered\s*$/m);
        const open = cut < 0 ? queue : queue.slice(0, cut), answered = cut < 0 ? '' : queue.slice(cut);
        const entry = open.match(new RegExp(`(?:^|\\n)### ${id} · [^\\n]+\\n[\\s\\S]*?(?=\\n### Q\\d+ · |\\n---\\n*$|$)`));
        if (entry) {
          const picked = optionsOf(entry[0]).find((o) => o.key === option);
          if (!picked) { skipped.push(`${id}: ${shown(option)} is not one of its options`); continue; }
          if (self(id, 'answer', id, `${picked.key}: ${picked.text}${noted(note)} (Tapped on the command centre${note ? '' : ', no note'}.)`) !== null) done.push(`${id} answered ${picked.key}`);
          continue;
        }
        const line = answered.split('\n').find((l) => new RegExp(`^- \\d{4}-\\d{2}-\\d{2} · ${id} · `).test(l));
        if (!line) { skipped.push(`${id}: no such call in the queue`); continue; }
        const was = line.match(/→ ([A-Z]): /)?.[1], day = line.slice(2, 12);
        // What the plan holds was written after what the page holds: an answer given since, in chat. The plan stands.
        if (tapped(data) && tapped(data) < day) { same++; continue; }
        // A letter that differs from the one recorded is a change of mind, perhaps on work already done: a session weighs it.
        if (was && /^[A-Z]$/.test(option) && was !== option) session.push(`${id}: the plan says ${was}, the page now says ${option}`);
        else if (note && !oneLine(line).includes(note)) session.push(`${id}: the page holds a note the plan does not`);
        else same++;
        continue;
      }

      const decided = id.match(/^(I\d{3,})$/), asked = id.match(/^(I\d{3,})-(\d+)$/);
      if (asked) { if (!stored.has(asked[1])) early.push(id); continue; }   // a question's answer is recorded with its idea's decision
      if (!decided) { skipped.push(`${shown(id)}: not a call or an idea`); continue; }
      const name = fs.readdirSync(file('ideas')).find((f) => f.startsWith(`${id}-`) && f.endsWith('.md'));
      if (!name) { skipped.push(`${id}: no such idea`); continue; }
      if (!['pursue', 'park', 'drop'].includes(option)) { skipped.push(`${id}: ${shown(option)} is not pursue, park or drop`); continue; }
      const body = read(`ideas/${name}`), { idea } = readIdea(body, name);
      if (!idea) { skipped.push(`${id}: its file cannot be read`); continue; }
      // The same decision, or one the plan recorded on a later day than the tap (a decision given since, in chat): the plan stands.
      if (idea.owner && (idea.owner.decision === option || (tapped(data) && tapped(data) < idea.owner.date))) { same++; continue; }
      // Written here only where nothing is written yet: a shaped idea with no line of the owner's, of any shape.
      const verdict = (body.split(/^## Verdict\s*$/m)[1] || '').split(/^## /m)[0];
      if (/^\*\*The owner:\*\*/m.test(verdict)) { session.push(`${id}: the plan holds another decision of the owner's than the page's ${option}`); continue; }
      if (idea.status === 'raw') { skipped.push(`${id}: still raw, so it is shaped before it is decided`); continue; }
      if (idea.status !== 'shaped') { session.push(`${id}: it is ${idea.status} with no line of the owner's, and the page says ${option}`); continue; }
      const parts = idea.questions.map((q) => {
        const picked = q.options.find((o) => o.key === stored.get(`${id}-${q.n}`)?.option);
        return picked ? `Question ${q.n}: ${picked.key}, ${picked.text.replace(/\.$/, '')}.` : `Question ${q.n}: not answered.`;
      });
      if (self(id, 'decide', id, option, `${parts.join(' ')}${noted(note)} Tapped on the command centre${note ? '' : ', no note'}.`.trim()) !== null) done.push(`${id} ${option}`);
    }

    // A page left open could store any number: ten a run, the rest tomorrow.
    let filed = 0, held = 0;
    for (const { id, data } of ideas) {
      const said = typeof data?.text === 'string' ? data.text.replace(/\u0000/g, '').trim().slice(0, 6000) : '';
      // A lone "--word" would be read as a flag of the command, not as the idea.
      if (!said || /^--[a-z][a-z-]*$/.test(said)) { skipped.push(`an idea (${shown(id)}): no words to keep`); continue; }
      if (filed >= 10) { held++; continue; }
      const out = self(`an idea (${shown(id)})`, 'idea', said);
      if (out === null) continue;
      if (/^Already filed as /.test(out)) same++; else { filed++; done.push(`${out.match(/^I\d{3,}/)?.[0] || 'an idea'} filed, raw`); }
    }

    console.log(`Read: ${answers.length} answer(s), ${ideas.length} idea(s) from the store's dump.`);
    console.log(done.length ? `Recorded: ${done.join('; ')}.` : 'Recorded: nothing new.');
    console.log(`Already in the plan: ${same}.`);
    if (early.length) console.log(`A question answered, its idea not yet decided: ${early.join(', ')}. Nothing to record until it is.`);
    if (held) console.log(`Held for the next run: ${held} more idea(s); ten are filed in one run.`);
    if (session.length) console.log(`For a session to weigh, nothing written: ${session.join('; ')}.`);
    if (skipped.length) console.log(`Skipped, nothing written: ${skipped.join('; ')}.`);
    break;
  }

  case 'debt': {
    // Offered, not filed: whoever reads the list files what holds (plan.mjs finding).
    const { searched, found } = debt(ROOT, read('findings/inbox.md'));
    if (!found.length) { console.log(`Debt: nothing new. ${searched} files searched for a stylesheet or script that nothing loads; what the inbox already names is left out.`); break; }
    console.log(`Debt: ${found.length} file(s) nothing loads, not yet in the inbox (${searched} files searched):`);
    // Each with the line that files it, ready to run as it is: no quotation mark inside the words.
    for (const x of found) console.log(`- ${x.file}: ${x.why}.\n  bash scripts/hub-daily.sh plan finding "${x.file}" "nothing loads it: ${x.why} (${searched} files searched)" --by daily`);
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
    // `--of hub/daily` judges that branch from outside it (a session about to merge it): its commits
    // and its whole, not this checkout's uncommitted work.
    const base = words[0] || 'master', of = flag('of');
    const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    for (const ref of [base, of].filter(Boolean)) { try { git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`); } catch { usage(`only-plan: "${ref}" is not a commit here. Nothing was judged.`); } }
    const tip = of || 'HEAD';
    // Run on the base itself it would be judging the owner's checkout, where the run must not be.
    const branch = of || git('rev-parse', '--abbrev-ref', 'HEAD').trim();
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
    for (const c of git('rev-list', '--no-merges', `${base}..${tip}`).split('\n').filter(Boolean)) raw(`commit ${short(c)}`, git('diff-tree', '--root', '-r', '--raw', '-z', '--no-renames', '--no-commit-id', c));
    // A merge of the base into the branch brings the base's own files; what a merge may not do is
    // change something neither side had.
    for (const c of git('rev-list', '--merges', `${base}..${tip}`).split('\n').filter(Boolean)) raw(`merge ${short(c)}`, git('diff-tree', '-c', '-r', '--raw', '-z', '--no-renames', '--no-commit-id', c));
    raw('the branch as a whole', git('diff', '--raw', '-z', '--no-renames', `${base}...${tip}`));
    // What is not committed yet: "XY path\0", and a rename's old path as the token after it.
    const st = of ? [] : git('status', '--porcelain', '-z', '--untracked-files=all').split('\0');
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
