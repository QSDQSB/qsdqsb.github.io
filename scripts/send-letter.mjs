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
 * --kicker "…"       → the small line above the title, saying what has come. By
 *                      default "Fresh ink from QSD" for a post, "New prints from
 *                      QSD" for a voyage or a part of one.
 * --quote "…"        → lines from the piece itself, shown where the excerpt would
 *                      be (and as the inbox's preview line); give it again for a
 *                      second paragraph. [words](/palette/) is a link, as in the
 *                      post; a site path is made absolute.
 *
 * --card <hex>       → the letter carries that colour's Reverie card, drawn on the
 *                      site as readers see it (scripts/letter-card.mjs, from
 *                      SITE_URL) and attached inline like the crest. The preview
 *                      writes the pictures beside the HTML, so it shows them.
 *
 * Requirements:
 *   RESEND_API_KEY   in the environment (never in the repo).
 *   `npx wrangler login` done once — the script reads subscribers via
 *   `wrangler d1 execute qsdqsb-subscribers --remote` (no extra tokens).
 *
 * Env knobs: LETTERS_FROM ("QSD <scripta@qsdqsb.com>" — scripta manent), SITE_URL
 * (https://qsdqsb.com), RESEND_SEND_DELAY_MS (700).
 */

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderLetterHtml,
  renderLetterText,
  renderWelcomeHtml,
  renderWelcomeText,
  LOGO_CID,
  WELCOME_SUBJECT,
} from "./letter-template.mjs";
import { reverieCard } from "./letter-card.mjs";

// Repo-level secrets: load KEY=VALUE lines from a gitignored .env at the repo
// root (next to package.json), without overriding anything already exported.
// Keeps RESEND_API_KEY out of shell profiles and out of git in one move.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(repoRoot, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const kv = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!kv || line.trim().startsWith("#")) continue;
    let v = kv[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(kv[1] in process.env)) process.env[kv[1]] = v;
  }
}

const SITE_URL = (process.env.SITE_URL || "https://qsdqsb.com").replace(/\/$/, "");
const FROM = process.env.LETTERS_FROM || "QSD <scripta@qsdqsb.com>";
const D1_NAME = "qsdqsb-subscribers";
const SEND_DELAY_MS = Number(process.env.RESEND_SEND_DELAY_MS || 700);

// The brass hexagon crest travels inline (Content-ID), not as a remote URL —
// see letter-template.mjs. Read it once, and attach it to every send.
const LOGO_PATH = join(repoRoot, "images", "email", "qsd-hexagon.png");
// Every picture the letter carries inline: the crest, and a card when one is asked for.
const inline = existsSync(LOGO_PATH) ? [{ filename: "qsd-hexagon.png", content: readFileSync(LOGO_PATH), content_id: LOGO_CID }] : [];

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

const optWelcome = takeFlag("--welcome");
const optSend = takeFlag("--send");
const optYes = takeFlag("--yes");
const optSendTest = takeOption("--send-test");
const optTitle = takeOption("--title");
const optExcerpt = takeOption("--excerpt");
const optUrl = takeOption("--url");
const optSubject = takeOption("--subject");
const optCard = takeOption("--card");
const optKicker = takeOption("--kicker");
const optQuote = [];
for (let q; (q = takeOption("--quote")) !== null; ) optQuote.push(q.replace(/\]\(\//g, `](${SITE_URL}/`));
const postPath = args.find((a) => !a.startsWith("--")) || null;

if (optWelcome) {
  // The welcome is a one-shot confirmation, not a broadcast: preview it, or
  // send exactly one with --send-test. Bulk-mailing every subscriber a fresh
  // "welcome" would be nonsense, so --send is refused here.
  if (optSend) fail("--welcome is the confirmation email — preview it, or send one with --send-test <addr>. It is never bulk-sent.");
  if (optCard || optQuote.length || optKicker) fail("--card, --quote and --kicker go with a letter, not the welcome.");
} else if (!postPath && !(optTitle && optUrl)) {
  fail("usage: node scripts/send-letter.mjs <post.md> [--send-test addr | --send --yes] [--title/--excerpt/--url/--subject overrides]\n   or: node scripts/send-letter.mjs --welcome [--send-test addr]");
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

const unsubscribeUrlFor = (token) => `${SITE_URL}/api/unsubscribe?token=${token}`;

// Both email kinds resolve to the same trio: a subject, an HTML renderer and
// a text renderer that each take THIS recipient's unsubscribe URL. Everything
// downstream (preview, --send-test, bulk send) is kind-agnostic from here.
let subject;
let renderHtml;
let renderText;
let headerLines;

if (optWelcome) {
  subject = optSubject || WELCOME_SUBJECT;
  renderHtml = (unsub) => renderWelcomeHtml({ siteUrl: SITE_URL }, unsub);
  renderText = (unsub) => renderWelcomeText({ siteUrl: SITE_URL }, unsub);
  headerLines = ["Welcome email", `House:  ${SITE_URL}`];
} else {
  let fm = {};
  if (postPath) fm = parseFrontmatter(postPath);

  const title = optTitle || fm.title || fail("post has no title: — pass --title");
  // The display line, as the site shows the piece; seo_description is for search engines alone.
  const excerpt = optExcerpt ?? (fm.excerpt || fm.description || fm.seo_description || "");
  let url = optUrl;
  if (!url) {
    if (fm.permalink) url = SITE_URL + fm.permalink;
    else fail("post has no permalink: — pass --url (voyage/subvoyage routes are config-derived)");
  }
  subject = optSubject || title;
  const dateLine = fm.date
    ? new Date(fm.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";

  // What kind of thing has come: ink for words, prints for photographs.
  const kicker = optKicker ?? (/(^|\/)_(sub)?voyage\//.test(postPath || "") ? "New prints from QSD" : postPath ? "Fresh ink from QSD" : "");
  const letter = { title, excerpt, url, dateLine, quote: optQuote, kicker };
  if (optCard) {
    const card = await reverieCard(optCard, { site: SITE_URL });
    const cid = `reverie-${card.hex.slice(1).toLowerCase()}`;
    letter.figure = { cid, width: card.width, height: card.height, href: card.href, alt: `Reverie in ${card.hex}${card.name ? `, ${card.name}` : ""}` };
    inline.push({ filename: `${cid}.jpg`, content: card.jpeg, content_id: cid });
  }
  renderHtml = (unsub) => renderLetterHtml(letter, unsub);
  renderText = (unsub) => renderLetterText(letter, unsub);
  headerLines = [`Letter: “${title}”`, `Link:   ${url}`];
  if (letter.figure) headerLines.push(`Card:   ${letter.figure.alt}, ${letter.figure.width}×${letter.figure.height} (cid:${letter.figure.cid}, ${(inline.at(-1).content.length / 1024).toFixed(0)} KB) → ${letter.figure.href}`);
}

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
      html: renderHtml(unsub),
      text: renderText(unsub),
      attachments: inline.length
        ? inline.map((a) => ({ filename: a.filename, content: a.content.toString("base64"), content_id: a.content_id }))
        : undefined,
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

for (const line of headerLines) console.log(line);
console.log(`From:   ${FROM}`);
console.log(`Crest:  ${inline.some((a) => a.content_id === LOGO_CID) ? "inline (cid:" + LOGO_CID + ")" : "MISSING — images/email/qsd-hexagon.png not found"}`);
console.log(`Key:    RESEND_API_KEY ${process.env.RESEND_API_KEY ? "set" : "MISSING"}\n`);

if (optSendTest) {
  if (!process.env.RESEND_API_KEY) fail("RESEND_API_KEY is not set");
  const r = await resendSend(optSendTest, "00000000-0000-4000-8000-000000000000");
  console.log(`✓ test ${optWelcome ? "welcome" : "letter"} sent to ${optSendTest} (id ${r.id})`);
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
  const stem = optWelcome ? "welcome" : postPath ? basename(postPath).replace(/\.md$/, "") : "letter";
  const htmlPath = join(dir, `${stem}.preview.html`);
  const textPath = join(dir, `${stem}.preview.txt`);
  const previewUnsub = unsubscribeUrlFor("«personal-token-per-recipient»");
  // A mail client finds the inline pictures by Content-ID; a browser opening the preview cannot,
  // so they are written beside it and named as files.
  let html = renderHtml(previewUnsub);
  for (const a of inline) {
    writeFileSync(join(dir, a.filename), a.content);
    html = html.split(`cid:${a.content_id}`).join(a.filename);
  }
  writeFileSync(htmlPath, html);
  writeFileSync(textPath, renderText(previewUnsub));
  console.log("Preview only — nothing sent.");
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  Text: ${textPath}`);
  console.log(optWelcome
    ? "\nNext: --welcome --send-test you@example.com."
    : "\nNext: --send-test you@example.com, then --send --yes.");
}
