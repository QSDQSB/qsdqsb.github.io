/**
 * A fingerprint of the plan: every Markdown file under `_plan/` (not `private/`, not `hub.json`,
 * which records the fingerprint itself). `plan.mjs published` stores it when the command centre is
 * republished; `check-plan.mjs` compares, so the brief can say the page is behind the plan.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function planHash(planDir) {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'private') return [];
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : full.endsWith('.md') ? [full] : [];
  });
  const hash = crypto.createHash('sha256');
  for (const f of walk(planDir).sort()) hash.update(path.relative(planDir, f)).update('\0').update(fs.readFileSync(f)).update('\0');
  return hash.digest('hex').slice(0, 16);
}
