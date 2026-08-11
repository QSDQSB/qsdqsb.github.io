/**
 * POST /api/subscribe — Cloudflare Pages Function.
 *
 * Stores an email address in the `qsdqsb-subscribers` D1 database (binding
 * `SUBSCRIBERS`, declared in wrangler.toml). Privacy posture: the row is
 * email + unsubscribe token + status + source path + timestamps — no IPs,
 * no user agents, no third-party service ever sees the address.
 *
 * Accepts JSON (the subscribe-slip JS) or form-encoded (no-JS fallback).
 * Success responses are identical for new and already-subscribed addresses,
 * so the endpoint cannot be used to probe who is on the list.
 */
import { normalizeEmail, normalizeSource, isHoneypotTripped } from "./_lib.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(body, status) {
  return new Response(JSON.stringify(body), { status: status, headers: JSON_HEADERS });
}

// Minimal dark page for the no-JS form submission path.
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

async function readPayload(request) {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (type.includes("application/json")) {
    return { data: await request.json(), isForm: false };
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData();
    return { data: Object.fromEntries(form.entries()), isForm: true };
  }
  return { data: null, isForm: false };
}

export async function onRequestPost(context) {
  let payload;
  try {
    payload = await readPayload(context.request);
  } catch (_) {
    payload = { data: null, isForm: false };
  }
  const data = payload.data;
  const isForm = payload.isForm;
  if (!data) return json({ ok: false, error: "bad_request" }, 400);

  const ok = isForm
    ? htmlPage("Subscribed.", "You’ll hear when something new is published.", 200)
    : json({ ok: true }, 200);

  // Honeypot field filled → almost certainly a bot. Pretend success, store nothing.
  if (isHoneypotTripped(data)) return ok;

  const email = normalizeEmail(data.email);
  if (!email) {
    return isForm
      ? htmlPage("That address doesn’t look right.", "Go back and try once more.", 400)
      : json({ ok: false, error: "invalid_email" }, 400);
  }
  const source = normalizeSource(data.source);

  try {
    // Fresh token on first insert; a resubscribe reactivates the existing row
    // and keeps its original token, so previously sent unsubscribe links stay valid.
    await context.env.SUBSCRIBERS.prepare(
      "INSERT INTO subscribers (email, token, status, source) VALUES (?1, ?2, 'active', ?3) " +
      "ON CONFLICT(email) DO UPDATE SET status = 'active', unsubscribed_at = NULL"
    ).bind(email, crypto.randomUUID(), source).run();
  } catch (_) {
    return isForm
      ? htmlPage("That didn’t go through.", "The house apologises. Try once more.", 500)
      : json({ ok: false, error: "server_error" }, 500);
  }

  return ok;
}
