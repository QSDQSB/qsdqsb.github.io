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
 *
 * On a genuinely NEW or REACTIVATED subscription it also sends the welcome
 * letter (scripts/letter-template.mjs) through Resend, in the background via
 * waitUntil so the form response stays instant. A failed send never fails the
 * subscription — the address is already saved; the letter is best-effort.
 * Requires RESEND_API_KEY bound to the deployed function (a Cloudflare secret;
 * for local `wrangler pages dev`, a .dev.vars file). Without it, the row is
 * still stored and no email is attempted.
 */
import { normalizeEmail, normalizeSource, isHoneypotTripped } from "./_lib.js";
import {
  renderWelcomeHtml,
  renderWelcomeText,
  LOGO_CID,
  WELCOME_SUBJECT,
} from "../../scripts/letter-template.mjs";
import { CREST_BASE64 } from "./_crest.js";

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

/**
 * Send the welcome letter to one fresh subscriber. Best-effort: any failure is
 * swallowed so it can never bubble into the subscription response. The crest
 * rides inline (Content-ID) exactly as the manual sender does, so opening the
 * letter fetches nothing remote.
 */
async function sendWelcome(env, toEmail, token) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return; // no secret bound (e.g. a preview without it) — skip quietly
  const siteUrl = (env.SITE_URL || "https://qsdqsb.com").replace(/\/$/, "");
  const from = env.LETTERS_FROM || "QSD <scripta@qsdqsb.com>";
  const unsub = `${siteUrl}/api/unsubscribe?token=${token}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: [toEmail],
        subject: WELCOME_SUBJECT,
        html: renderWelcomeHtml({ siteUrl: siteUrl }, unsub),
        text: renderWelcomeText({ siteUrl: siteUrl }, unsub),
        attachments: [
          { filename: "qsd-hexagon.png", content: CREST_BASE64, content_id: LOGO_CID },
        ],
        headers: {
          // One-click unsubscribe (RFC 8058), same as the letters.
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
  } catch (_) {
    // A failed welcome must never affect the subscription. Swallow it.
  }
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

  let row;
  try {
    // Fresh token on first insert; a resubscribe from an unsubscribed row
    // reactivates it and keeps its original token, so previously sent
    // unsubscribe links stay valid. The `WHERE status <> 'active'` guard means
    // an address that is ALREADY active is left untouched and RETURNING yields
    // no row — so the welcome fires only for new or returning subscribers, not
    // for someone who submits the form twice.
    row = await context.env.SUBSCRIBERS.prepare(
      "INSERT INTO subscribers (email, token, status, source) VALUES (?1, ?2, 'active', ?3) " +
      "ON CONFLICT(email) DO UPDATE SET status = 'active', unsubscribed_at = NULL " +
      "WHERE subscribers.status <> 'active' " +
      "RETURNING token"
    ).bind(email, crypto.randomUUID(), source).first();
  } catch (_) {
    return isForm
      ? htmlPage("That didn’t go through.", "QSD apologises. Try once more.", 500)
      : json({ ok: false, error: "server_error" }, 500);
  }

  // New or reactivated → welcome them, in the background so the response is
  // instant and a slow/failing mail send never delays or breaks the signup.
  if (row && row.token) {
    context.waitUntil(sendWelcome(context.env, email, row.token));
  }

  return ok;
}
