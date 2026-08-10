#!/usr/bin/env node
/**
 * send-letter.mjs — render and send a letter to the subscriber ledger.
 *
 *   node scripts/send-letter.mjs <post.md> [options]
 *
 * Reads title/excerpt/permalink from the post's frontmatter, renders the
 * letter (scripts/letter-template.mjs), and:
 *
 *   default            → PREVIEW ONLY. Writes letter-preview.html/.txt to a
 *                        temp dir and prints the paths + recipient count.
 *                        Nothing is sent.
 *   --send-test <addr> → sends ONE letter to <addr> (dummy unsubscribe token).
 *   --send --yes       → sends to every ACTIVE subscriber in D1, one email
 *                        per recipient, each carrying that subscriber's own
 *                        /api/unsubscribe?token=… link and a List-Unsubscribe
 *                        one-click header. --send without --yes just prints
 *                        what would happen.
 *
 * Overrides: --title "…" --excerpt "…" --url https://… --subject "…"
 *
 * Requirements:
 *   RESEND_API_KEY   in the environment (never in the repo).
 *   `npx wrangler login` done once — the script reads subscribers via
 *   `wrangler d1 execute qsdqsb-subscribers --remote` (no extra tokens).
 *
 * Env knobs: LETTERS_FROM ("QSD <letters@qsdqsb.com>"), SITE_URL
 * (https://qsdqsb.com), RESEND_SEND_DELAY_MS (700).
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { renderLetterHtml, renderLetterText } from "./letter-template.mjs";

const SITE_URL = (process.env.SITE_URL || "https://qsdqsb.com").replace(/\/$/, "");
const FROM = process.env.LETTERS_FROM || "QSD <letters@qsdqsb.com>";
const D1_NAME = "qsdqsb-subscribers";
const SEND_DELAY_MS = Number(process.env.RESEND_SEND_DELAY_MS || 700);

/* ---------- CLI ---------- */

const args = process.argv.slice(2);
function takeFlag(name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  args.splice(i, 1);
  return true;
}
function takeOption(name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const v = args[i + 1];
  if (v === undefined) fail(`${name} needs a value`);
  args.splice(i, 2);
  return v;
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const optSend = takeFlag("--send");
const optYes = takeFlag("--yes");
const optSendTest = takeOption("--send-test");
const optTitle = takeOption("--title");
const optExcerpt = takeOption("--excerpt");
const optUrl = takeOption("--url");
const optSubject = takeOption("--subject");
const postPath = args.find((a) => !a.startsWith("--")) || null;

if (!postPath && !(optTitle && optUrl)) {
  fail("usage: node scripts/send-letter.mjs <post.md> [--send-test addr | --send --yes] [--title/--excerpt/--url/--subject overrides]");
}

/* ---------- frontmatter (minimal: quoted/plain scalars only) ---------- */

function parseFrontmatter(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) fail(`no frontmatter found in ${file}`);
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+)\s*:\s*(.+)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[kv[1]] = v;
  }
  return out;
}

let fm = {};
if (postPath) fm = parseFrontmatter(postPath);

const title = optTitle || fm.title || fail("post has no title: — pass --title");
const excerpt = optExcerpt ?? (fm.seo_description || fm.excerpt || fm.description || "");
let url = optUrl;
if (!url) {
  if (fm.permalink) url = SITE_URL + fm.permalink;
  else fail("post has no permalink: — pass --url (voyage/subvoyage routes are config-derived)");
}
const subject = optSubject || title;
const dateLine = fm.date
  ? new Date(fm.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  : "";

const letter = { title, excerpt, url, dateLine };
const unsubscribeUrlFor = (token) => `${SITE_URL}/api/unsubscribe?token=${token}`;

/* ---------- subscribers via wrangler d1 ---------- */

function fetchActiveSubscribers() {
  let out;
  try {
    out = execFileSync(
      "npx",
      ["wrangler", "d1", "execute", D1_NAME, "--remote", "--json",
       "--command", "SELECT email, token FROM subscribers WHERE status = 'active' ORDER BY subscribed_at;"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (e) {
    fail(`could not read subscribers (is \`npx wrangler login\` done?): ${e.message}`);
  }
  // wrangler prints a JSON array of result objects; tolerate leading noise.
  const jsonStart = out.indexOf("[");
  const parsed = JSON.parse(out.slice(jsonStart));
  return parsed[0].results;
}

/* ---------- Resend ---------- */

async function resendSend(to, token) {
  const unsub = unsubscribeUrlFor(token);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: subject,
      html: renderLetterHtml(letter, unsub),
      text: renderLetterText(letter, unsub),
      headers: {
        // One-click unsubscribe (RFC 8058): mailbox providers surface their
        // own Unsubscribe button and POST to this recipient's personal URL.
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return resendSend(to, token);
  }
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- modes ---------- */

console.log(`Letter: “${title}”`);
console.log(`Link:   ${url}`);
console.log(`From:   ${FROM}\n`);

if (optSendTest) {
  if (!process.env.RESEND_API_KEY) fail("RESEND_API_KEY is not set");
  const r = await resendSend(optSendTest, "00000000-0000-4000-8000-000000000000");
  console.log(`✓ test letter sent to ${optSendTest} (id ${r.id})`);
  console.log("  (its unsubscribe link uses a dummy token and will report “Nothing to do.”)");
} else if (optSend) {
  if (!process.env.RESEND_API_KEY) fail("RESEND_API_KEY is not set");
  const subs = fetchActiveSubscribers();
  console.log(`Active subscribers: ${subs.length}`);
  if (!optYes) {
    console.log("\nDry run — pass --yes to actually send.");
    process.exit(0);
  }
  let sent = 0;
  const failed = [];
  for (const s of subs) {
    try {
      await resendSend(s.email, s.token);
      sent += 1;
      process.stdout.write(`  sent ${sent}/${subs.length}\r`);
    } catch (e) {
      failed.push({ email: s.email, error: String(e.message).slice(0, 120) });
    }
    await sleep(SEND_DELAY_MS);
  }
  console.log(`\n✓ sent ${sent}/${subs.length}`);
  if (failed.length) {
    console.log(`✗ failed ${failed.length}:`);
    for (const f of failed) console.log(`   ${f.email} — ${f.error}`);
    process.exit(1);
  }
} else {
  const dir = mkdtempSync(join(tmpdir(), "qsd-letter-"));
  const stem = postPath ? basename(postPath).replace(/\.md$/, "") : "letter";
  const htmlPath = join(dir, `${stem}.preview.html`);
  const textPath = join(dir, `${stem}.preview.txt`);
  const previewUnsub = unsubscribeUrlFor("«personal-token-per-recipient»");
  writeFileSync(htmlPath, renderLetterHtml(letter, previewUnsub));
  writeFileSync(textPath, renderLetterText(letter, previewUnsub));
  console.log("Preview only — nothing sent.");
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  Text: ${textPath}`);
  console.log("\nNext: --send-test you@example.com, then --send --yes.");
}
