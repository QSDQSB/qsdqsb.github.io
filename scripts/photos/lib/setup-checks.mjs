/**
 * Is the pipeline wired up? One probe per link in the chain, each cheap,
 * read-only, and bounded by a timeout, so the dashboard can show the
 * Cloudflare setup filling in step by step:
 *
 *   rclone     the `r2` remote exists on this machine
 *   bucket     the originals bucket answers a listing
 *   domain     img.qsdqsb.com serves a processed gallery's manifest
 *   secrets    the four repository secrets the workflow needs exist (names only)
 *   worker     a processing run was started by the Worker (repository_dispatch)
 *   workflow   the last processing run, and how it ended
 *
 * Each result is { id, label, state: 'ok'|'todo'|'fail', detail }.
 * 'todo' is a step not done yet; 'fail' is a step done but not working.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env, PATHS } from './config.mjs';
import { rcloneVersion, remoteExists } from './rclone.mjs';

/** A gallery the last photos:fetch saw processed, to probe the public domain with. */
function processedGallery() {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(PATHS.mergedDir, '_index.json'), 'utf8'));
    return Object.entries(idx.galleries || {}).find(([, s]) => s.processed)?.[0] || null;
  } catch { return null; }
}

export const REQUIRED_SECRETS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'CF_PAGES_DEPLOY_HOOK'];
const WORKFLOW = 'photos-process.yml';

const sh = (cmd, args, timeout = 15000) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || r.error?.message || '').trim() };
};

/** Pure: which required secrets a `gh secret list --json name` answer lacks. */
export function missingSecrets(listJson) {
  let names = [];
  try { names = JSON.parse(listJson || '[]').map(s => s.name); } catch { /* treat as none */ }
  return REQUIRED_SECRETS.filter(n => !names.includes(n));
}

/** Pure: a `gh run list --json …` answer → the workflow check. */
export function workflowCheck(runsJson) {
  let runs = [];
  try { runs = JSON.parse(runsJson || '[]'); } catch { /* none */ }
  const last = runs[0];
  if (!last) return { state: 'todo', detail: 'never run' };
  const when = String(last.createdAt || '').slice(0, 16).replace('T', ' ');
  if (last.status !== 'completed') return { state: 'ok', detail: `${last.status} since ${when} (${last.event})` };
  return { state: last.conclusion === 'success' ? 'ok' : 'fail', detail: `${last.conclusion} ${when} (${last.event})` };
}

export async function setupChecks({ offline = false } = {}) {
  const out = [];
  const add = (id, label, state, detail) => out.push({ id, label, state, detail });

  const remote = !!rcloneVersion() && remoteExists(env.rcloneRemote);
  add('rclone', `rclone remote ${env.rcloneRemote}:`, remote ? 'ok' : 'todo', remote ? 'configured' : 'run rclone config');

  if (!remote || offline) add('bucket', env.originalsBucket, 'todo', offline ? 'not checked (--offline)' : 'needs the rclone remote');
  else {
    const r = sh('rclone', ['lsf', '--max-depth', '1', `${env.rcloneRemote}:${env.originalsBucket}`]);
    add('bucket', env.originalsBucket, r.ok ? 'ok' : 'fail', r.ok ? `${r.out ? r.out.split('\n').length : 0} top-level entr(ies)` : r.err.split('\n').pop().slice(0, 90));
  }

  if (offline) add('domain', new URL(env.publicBase).host, 'todo', 'not checked (--offline)');
  else {
    // The bare root is always 404 (nothing lives there), so ask for a real
    // manifest: a processed gallery's, else just prove DNS, TLS and R2 answer.
    const host = new URL(env.publicBase).host;
    const probe = processedGallery();
    try {
      const url = probe ? `${env.publicBase}/${probe}/manifest.json` : `${env.publicBase}/`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (probe && r.ok) {
        const m = await r.json().catch(() => null);
        add('domain', host, 'ok', `serves ${probe}/manifest.json (${m?.photos?.length ?? '?'} photos)`);
      } else if (probe) add('domain', host, 'fail', `${probe}/manifest.json answered HTTP ${r.status}`);
      else add('domain', host, 'ok', 'reachable; no gallery processed yet to fetch');
    } catch (e) {
      add('domain', host, 'todo', (e.cause?.code || e.name || 'unreachable').toString());
    }
  }

  const gh = sh('gh', ['secret', 'list', '--json', 'name']);
  if (!gh.ok) add('secrets', 'GitHub secrets', 'todo', 'gh not signed in');
  else {
    const missing = missingSecrets(gh.out);
    add('secrets', 'GitHub secrets', missing.length ? 'todo' : 'ok', missing.length ? `missing ${missing.join(', ')}` : `all ${REQUIRED_SECRETS.length} set`);
  }

  const fields = 'status,conclusion,createdAt,event';
  const byWorker = sh('gh', ['run', 'list', '--workflow', WORKFLOW, '--event', 'repository_dispatch', '-L', '1', '--json', fields]);
  const w = workflowCheck(byWorker.ok ? byWorker.out : '[]');
  add('worker', 'Worker → workflow', w.detail === 'never run' ? 'todo' : 'ok', w.detail === 'never run' ? 'has not fired yet' : `last fired ${w.detail.replace(/ \(repository_dispatch\)$/, '')}`);

  const runs = sh('gh', ['run', 'list', '--workflow', WORKFLOW, '-L', '1', '--json', fields]);
  const wf = workflowCheck(runs.ok ? runs.out : '[]');
  add('workflow', 'last processing run', wf.state, wf.detail);
  return out;
}
