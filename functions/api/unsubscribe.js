/**
 * GET /api/unsubscribe?token=<uuid> — Cloudflare Pages Function.
 *
 * Marks the matching subscriber as unsubscribed. Token-based so the link can
 * sit in any future letter without authentication; idempotent so clicking an
 * old link twice is harmless. The address itself never appears in the URL.
 */

import { htmlPage, UNSUBSCRIBE_SQL } from "./_lib.js";

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribeByToken(env, token) {
  if (!TOKEN_RE.test(token)) return "bad_token";
  try {
    const result = await env.SUBSCRIBERS.prepare(UNSUBSCRIBE_SQL).bind(token).run();
    return result.meta && result.meta.changes > 0 ? "done" : "noop";
  } catch (_) {
    return "error";
  }
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const outcome = await unsubscribeByToken(context.env, token);

  if (outcome === "bad_token") {
    return htmlPage("That link is incomplete.", "The unsubscribe link seems damaged — copy it whole from the letter.", 400);
  }
  if (outcome === "error") {
    return htmlPage("That didn’t go through.", "The house apologises. Try the link once more.", 500);
  }
  if (outcome === "done") {
    return htmlPage("Unsubscribed.", "No more letters. The door stays open.", 200);
  }
  return htmlPage("Nothing to do.", "This link was already used, or the address is no longer on the list.", 200);
}

// RFC 8058 one-click unsubscribe: mailbox providers (Gmail, Yahoo…) POST to
// the List-Unsubscribe URL when the reader taps their native Unsubscribe
// button. No body parsing needed — the token is in the query string, and the
// action must succeed without any human confirmation step.
export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const outcome = await unsubscribeByToken(context.env, token);

  if (outcome === "bad_token") return new Response("bad token", { status: 400 });
  if (outcome === "error") return new Response("retry", { status: 500 });
  return new Response("ok", { status: 200 });
}
