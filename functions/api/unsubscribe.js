/**
 * GET /api/unsubscribe?token=<uuid> — Cloudflare Pages Function.
 *
 * Marks the matching subscriber as unsubscribed. Token-based so the link can
 * sit in any future letter without authentication; idempotent so clicking an
 * old link twice is harmless. The address itself never appears in the URL.
 */

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function htmlPage(title, line, status) {
  const body =
    "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>" +
    "<title>" + title + "</title>" +
    "<body style='margin:0;background:#151515;color:#e4e5e5;font-family:Didot,\"Playfair Display\",serif;" +
    "display:grid;place-items:center;min-height:100vh;text-align:center;padding:2rem'>" +
    "<div><p style='color:#c3b498;font-size:1.3rem;font-style:italic;margin:0 0 0.75rem'>" + title + "</p>" +
    "<p style='margin:0;opacity:0.75'>" + line + "</p>" +
    "<p style='margin-top:2rem'><a href='/' style='color:#c3b498'>Back to the house</a></p></div>";
  return new Response(body, {
    status: status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const token = (url.searchParams.get("token") || "").trim();

  if (!TOKEN_RE.test(token)) {
    return htmlPage("That link is incomplete.", "The unsubscribe link seems damaged — copy it whole from the letter.", 400);
  }

  let result;
  try {
    result = await context.env.SUBSCRIBERS.prepare(
      "UPDATE subscribers SET status = 'unsubscribed', " +
      "unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') " +
      "WHERE token = ?1 AND status = 'active'"
    ).bind(token).run();
  } catch (_) {
    return htmlPage("That didn’t go through.", "The house apologises. Try the link once more.", 500);
  }

  if (result.meta && result.meta.changes > 0) {
    return htmlPage("Unsubscribed.", "No more letters. The door stays open.", 200);
  }
  return htmlPage("Nothing to do.", "This link was already used, or the address is no longer on the list.", 200);
}
