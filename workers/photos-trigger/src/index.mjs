/**
 * Queue consumer for R2 event notifications on the originals bucket.
 * Collects the galleries touched by a batch of uploads or deletions and
 * asks GitHub to run the processing workflow once for all of them.
 *
 * Ignored: anything under trash/, dotfiles (the processor's own
 * .private.json writes would otherwise trigger a second run), and keys that
 * are not images.
 */

const IMAGE_RE = /\.(jpe?g|png|tiff?|webp|heic)$/i;

export function galleriesFrom(messages) {
  const out = new Set();
  for (const m of messages) {
    const key = m.body?.object?.key;
    if (!key || key.startsWith('trash/') || !IMAGE_RE.test(key)) continue;
    const parts = key.split('/');
    if (parts.length < 2 || parts.some(p => p.startsWith('.'))) continue;
    out.add(parts.slice(0, -1).join('/'));
  }
  return [...out].sort();
}

export default {
  async queue(batch, env) {
    const galleries = galleriesFrom(batch.messages);
    if (!galleries.length) { batch.ackAll(); return; }

    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'qsdqsb-photos-trigger',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'photos-uploaded', client_payload: { galleries } }),
    });
    if (res.status === 204) { batch.ackAll(); return; }
    // Anything else: let the queue retry the whole batch.
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub dispatch failed: ${res.status} ${text.slice(0, 200)}`);
  },
};
