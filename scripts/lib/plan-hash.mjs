/**
 * A fingerprint of the plan: every Markdown file under `_plan/` (not `private/`, not `hub.json`,
 * which records the fingerprint itself). `plan.mjs published` stores it when the command centre is
 * republished; `check-plan.mjs` compares, so the brief can say the page is behind the plan.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { KINDS } from './plan-entries.mjs';

export function planHash(planDir) {
  // The four running lists' documents are rendered from their folders: the folders are hashed, not them.
  const derived = new Set(Object.values(KINDS).filter((k) => fs.existsSync(path.join(planDir, k.dir))).map((k) => path.join(planDir, k.doc)));
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'private') return [];
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : full.endsWith('.md') && !derived.has(full) ? [full] : [];
  });
  const hash = crypto.createHash('sha256');
  for (const f of walk(planDir).sort()) hash.update(path.relative(planDir, f)).update('\0').update(fs.readFileSync(f)).update('\0');
  return hash.digest('hex').slice(0, 16);
}
