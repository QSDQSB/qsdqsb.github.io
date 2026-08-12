/**
 * House email templates — the one design used for every email this site sends.
 *
 * Email HTML is a hostile medium: clients strip <style> blocks, custom fonts
 * and most layout CSS. So every house email is a 600px single-column table
 * with everything inlined, a serif stack that degrades to Georgia, and the
 * house palette (near-black ground, ivory text, aged-brass accents). Dark by
 * declaration, legible even where a client forces its own background.
 *
 * Two kinds of email share this one shell (`houseEmailDocument`):
 *   • the LETTER   — sent when a new post/voyage is published (renderLetter*)
 *   • the WELCOME  — sent once, on subscribing                 (renderWelcome*)
 * Adding a third means writing its content rows and reusing the shell; the
 * masthead, rules, footer and unsubscribe line come for free and stay uniform.
 *
 * Every render is PER RECIPIENT: `unsubscribeUrl` carries that subscriber's
 * personal token, so the footer link (and the mailbox provider's native
 * unsubscribe button, via the List-Unsubscribe header set by the sender)
 * silences only that one address.
 */

// Single-quote the multi-word family names: these stacks are interpolated
// into double-quoted style="…" attributes, and an embedded " would terminate
// the attribute early — dropping font-size/color/letter-spacing on every SANS
// or SERIF element. Single quotes are valid inside a double-quoted attribute
// and every mail client accepts them.
const SERIF = "Didot, 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Barlow, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const INK = "#e4e5e5"; // ivory text
const BRASS = "#c3b498"; // aged brass
const MUTE = "#8a8d8f"; // quiet gray
const GROUND = "#151515"; // near-black
const RULE_TOP = "#4d453a"; // lit brass hairline under the masthead
const RULE_FOOT = "#33302b"; // dimmer hairline above the footer

const PRIVACY_URL = "https://qsdqsb.com/terms/#email-subscription";

// The brass hexagon monogram. Email clients (Gmail, Outlook) don't render
// inline SVG, so the crest ships as a PNG — and it travels INLINE, attached to
// the message with a Content-ID (set by the sender) and referenced here as
// cid:… rather than a remote URL. That keeps it visible without an image-load
// click, works before the asset is ever deployed, and — fitting a house that
// promises "no tracking pixels" — means opening a letter fetches nothing at
// all. Source raster: images/email/qsd-hexagon.png (128px, shown at 52 for
// retina). The sender attaches it under this exact id.
export const LOGO_CID = "qsd-hexagon";
const LOGO_SRC = `cid:${LOGO_CID}`;

// The house motto, exactly as the landing hero carries it (_layouts/home.html):
// "Death rather than boredom." Every email wears it under the wordmark, so the
// masthead echoes the front door.
const MOTTO = "Mors potius quam taedium";

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ==========================================================================
   The shared shell — masthead, top rule, [content], footer rule, footer note,
   unsubscribe/privacy. `contentRows` is a raw HTML string of <tr> rows that
   each caller builds; `preheader` is the hidden inbox-preview line; every
   other slot is chrome common to all house email.
   ========================================================================== */
function houseEmailDocument({ documentTitle, preheader, contentRows, footerNote, unsubscribeUrl }) {
  const unsub = escapeHtml(unsubscribeUrl);
  const pre = escapeHtml(preheader || "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(documentTitle)}</title>
</head>
<body style="margin:0;padding:0;background-color:${GROUND};" bgcolor="${GROUND}">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${pre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${GROUND};" bgcolor="${GROUND}">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <tr>
            <td align="center" style="padding:0 8px 14px;">
              <img src="${LOGO_SRC}" width="52" height="52" alt="QSD" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 8px 7px;font-family:${SANS};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${BRASS};">
              QSD&#8217;s House of Wonders
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 8px 16px;font-family:${SERIF};font-style:italic;font-size:13px;letter-spacing:1px;color:${MUTE};">
              ${MOTTO}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${RULE_TOP};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

${contentRows}

          <tr>
            <td style="border-top:1px solid ${RULE_FOOT};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 24px 6px;font-family:${SANS};font-size:11px;line-height:1.7;color:${MUTE};">
              ${footerNote}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 40px;font-family:${SANS};font-size:11px;color:${MUTE};">
              <a href="${unsub}" style="color:${MUTE};text-decoration:underline;">Unsubscribe</a>
              &nbsp;&middot;&nbsp;
              <a href="${PRIVACY_URL}" style="color:${MUTE};text-decoration:underline;">Privacy</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* Shared plaintext chrome — the masthead line, then the caller's body lines,
   then the same footer note + unsubscribe/privacy as the HTML. */
function houseEmailText({ bodyLines, footerNote, unsubscribeUrl }) {
  return [
    "QSD'S HOUSE OF WONDERS",
    MOTTO,
    "",
    ...bodyLines,
    "",
    "—",
    footerNote,
    `Unsubscribe: ${unsubscribeUrl}`,
    `Privacy: ${PRIVACY_URL}`,
  ].join("\n");
}

/* ==========================================================================
   THE LETTER — a new post/voyage announcement.
   ========================================================================== */

const LETTER_FOOTER_NOTE =
  "You asked to hear when something new was published. This is that, and nothing more.";

/**
 * @param {object} letter
 * @param {string} letter.title      Post title (plain text)
 * @param {string} letter.excerpt    One-paragraph description (plain text)
 * @param {string} letter.url        Absolute URL of the piece
 * @param {string} letter.dateLine   e.g. "August 2026"
 * @param {string} unsubscribeUrl    THIS recipient's personal unsubscribe link
 */
export function renderLetterHtml(letter, unsubscribeUrl) {
  const title = escapeHtml(letter.title);
  const excerpt = escapeHtml(letter.excerpt || "");
  const url = escapeHtml(letter.url);
  const dateLine = escapeHtml(letter.dateLine || "");

  const contentRows = `          <tr>
            <td align="center" style="padding:34px 8px 6px;font-family:${SERIF};font-size:30px;line-height:1.25;color:${INK};">
              ${title}
            </td>
          </tr>
          ${dateLine ? `<tr>
            <td align="center" style="padding:0 8px 22px;font-family:${SANS};font-size:12px;letter-spacing:1px;color:${MUTE};">
              ${dateLine}
            </td>
          </tr>` : ""}
          ${excerpt ? `<tr>
            <td align="center" style="padding:0 30px 30px;font-family:${SERIF};font-style:italic;font-size:17px;line-height:1.6;color:${BRASS};">
              ${excerpt}
            </td>
          </tr>` : ""}
          <tr>
            <td align="center" style="padding:4px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid ${BRASS};border-radius:4px;">
                    <a href="${url}" style="display:inline-block;padding:11px 30px;font-family:${SANS};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${BRASS};text-decoration:none;">
                      Read it
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return houseEmailDocument({
    documentTitle: letter.title,
    preheader: letter.excerpt || "",
    contentRows,
    footerNote: LETTER_FOOTER_NOTE,
    unsubscribeUrl,
  });
}

export function renderLetterText(letter, unsubscribeUrl) {
  const bodyLines = [
    letter.title,
    letter.dateLine ? letter.dateLine : null,
    "",
    letter.excerpt ? letter.excerpt : null,
    letter.excerpt ? "" : null,
    `Read it: ${letter.url}`,
  ].filter((l) => l !== null);
  return houseEmailText({ bodyLines, footerNote: LETTER_FOOTER_NOTE, unsubscribeUrl });
}

/* ==========================================================================
   THE WELCOME — sent once, the moment someone subscribes. The only email a
   subscriber ever receives that is not itself a new piece. It confirms the
   arrangement, sets the (deliberately low) expectation, and — since anyone
   can type anyone's address into a form — quietly offers the door straight
   back out to whoever didn't ask to be here.
   ========================================================================== */

const WELCOME_TITLE = "The door is open.";
const WELCOME_LEAD = "QSD welcomes you to his world!";
const WELCOME_PROMISE =
  "Nothing here counts your clicks. When a new post or voyage appears, one quiet letter arrives.";
const WELCOME_CTA = "Enter the house";
const WELCOME_FOOTER_NOTE =
  "This note confirms the subscription just made at qsdqsb.com. If it wasn’t you, the link below removes the address at once — no account, no questions.";

// The welcome's subject line — used by both the manual sender (send-letter.mjs)
// and the automatic one (functions/api/subscribe.js), so it lives here once.
export const WELCOME_SUBJECT = "You’re subscribed to QSD’s House of Wonders!";

const DEFAULT_SITE_URL = "https://qsdqsb.com";

/**
 * @param {object}  [opts]
 * @param {string}  [opts.siteUrl]   Absolute URL the CTA points at (the house).
 * @param {string}  unsubscribeUrl   THIS recipient's personal unsubscribe link.
 */
export function renderWelcomeHtml(opts, unsubscribeUrl) {
  const siteUrl = escapeHtml((opts && opts.siteUrl) || DEFAULT_SITE_URL);

  const contentRows = `          <tr>
            <td align="center" style="padding:34px 8px 8px;font-family:${SERIF};font-size:30px;line-height:1.25;color:${INK};">
              ${escapeHtml(WELCOME_TITLE)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 30px 18px;font-family:${SERIF};font-style:italic;font-size:17px;line-height:1.6;color:${BRASS};">
              ${escapeHtml(WELCOME_LEAD)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 34px 30px;font-family:${SANS};font-weight:300;font-size:14px;line-height:1.75;color:${INK};">
              ${escapeHtml(WELCOME_PROMISE)}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid ${BRASS};border-radius:4px;">
                    <a href="${siteUrl}" style="display:inline-block;padding:11px 30px;font-family:${SANS};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${BRASS};text-decoration:none;">
                      ${escapeHtml(WELCOME_CTA)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return houseEmailDocument({
    documentTitle: WELCOME_TITLE,
    preheader: "You’re subscribed. The house will write — rarely, and only when it must.",
    contentRows,
    footerNote: WELCOME_FOOTER_NOTE,
    unsubscribeUrl,
  });
}

export function renderWelcomeText(opts, unsubscribeUrl) {
  const siteUrl = (opts && opts.siteUrl) || DEFAULT_SITE_URL;
  const bodyLines = [
    WELCOME_TITLE,
    "",
    WELCOME_LEAD,
    "",
    WELCOME_PROMISE,
    "",
    `${WELCOME_CTA}: ${siteUrl}`,
  ];
  return houseEmailText({ bodyLines, footerNote: WELCOME_FOOTER_NOTE, unsubscribeUrl });
}
