/**
 * One idea file (`_plan/ideas/I001-name.md`), read into the parts the command centre draws, with
 * what is wrong with it. The shape is `_plan/ideas/README.md`'s. An idea is ready for the owner
 * (`_plan/decisions/0008-ready-and-done.md`) only when it says what it means, what it would change
 * in the site as it stands, what speaks for and against it, whether it can be delivered (tried, not
 * supposed), what a second reader objected to, and gives a verdict. `check-plan.mjs` fails on what
 * this returns in `errors`.
 */
import { cells } from './plan-markdown.mjs';

export const IDEA_STATUSES = ['raw', 'shaped', 'study', 'staged', 'parked', 'dropped'];
// The longer one first: "Pursue, turned" also starts with "Pursue".
export const VERDICTS = ['Pursue, turned', 'Pursue', 'Park', 'Drop'];
export const SIZES = ['none', 'small', 'medium', 'large'];
// What trying an assumption can come to. "open" is honest: it could not be tried here, and says how it will be.
export const RESULTS = ['proved', 'failed', 'open'];
// What became of an objection: it was met, it changed the proposal, or it still stands.
export const OUTCOMES = ['answered', 'changed', 'stands'];

// An idea the owner parked or dropped before it was shaped keeps its file and owes no sections.
const OWES_SHAPE = ['shaped', 'study', 'staged'];

export const OPTION = /^- \*\*([A-Z])\b[^*]*\*\*:?\s*(.+(?:\n(?!- |#|Why:|\n).+)*)/gm;
/** Options written "- **A (recommended):** text", in an idea's question as in the owner's queue.
 *  An option may wrap onto the lines under it; it ends at the next option, a blank line or a heading. */
export const optionsOf = (block) => [...block.matchAll(OPTION)]
  .map((o) => ({ key: o[1], recommended: /recommended/i.test(o[0].split('**')[1]), text: o[2].replace(/\s*\n\s*/g, ' ').trim() }));

const flat = (s) => s.replace(/\s*\n\s*/g, ' ').trim();
const sectionOf = (body, name) => (body.split(new RegExp(`^## ${name}\\s*$`, 'm'))[1] || '').split(/^## /m)[0].trim();
const items = (text) => (text.match(/^- .+(?:\n(?!- |\*\*|\n).+)*/gm) || []).map((l) => flat(l.slice(2)));
const tableRows = (text) => text.split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells);
// The docs write these words in bold, so a cell may too.
const opensWith = (words, cell) => words.find((w) => new RegExp(`^${w}\\b`, 'i').test((cell || '').replace(/^[*_\s]+/, ''))) || null;
const tally = (words, list, key) => Object.fromEntries(words.map((w) => [w, list.filter((x) => x[key] === w).length]));

export function readIdea(body, file) {
  const errors = [];
  const head = body.match(/^# (I\d{3,}) · (.+)$/m);
  const number = file.split('-')[0];
  if (!head || head[1] !== number) return { idea: null, errors: [`_plan/ideas/${file} must open with "# ${number} · a name".`] };
  const id = head[1];
  // The status line is a line of its own: the same words inside a title or the owner's quoted idea are not it.
  const status = body.match(/^\*\*Status:\*\*\s*([a-z]+)/m)?.[1];
  if (!IDEA_STATUSES.includes(status)) errors.push(`_plan/ideas/${file}: "${status}" is not a status (${IDEA_STATUSES.join(', ')}).`);
  const section = (name) => sectionOf(body, name);

  const verdictText = section('Verdict');
  const owner = verdictText.match(/^\*\*The owner:\*\*\s*(pursue|park|drop) · (\d{4}-\d{2}-\d{2})(?: · (.+))?$/m);
  // What must be settled before it can ship: not a change the idea makes, so it has a line of its own.
  const WAITS = /^\*\*Waits on:\*\*[ \t]*(.*(?:\n(?!\n|\*\*).+)*)/m;
  const waitsOn = flat(verdictText.match(WAITS)?.[1] || '');
  const leads = verdictText.replace(/^\*\*The owner:\*\*.*$/m, '').replace(WAITS, '').trim();
  const verdict = VERDICTS.find((v) => new RegExp(`^\\*\\*${v}\\.?\\*\\*`).test(leads)) || null;

  const weigh = section('For and against');
  const pros = items((weigh.split(/^\*\*For\*\*\s*$/m)[1] || '').split(/^\*\*Against\*\*\s*$/m)[0]);
  const cons = items(weigh.split(/^\*\*Against\*\*\s*$/m)[1] || '');

  const changesText = section('What it changes');
  const changes = tableRows(changesText).map((r) => ({ part: r[0] || '', today: r[1] || '', after: r[2] || '', size: r[3] || '', cells: r.length }));
  const sizes = Object.fromEntries(SIZES.map((s) => [s, changes.filter((r) => opensWith(SIZES, r.size) === s).length]));

  const deliveryText = section('Can it be delivered');
  const delivery = tableRows(deliveryText).map((r) => ({ claim: r[0] || '', tried: r[1] || '', result: r[2] || '', is: opensWith(RESULTS, r[2]), cells: r.length }));

  const challengeText = section('Challenged');
  const challengedBy = flat(challengeText.match(/^By:\s*(.+)$/m)?.[1] || '');
  const objections = items(challengeText).map((t) => {
    const m = t.match(/^\*\*(\w+)[.:]?\*\*:?\s*(.+)$/);
    return { is: m ? opensWith(OUTCOMES, m[1]) : null, text: m ? m[2] : t };
  });

  const questions = section('Questions for the owner').split(/^### /m).slice(1).map((block) => {
    const first = block.split('\n')[0].match(/^(\d+)\s*·\s*(.+)$/);
    return { n: first ? Number(first[1]) : null, title: (first?.[2] || block.split('\n')[0]).trim(), options: optionsOf(block), why: flat(block.match(/^Why:\s*(.+(?:\n(?!\n).+)*)/m)?.[1] || '') };
  });

  if (OWES_SHAPE.includes(status)) {
    const where = `_plan/ideas/${file} is ${status} but`;
    if (!verdict) errors.push(`${where} "## Verdict" does not open with one of ${VERDICTS.map((v) => `**${v}.**`).join(', ')}.`);
    for (const name of ['Made explicit', 'Shapes it could take', 'Does it fit']) if (!section(name)) errors.push(`${where} "## ${name}" is empty or missing.`);

    if (!changes.length) errors.push(`${where} "## What it changes" has no table of what it changes in the site as it stands.`);
    for (const r of changes) if (r.cells !== 4 || !opensWith(SIZES, r.size)) errors.push(`${where} the "What it changes" row "${r.part}" needs four cells, the last opening with ${SIZES.join(', ')}.`);

    if (!pros.length || !cons.length) errors.push(`${where} "## For and against" needs a list under **For** and a list under **Against**.`);

    if (!delivery.length) errors.push(`${where} "## Can it be delivered" has no table of what must be true and how it was tried: an idea reaches the owner tried, not supposed.`);
    for (const r of delivery) if (r.cells !== 3 || !r.is) errors.push(`${where} the "Can it be delivered" row "${r.claim}" needs three cells, the last opening with ${RESULTS.join(', ')}.`);

    if (/^(the )?(design[- ])?lead\b/i.test(challengedBy)) errors.push(`${where} "## Challenged" is signed by the lead: the one who shaped an idea does not challenge it.`);
    if (!challengedBy) errors.push(`${where} "## Challenged" has no "By:" line: someone who did not shape the idea argues against it before the owner hears it.`);
    if (!objections.length) errors.push(`${where} "## Challenged" lists no objection.`);
    for (const o of objections) if (!o.is) errors.push(`${where} an objection under "## Challenged" does not open with ${OUTCOMES.map((x) => `**${x[0].toUpperCase()}${x.slice(1)}:**`).join(', ')}.`);

    const seen = new Set();
    for (const q of questions) {
      if (q.n === null) errors.push(`${where} a question is not written "### 1 · the question".`);
      else if (seen.has(q.n)) errors.push(`${where} two questions are numbered ${q.n}: the command centre stores an answer by that number.`);
      else if (q.options.length < 2) errors.push(`${where} question ${q.n} has ${q.options.length} option(s): it needs at least two, written "- **A:** …", or the command centre draws no buttons.`);
      seen.add(q.n);
    }
  }

  const notTables = (text) => text.split('\n').filter((l) => !/^\|/.test(l)).join('\n').trim();
  return {
    idea: {
      id, title: head[2].trim(), file: `ideas/${file}`, status,
      raised: body.match(/^\*\*Status:\*\*.*\*\*Raised:\*\*\s*(\d{4}-\d{2}-\d{2})/m)?.[1] || null,
      // Most ideas are the owner's. The lead may propose one of its own; it takes the same path.
      by: /^\*\*Status:\*\*.*\*\*Raised:\*\*[^·\n]*\bby the lead\b/m.test(body) || /^## As proposed\s*$/m.test(body) ? 'lead' : 'owner',
      words: (section("In the owner's words") || section('As proposed')).replace(/^> ?/gm, ''),
      verdict, verdictText: leads.replace(/^\*\*[^*]+\*\*\s*/, ''), waitsOn,
      owner: owner ? { decision: owner[1], date: owner[2], note: owner[3] || '' } : null,
      explicit: section('Made explicit'), shapes: section('Shapes it could take'),
      changes: changes.map(({ cells: _, ...r }) => r), changesNote: notTables(changesText),
      sizes, touched: changes.length - sizes.none,
      delivery: delivery.map(({ cells: _, ...r }) => r), deliveryNote: notTables(deliveryText), results: tally(RESULTS, delivery, 'is'),
      challengedBy, objections, outcomes: tally(OUTCOMES, objections, 'is'),
      fit: section('Does it fit'), pros, cons, questions, next: section('Next'),
    },
    errors,
  };
}
