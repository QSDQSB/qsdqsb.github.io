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

module.exports = { normalizeEmail, normalizeSource, isHoneypotTripped };
