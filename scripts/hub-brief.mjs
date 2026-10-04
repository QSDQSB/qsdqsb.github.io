#!/usr/bin/env node
/**
 * The hub's day brief: one page on what the automated runs, the sessions and the checks did on one
 * day, and what waits on whom. Everything on it is read, never typed: git on GitHub's master (what
 * reached it that day, and the plan at the day's start and end), GitHub's pull requests and checks
 * (`gh`, read only), and the daily run's own log. The 07:34 run builds it for the day before
 * (`bash scripts/hub-daily.sh brief`) and republishes it at the address in `_plan/hub.json` (`brief`).
 *
 *   node scripts/hub-brief.mjs [--day YYYY-MM-DD | yesterday] [--ref origin/master] [--runs <log>] [--out <file>]
 *
 * `HUB_BRIEF_NO_GH=1` leaves GitHub out (the tests, or a machine without `gh`): the page says so.
 * Exit codes: 0 written · 2 usage, or the day is not in the history
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_SLUG = 'QSDQSB/qsdqsb.github.io';
const pad = (n) => String(n).padStart(2, '0');
const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** What a commit's files say it is: the plan, the tools, or something a reader meets. */
export function kindOf(files) {
  if (files.length && files.every((f) => f.startsWith('_plan/'))) return 'plan';
  if (files.length && files.every((f) => /^(_plan\/|scripts\/|tests\/|\.claude\/|\.github\/|CLAUDE\.md$|_docs\/|package(-lock)?\.json$)/.test(f))) return 'tool';
  return 'site';
}

function stageCounts(read) {
  const out = [];
  for (const f of read.list('_plan/stages').filter((x) => /^\d\d-.*\.md$/.test(x)).sort()) {
    const body = read.file(`_plan/stages/${f}`) || '';
    const title = (body.match(/^# (.+)$/m)?.[1] || f).replace(/^Stage \d+\s*[·:—-]\s*/i, '').trim();
    out.push({ n: Number(f.slice(0, 2)), title, done: (body.match(/^- \[x\]/gm) || []).length, open: (body.match(/^- \[ \]/gm) || []).length,
      status: body.match(/^\*\*Status:\*\*\s*([^·\n]+)/m)?.[1].trim() || '' });
  }
  return out;
}
const inboxCounts = (body = '') => {
  const w = body.indexOf('## Waiting'), t = body.indexOf('## Taken');
  const lines = (s) => (s.match(/^- /gm) || []).length;
  return { waiting: w < 0 || t < 0 ? 0 : lines(body.slice(w, t)), taken: t < 0 ? 0 : lines(body.slice(t)) };
};

/** The day, from a repository (`cwd`) and its ref. Pure but for git, gh and the log it is pointed at. */
export function collect({ day, ref, runsLog, cwd = ROOT, gh = !process.env.HUB_BRIEF_NO_GH }) {
  const git = (...a) => { try { return execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch { return ''; } };
  const next = localDay(new Date(new Date(`${day}T12:00:00`).getTime() + 86400000));
  // Master as it stood: its own line only (a merge's other parent was a branch, not master).
  const at = (when) => git('rev-list', '-1', '--first-parent', `--before=${when}`, ref).trim();
  const start = at(`${day} 00:00`), end = at(`${next} 00:00`);
  if (!end) return null;
  const reader = (rev) => ({
    file: (p) => (rev ? git('show', `${rev}:${p}`) : ''),
    list: (dir) => (rev ? git('ls-tree', '--name-only', `${rev}:${dir}`).split('\n').filter(Boolean) : []),
  });
  const before = reader(start), after = reader(end);

  // What reached master that day: each step on master's own line, and the commits it brought (a
  // merge brings its branch's). A commit made that day sits at its own time; one made earlier, on a
  // branch, sits at the time it arrived.
  // The step's committer date: when it reached master, whether merged, rebased or picked.
  const steps = git('log', '--first-parent', '--reverse', '--date=format-local:%Y-%m-%d %H:%M', '--format=%H\u0002%cd\u0002%P', start ? `${start}..${end}` : end)
    .split('\n').filter(Boolean).map((l) => { const [sha, when, parents] = l.split('\u0002'); return { sha, when, parents: parents.split(' ') }; });
  const commits = [];
  for (const step of steps) {
    const range = step.parents.length > 1 ? [`${step.parents[0]}..${step.sha}`] : ['-1', step.sha];
    const log = git('log', ...range, '--no-merges', '--reverse', '--date=format-local:%Y-%m-%d %H:%M', '--format=\u0001%h\u0002%ad\u0002%s', '--name-only');
    for (const chunk of log.split('\u0001').filter(Boolean)) {
      const [head, ...rest] = chunk.split('\n');
      const [sha, when, subject] = head.split('\u0002');
      const files = rest.filter(Boolean);
      // A call recorded: lines added under "## Answered" in this commit's queue.
      const recorded = files.includes('_plan/QUEUE.md') ? (git('show', '--format=', sha, '--', '_plan/QUEUE.md').match(/^\+- \d{4}-\d{2}-\d{2} · /gm) || []).length : 0;
      const ownDay = when.slice(0, 10) === day;
      commits.push({ sha, time: ownDay ? when.slice(11) : step.when.slice(11), arrived: !ownDay, subject, kind: kindOf(files), files: files.length, queue: recorded > 0 });
    }
  }
  // GitHub: pull requests opened or merged that day, and the checks run that day.
  let prs = null, checks = null;
  if (gh) {
    const run = (...a) => { try { return JSON.parse(execFileSync('gh', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 })); } catch (e) { if (process.env.HUB_BRIEF_DEBUG) console.error(String(e.stderr || e.message).slice(0, 300)); return null; } };
    const all = run('pr', 'list', '--repo', REPO_SLUG, '--state', 'all', '--limit', '60', '--json', 'number,title,state,createdAt,mergedAt,changedFiles,additions,deletions');
    if (all) prs = all.map((p) => ({ ...p, opened: new Date(p.createdAt), merged: p.mergedAt ? new Date(p.mergedAt) : null }))
      .filter((p) => localDay(p.opened) === day || (p.merged && localDay(p.merged) === day))
      .map((p) => ({ number: p.number, title: p.title, state: p.state, files: p.changedFiles, add: p.additions, del: p.deletions,
        opened: localDay(p.opened) === day ? hhmm(p.opened) : '00:00', merged: p.merged && localDay(p.merged) === day ? hhmm(p.merged) : null }))
      .sort((a, b) => a.opened.localeCompare(b.opened));
    const prev = localDay(new Date(new Date(`${day}T12:00:00`).getTime() - 86400000));   // GitHub's dates are UTC: ask wide, keep the local day
    const runs = run('run', 'list', '--repo', REPO_SLUG, '--limit', '400', '--created', `${prev}..${next}`, '--json', 'workflowName,conclusion,createdAt,headBranch');
    if (runs) checks = runs.filter((r) => localDay(new Date(r.createdAt)) === day)
      .map((r) => ({ workflow: r.workflowName, conclusion: r.conclusion || 'running', time: hhmm(new Date(r.createdAt)), branch: r.headBranch }));
  }

  // What waits on the owner from the work run: its open pull requests, and the tasks it held with a question.
  let workPrs = null;
  if (gh) {
    try { workPrs = JSON.parse(execFileSync('gh', ['pr', 'list', '--repo', REPO_SLUG, '--state', 'open', '--json', 'number,title,headRefName,createdAt'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 }))
      .filter((p) => p.headRefName.startsWith('work/')).map((p) => ({ number: p.number, title: p.title, days: Math.floor((Date.now() - new Date(p.createdAt)) / 864e5) })); } catch { workPrs = null; }
  }
  const holds = git('for-each-ref', '--format=%(refname:short)%09%(contents:body)', 'refs/remotes/origin/hold').split('\n').filter(Boolean)
    .map((l) => { const [ref, ...why] = l.split('\t'); return { key: ref.replace(/^origin\/hold\//, ''), why: why.join(' ').trim() }; });

  // The daily run's own log: one line a run, "start<TAB>end<TAB>kept<TAB>push", times in ISO.
  const runs = (runsLog && fs.existsSync(runsLog) ? fs.readFileSync(runsLog, 'utf8') : '').split('\n').filter(Boolean).map((l) => {
    const [s, e, kept = '', push = ''] = l.split('\t'); const a = new Date(s), b = new Date(e);
    return Number.isNaN(a.getTime()) || localDay(a) !== day ? null : { work: /^WORK: /.test(kept), from: hhmm(a), to: Number.isNaN(b.getTime()) ? hhmm(a) : hhmm(b), seconds: Math.max(0, Math.round((b - a) / 1000)) || null, kept, push, ok: !Number.isNaN(b.getTime()) && !/^(WORK: )?(REFUSED|STOP|DIED)/.test(kept) };
  }).filter(Boolean);

  const answered = (after.file('_plan/QUEUE.md').split(/^## Answered\s*$/m)[1] || '').split('\n')
    .filter((l) => l.startsWith(`- ${day} · `)).map((l) => {
      const m = l.match(/^- \S+ · (?:(Q\d+) · )?(.+?) → (.+)$/);
      // The queue does not say whether a numbered call was tapped or answered in chat: only whether it was numbered.
      return m ? { id: m[1] || null, question: m[2].replace(/\s*\(in chat\)\s*$/, ''), answer: m[3] } : null;
    }).filter(Boolean);
  const openCalls = (after.file('_plan/QUEUE.md').split(/^## Answered\s*$/m)[0].match(/^### Q\d+ · .+$/gm) || []).map((h) => h.replace(/^### /, ''));
  const changes = after.file('_plan/CHANGELOG.md').split('\n').filter((l) => l.startsWith(`- ${day} · `)).map((l) => {
    const body = l.replace(/^- \S+ · /, ''); const tier = body.match(/· tier (\d)\s*$/)?.[1] || '0';
    return { text: body.replace(/\s*·\s*tier \d\s*$/, ''), tier: Number(tier) };
  });
  const filed = (after.file('_plan/findings/inbox.md').match(new RegExp(`^- ${day} · F\\d+ · `, 'gm')) || []).length;
  const ideas = after.list('_plan/ideas').filter((f) => /^I\d+-.*\.md$/.test(f)).map((f) => {
    const b = after.file(`_plan/ideas/${f}`); return { id: f.split('-')[0], status: b.match(/^\*\*Status:\*\*\s*([a-z]+)/m)?.[1] || '?', title: (b.match(/^# I\d+ · (.+)$/m)?.[1] || f).trim() };
  });
  const featureRows = (b) => (b.match(/^\| (?!Feature \||---)/gm) || []).length;

  return {
    day, ref, start: start.slice(0, 8), end: end.slice(0, 8), workPrs, holds, commits, prs, checks, runs, answered, openCalls, changes, filed, ideas,
    stages: { before: stageCounts(before), after: stageCounts(after) },
    inbox: { before: inboxCounts(before.file('_plan/findings/inbox.md')), after: inboxCounts(after.file('_plan/findings/inbox.md')) },
    features: { before: featureRows(before.file('_plan/FEATURES.md')), after: featureRows(after.file('_plan/FEATURES.md')) },
  };
}

const longDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
// A line's first clause, when it is long enough to say something on its own.
const short = (s, n = 120) => { const all = String(s), first = all.split(/: |; /)[0], t = first.length >= 40 ? first : all; return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

/** The page, from what `collect` read. Every text from git, GitHub or the plan is escaped. */
export function render(d) {
  const merged = (d.prs || []).filter((p) => p.merged);
  const gate = (d.checks || []).filter((c) => c.workflow === 'Gate');
  const gateOk = gate.filter((c) => c.conclusion === 'success').length, gateBad = gate.filter((c) => c.conclusion === 'failure');
  const before = Object.fromEntries(d.stages.before.map((s) => [s.n, s])), moved = d.stages.after.filter((s) => s.done !== (before[s.n]?.done ?? 0) || s.open !== (before[s.n]?.open ?? 0));
  const ticked = d.stages.after.reduce((n, s) => n + s.done, 0) - d.stages.before.reduce((n, s) => n + s.done, 0);
  const runsOk = d.runs.filter((r) => r.ok).length, numbered = d.answered.filter((a) => a.id), unnumbered = d.answered.length - numbered.length;
  const waitingIdeas = d.ideas.filter((i) => i.status === 'shaped');
  const recorded = d.commits.filter((c) => c.queue);

  const headline = [
    d.runs.length ? (runsOk === d.runs.length ? `${d.runs.length === 1 ? 'the upkeep run' : `all ${d.runs.length} upkeep runs`} ended on ${d.runs.length === 1 ? 'its' : 'their'} own` : `${d.runs.length - runsOk} of ${d.runs.length} upkeep runs did not finish`) : null,
    d.prs ? `${plural(merged.length, 'pull request')} merged` : `${plural(d.commits.length, 'commit')} reached master`,
    d.answered.length ? `${plural(d.answered.length, 'call')} settled` : null,
  ].filter(Boolean).join(', ');
  const tile = (k, v, s, warn) => `<div class="tile${warn ? ' warn' : ''}"><span class="k">${esc(k)}</span><span class="v num">${esc(v)}</span><span class="s">${esc(s)}</span></div>`;
  const lines = (n) => n.toLocaleString('en-GB');
  const tiles = [
    tile('Scheduled upkeep', d.runs.length ? `${runsOk} of ${d.runs.length} ended alone` : 'none logged', d.runs.map((r) => `${r.from}${r.seconds ? `, ${r.seconds} s` : ''}, ${r.kept || 'nothing kept'}`).join(' · ') || 'the run writes its log from 4 October', d.runs.length && runsOk < d.runs.length),
    tile('Calls settled', String(d.answered.length), `${numbered.length} from the queue, ${unnumbered} raised in chat`),
    tile('Pull requests merged', d.prs ? String(merged.length) : 'not read', d.prs ? `${lines(merged.reduce((n, p) => n + p.files, 0))} files, +${lines(merged.reduce((n, p) => n + p.add, 0))} / −${lines(merged.reduce((n, p) => n + p.del, 0))} lines` : 'GitHub was not read'),
    tile('Gate on GitHub', d.checks ? `${gateOk} runs passed · ${gateBad.length} failed` : 'not read', d.checks ? (gateBad.length ? `failed on ${[...new Set(gateBad.map((c) => c.branch))].join(', ')}` : 'every run passed') : 'GitHub was not read', gateBad.length),
    tile('Stage tasks done', `${ticked >= 0 ? '+' : ''}${ticked}`, moved.map((s) => `stage ${s.n}: ${s.done} of ${s.done + s.open}`).join(' · ') || 'no stage moved'),
    tile('Waiting on you', String(d.openCalls.length + waitingIdeas.length + (d.workPrs || []).length + d.holds.length), [d.openCalls.length ? plural(d.openCalls.length, 'call') : null, waitingIdeas.length ? plural(waitingIdeas.length, 'shaped idea') : null, (d.workPrs || []).length ? plural(d.workPrs.length, 'pull request to merge') : null, d.holds.length ? plural(d.holds.length, 'held task') : null].filter(Boolean).join(', ') || 'nothing', d.openCalls.length + waitingIdeas.length + (d.workPrs || []).length + d.holds.length > 0),
  ].join('\n');

  const timeline = JSON.stringify({
    runs: d.runs.map((r) => ({ from: r.from, to: r.to, label: `${r.work ? 'work run' : 'upkeep'}${r.seconds ? ` · ${Math.round(r.seconds / 60) >= 2 ? `${Math.round(r.seconds / 60)} min` : `${r.seconds} s`}` : ''}`, kind: r.ok ? 'ok' : 'warn' })),
    recorded: recorded.map((c) => c.time),
    commits: d.commits.map((c) => [c.time, c.kind]),
    prs: (d.prs || []).map((p) => ({ n: `#${p.number}`, from: p.opened, to: p.merged || p.opened, merged: !!p.merged })),
    failed: gateBad.map((c) => c.time),
  }).replace(/</g, '\\u003c');
  const bars = JSON.stringify(moved.map((s) => ({ name: `${s.n} · ${s.title}`, was: before[s.n]?.done ?? 0, now: s.done, total: s.done + s.open }))).replace(/</g, '\\u003c');
  const still = d.stages.after.filter((s) => !moved.includes(s));

  return `<title>Hub Day Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500&display=swap">
<style>
/* One sheet: the verdict and six figures, the day hour by hour, the plan's movement beside what readers got, the calls, who moves next. */
:root {
  --ground: #f4f2ee; --sheet: #fbfaf8; --ink: #1d1b19; --mute: #6c665e; --rule: #dcd6cc;
  --brass: #94743a; --plan: #5a6f86; --tool: #7a6a8c; --site: #94743a; --ok: #3f7a52; --warn: #a3651f; --bad: #a8473f;
  --display: "Playfair Display", "Didot", Georgia, serif; --ui: "Barlow", "Helvetica Neue", Arial, sans-serif; --label: "Barlow Condensed", "Barlow", "Arial Narrow", sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ground: #121110; --sheet: #191816; --ink: #ece6da; --mute: #a39b8e; --rule: #34302b; --brass: #c9a35e; --plan: #8ea6c2; --tool: #b4a3c9; --site: #c9a35e; --ok: #74b88a; --warn: #d9a05a; --bad: #e0857c; color-scheme: dark } }
:root[data-theme="dark"] { --ground: #121110; --sheet: #191816; --ink: #ece6da; --mute: #a39b8e; --rule: #34302b; --brass: #c9a35e; --plan: #8ea6c2; --tool: #b4a3c9; --site: #c9a35e; --ok: #74b88a; --warn: #d9a05a; --bad: #e0857c; color-scheme: dark }
body { background: var(--ground); color: var(--ink); font: 15px/1.5 var(--ui); padding-inline: 16px; padding-block: 24px 40px; }
main { max-width: 1080px; margin-inline: auto; display: grid; gap: 22px; }
h1 { font: 600 clamp(1.6rem, 3.4vw, 2.3rem)/1.1 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 500 0.78rem/1 var(--label); letter-spacing: 0.12em; text-transform: uppercase; color: var(--mute); margin: 0 0 10px; }
.num { font-variant-numeric: tabular-nums; }
.sheet { background: var(--sheet); border: 1px solid var(--rule); border-radius: 10px; padding: 18px 20px; min-width: 0; }
header { display: grid; gap: 8px; }
.date { font: 500 0.82rem/1 var(--label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--brass); }
.strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 18px; }
@media (max-width: 760px) { .strip { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.tile { border-left: 3px solid var(--ok); padding: 6px 0 6px 12px; display: grid; gap: 2px; min-width: 0; }
.tile.warn { border-color: var(--warn); }
.tile .k { font: 500 0.74rem/1.2 var(--label); letter-spacing: 0.1em; text-transform: uppercase; color: var(--mute); }
.tile .v { font: 600 1.35rem/1.15 var(--ui); }
.tile .s { font-size: 0.84rem; color: var(--mute); overflow-wrap: anywhere; }
.scroll { overflow-x: auto; }
svg text { fill: var(--mute); font: 500 11px var(--label); letter-spacing: 0.04em; }
svg .lane { fill: var(--ink); font: 600 11px var(--label); letter-spacing: 0.08em; text-transform: uppercase; }
svg .note { fill: var(--ink); font: 500 11.5px var(--ui); letter-spacing: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.82rem; color: var(--mute); margin-top: 8px; }
.legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 22px; }
@media (max-width: 760px) { .two { grid-template-columns: 1fr; } }
.bars { display: grid; gap: 12px; }
.bar { display: grid; grid-template-columns: 9rem minmax(0, 1fr) 4.6rem; gap: 10px; align-items: center; font-size: 0.86rem; }
.bar .track { position: relative; height: 12px; background: color-mix(in srgb, var(--rule) 60%, transparent); border-radius: 3px; }
.bar .was { position: absolute; inset-block: 0; left: 0; background: color-mix(in srgb, var(--plan) 45%, transparent); border-radius: 3px; }
.bar .gain { position: absolute; inset-block: 0; background: var(--brass); border-radius: 0 3px 3px 0; }
.bar .fig { text-align: right; color: var(--mute); }
.quiet { font-size: 0.84rem; color: var(--mute); margin: 10px 0 0; }
.counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
.counts div { border-top: 1px solid var(--rule); padding-top: 8px; }
.counts b { display: block; font: 600 1.25rem/1.1 var(--ui); }
.counts span { font-size: 0.8rem; color: var(--mute); }
ul.got { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; font-size: 0.88rem; }
ul.got li { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: 8px; }
.tier { font: 500 0.72rem/1.6 var(--label); letter-spacing: 0.08em; text-transform: uppercase; color: var(--mute); }
.tier.t2 { color: var(--brass); }
.calls { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px 18px; font-size: 0.86rem; margin: 0; }
.calls div { display: grid; gap: 1px; min-width: 0; }
.calls dt { font-weight: 600; }
.calls dd { margin: 0; color: var(--mute); }
.waits { display: grid; gap: 10px; }
.wait { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 12px; align-items: baseline; font-size: 0.9rem; }
.who { font: 500 0.74rem/1.4 var(--label); letter-spacing: 0.1em; text-transform: uppercase; text-align: center; border-radius: 3px; padding: 1px 6px; }
.who.you { background: var(--brass); color: var(--sheet); }
.who.me { border: 1px solid var(--rule); color: var(--mute); }
footer { font-size: 0.8rem; color: var(--mute); }
</style>
<main>
  <header>
    <div class="date">${esc(longDay(d.day))} · times are this Mac's</div>
    <h1>${esc(headline ? headline.charAt(0).toUpperCase() + headline.slice(1) : 'A quiet day: nothing reached master')}</h1>
  </header>
  <section class="strip" aria-label="The day at a glance">
${tiles}
  </section>
  <section class="sheet" aria-labelledby="t-time">
    <h2 id="t-time">The day, hour by hour</h2>
    <div class="scroll"><svg id="timeline" viewBox="0 0 1000 300" width="100%" style="min-width:660px" role="img" aria-label="The day's runs, calls recorded, commits, pull requests and failed gates, hour by hour"></svg></div>
    <div class="legend"><span><i style="background:var(--site)"></i>change a reader meets</span><span><i style="background:var(--plan)"></i>the plan</span><span><i style="background:var(--tool)"></i>tooling and tests</span><span><i style="background:var(--bad)"></i>gate failed on GitHub</span><span>Commits are those that reached master this day; one made on an earlier day sits at the hour it arrived${d.commits.some((c) => c.arrived) ? ` (${d.commits.filter((c) => c.arrived).length} this day)` : ''}.</span></div>
  </section>
  <div class="two">
    <section class="sheet" aria-labelledby="t-plan">
      <h2 id="t-plan">How far the plan moved</h2>
      <div class="bars" id="bars"></div>
      <p class="quiet">${moved.length ? '' : 'No stage moved. '}${still.length ? `Unmoved: ${esc(still.map((s) => `${s.n} (${s.done} of ${s.done + s.open})`).join(', '))}.` : ''} Pale is where the day began.</p>
      <div class="counts">
        <div><b class="num">${d.inbox.before.waiting} → ${d.inbox.after.waiting}</b><span>findings waiting; ${d.filed} filed this day</span></div>
        <div><b class="num">${d.answered.length}</b><span>calls settled: ${numbered.length} from the queue, ${unnumbered} raised in chat</span></div>
        <div><b class="num">${d.features.before} → ${d.features.after}</b><span>features on the map</span></div>
      </div>
    </section>
    <section class="sheet" aria-labelledby="t-got">
      <h2 id="t-got">What readers got</h2>
      ${d.changes.length ? `<ul class="got">${d.changes.map((c) => `<li><span class="tier${c.tier === 2 ? ' t2' : ''}">tier ${c.tier}</span><span>${esc(short(c.text))}</span></li>`).join('')}</ul>` : '<p class="quiet">Nothing new for readers this day.</p>'}
    </section>
  </div>
  <section class="sheet" aria-labelledby="t-calls">
    <h2 id="t-calls">What you decided</h2>
    ${d.answered.length ? `<dl class="calls">${d.answered.map((a) => `<div><dt>${esc(a.id ? `${a.id} · ${a.answer.split(':')[0].slice(0, 3)}` : 'In chat')}</dt><dd>${esc(short(a.id ? a.answer.replace(/^[A-Z]:\s*/, '') : a.question, 110))}</dd></div>`).join('')}</dl>` : '<p class="quiet">No call was settled this day.</p>'}
  </section>
  <section class="sheet" aria-labelledby="t-wait">
    <h2 id="t-wait">Who moves next</h2>
    <div class="waits">
      ${(d.workPrs || []).map((p) => `<div class="wait"><span class="who you">You</span><span>Merge or close #${p.number}: ${esc(p.title)}${p.days ? ` (waiting ${plural(p.days, 'day')}${p.days >= 3 ? '; the work run is paused until it is settled' : ''})` : ''}</span></div>`).join('')}
      ${d.holds.map((h) => `<div class="wait"><span class="who you">You</span><span>Held by the work run, ${esc(h.key)}: ${esc(h.why || 'it needs your choice')}</span></div>`).join('')}
      ${d.openCalls.map((q) => `<div class="wait"><span class="who you">You</span><span>${esc(q)}</span></div>`).join('')}
      ${waitingIdeas.map((i) => `<div class="wait"><span class="who you">You</span><span>${esc(`${i.id} · ${i.title}`)}: shaped, waiting for your decision</span></div>`).join('')}
      ${d.ideas.filter((i) => i.status === 'raw').map((i) => `<div class="wait"><span class="who me">Claude</span><span>${esc(`${i.id} · ${i.title}`)}: raw, to be shaped, tried and challenged</span></div>`).join('')}
      <div class="wait"><span class="who me">Claude</span><span>${d.inbox.after.waiting} findings waiting in the inbox${d.stages.after.find((s) => /^building/.test(s.status)) ? `; stage ${d.stages.after.filter((s) => /^building/.test(s.status)).map((s) => `${s.n} has ${s.open} open`).join(', stage ')}` : ''}.</span></div>
    </div>
  </section>
  <footer>Read from ${esc(d.ref)} (${esc(d.start || 'the start')} to ${esc(d.end)})${d.prs ? ', GitHub' : ''}${d.runs.length ? ' and the daily run’s log' : ''}. Built by <code>scripts/hub-brief.mjs</code>.</footer>
</main>
<script>
(function () {
  var day = ${timeline}, stages = ${bars};
  var t = function (s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; };
  var all = [].concat(day.runs.map(function (r) { return t(r.from); }), day.commits.map(function (c) { return t(c[0]); }), day.prs.map(function (p) { return t(p.from); }), day.prs.map(function (p) { return t(p.to); }), day.failed.map(t), day.recorded.map(t));
  var lo = all.length ? Math.max(0, Math.floor(Math.min.apply(null, all) / 60) * 60) : 0, hi = all.length ? Math.min(1440, Math.ceil((Math.max.apply(null, all) + 1) / 60) * 60) : 1440;
  if (hi - lo < 480) { lo = Math.max(0, hi - 480); hi = Math.max(hi, lo + 480); }
  var X0 = 150, X1 = 985, x = function (m) { return Math.max(X0, X0 + (m - lo) / (hi - lo) * (X1 - X0)); };
  var NS = "http://www.w3.org/2000/svg", svg = document.getElementById("timeline");
  var el = function (n, a, txt) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; svg.appendChild(e); return e; };
  var css = function (v) { return "var(--" + v + ")"; };
  var step = (hi - lo) > 720 ? 3 : 2;
  for (var h = lo / 60; h <= hi / 60; h++) {
    var gx = x(h * 60); el("line", { x1: gx, x2: gx, y1: 24, y2: 280, stroke: css("rule"), "stroke-width": h % step ? 0.5 : 1 });
    if (h % step === 0) el("text", { x: gx, y: 16, "text-anchor": "middle" }, String(h).padStart(2, "0") + ":00");
  }
  [["Scheduled runs", 46], ["Calls recorded", 94], ["Commits", 142], ["Pull requests", 196], ["Gate failed", 262]].forEach(function (l) { el("text", { x: 0, y: l[1] + 4, class: "lane" }, l[0]); });
  day.runs.forEach(function (r) {
    var a = x(t(r.from)), b = Math.max(x(t(r.to)), a + 4); el("rect", { x: a, y: 38, width: b - a, height: 16, rx: 2, fill: css(r.kind) });
    var right = b + 6 + r.label.length * 6 > X1; el("text", { x: right ? a - 6 : b + 6, y: 50, "text-anchor": right ? "end" : "start", class: "note" }, r.label);
  });
  day.recorded.forEach(function (m) { el("rect", { x: x(t(m)) - 3, y: 91, width: 6, height: 6, fill: css("plan") }); });
  // At most four dots a minute in the lane; more arrive together with a merge, and are counted beside them.
  var seen = {}; day.commits.forEach(function (c) { var k = c[0], n = seen[k] = (seen[k] || 0) + 1; if (n <= 4) el("circle", { cx: x(t(k)), cy: 148 - (n - 1) * 8, r: 4, fill: css(c[1]) }); });
  Object.keys(seen).forEach(function (k) { if (seen[k] > 4) el("text", { x: x(t(k)) + 7, y: 128, class: "note" }, "+" + (seen[k] - 4)); });
  day.prs.forEach(function (p, i) {
    var a = x(t(p.from)), b = Math.max(x(t(p.to)), a + 3), y = 180 + (i % 5) * 9;
    el("line", { x1: a, x2: b, y1: y, y2: y, stroke: css("brass"), "stroke-width": 3, "stroke-linecap": "round" });
    if (p.merged) el("circle", { cx: b, cy: y, r: 3.5, fill: css("ok") });
    var right = b + 8 + p.n.length * 7 > X1; el("text", { x: right ? a - 6 : b + 7, y: y + 4, "text-anchor": right ? "end" : "start", class: "note" }, p.n);
  });
  day.failed.forEach(function (m) { var fx = x(t(m)); el("line", { x1: fx, x2: fx, y1: 252, y2: 272, stroke: css("bad"), "stroke-width": 2.5 }); });
  var bars = document.getElementById("bars");
  stages.forEach(function (s) {
    var row = document.createElement("div"); row.className = "bar";
    row.innerHTML = '<span class="name"></span><span class="track"><span class="was"></span><span class="gain"></span></span><span class="fig num"></span>';
    var w = s.total ? s.was / s.total * 100 : 0, n = s.total ? s.now / s.total * 100 : 0;
    row.querySelector(".name").textContent = s.name;
    row.querySelector(".was").style.width = Math.min(w, n) + "%";
    var g = row.querySelector(".gain"); g.style.left = Math.min(w, n) + "%"; g.style.width = Math.abs(n - w) + "%";
    row.querySelector(".fig").textContent = s.now + " / " + s.total;
    bars.appendChild(row);
  });
})();
</script>
`;
}

// The command.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), flag = (k, dflt) => { const i = args.indexOf(`--${k}`); return i < 0 ? dflt : args[i + 1]; };
  const asked = flag('day', 'yesterday');
  const day = asked === 'yesterday' ? localDay(new Date(Date.now() - 86400000)) : asked === 'today' ? localDay(new Date()) : asked;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || localDay(new Date(`${day}T12:00:00`)) !== day) { console.error('--day takes a real YYYY-MM-DD, today or yesterday.'); process.exit(2); }
  const hasOrigin = (() => { try { execFileSync('git', ['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/master'], { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; } })();
  const data = collect({ day, ref: flag('ref', hasOrigin ? 'origin/master' : 'master'), runsLog: flag('runs', null) });
  if (!data) { console.error(`${day}: the history holds nothing before the day's end.`); process.exit(2); }
  const out = path.resolve(flag('out', path.join(ROOT, 'design/hub/brief.html')));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, render(data));
  console.log(`Brief for ${day}: ${data.commits.length} commit(s), ${data.prs ? data.prs.length : 'no'} pull request(s), ${data.runs.length} upkeep run(s), ${data.answered.length} call(s) settled.`);
  console.log(`Publish: ${out}`);
}
