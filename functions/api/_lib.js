/**
 * Shared validation helpers for the subscription Pages Functions.
 *
 * CommonJS on purpose: Cloudflare's Functions bundler (esbuild) interops with
 * CJS transparently, and the repo's node:test suite (CJS) can require() this
 * file directly. The leading underscore keeps it out of Pages routing.
 */
"use strict";

// Pragmatic shape check, not RFC 5322: one @, a dot in the domain, no spaces.
// The real gate is the confirmation implicit in delivery — a bad address
// simply never receives anything.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(raw) {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

// Only a site-relative path is ever stored as the subscription source.
function normalizeSource(raw) {
  if (typeof raw !== "string") return null;
  const source = raw.trim();
  if (!source.startsWith("/") || source.startsWith("//") || source.length > 200) return null;
  return source;
}

function isHoneypotTripped(payload) {
  return typeof payload.website === "string" && payload.website.trim() !== "";
}

// Fresh token on first insert; a resubscribe from an unsubscribed row reactivates it and keeps its
// original token, so previously sent unsubscribe links stay valid. The `WHERE status <> 'active'`
// guard leaves an ALREADY active address untouched and RETURNING yields no row, so the welcome
// fires only for new or returning subscribers, not for someone who submits the form twice.
// Needs a UNIQUE constraint on subscribers.email.
const SUBSCRIBE_SQL =
  "INSERT INTO subscribers (email, token, status, source) VALUES (?1, ?2, 'active', ?3) " +
  "ON CONFLICT(email) DO UPDATE SET status = 'active', unsubscribed_at = NULL " +
  "WHERE subscribers.status <> 'active' " +
  "RETURNING token";

const UNSUBSCRIBE_SQL =
  "UPDATE subscribers SET status = 'unsubscribed', " +
  "unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') " +
  "WHERE token = ?1 AND status = 'active'";

// Minimal dark page for the no-JS paths (the form's fallback, the unsubscribe link).
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

module.exports = { normalizeEmail, normalizeSource, isHoneypotTripped, htmlPage, SUBSCRIBE_SQL, UNSUBSCRIBE_SQL };
