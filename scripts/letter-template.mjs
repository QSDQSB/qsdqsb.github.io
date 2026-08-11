/**
 * Letter template — renders the one email design used for every letter.
 *
 * Email HTML is a hostile medium: clients strip <style> blocks, custom fonts
 * and most layout CSS. So this is a 600px single-column table with everything
 * inlined, a serif stack that degrades to Georgia, and the house palette
 * (near-black ground, ivory text, aged-brass accents). Dark by declaration,
 * legible even where a client forces its own background.
 *
 * Every render is PER RECIPIENT: `unsubscribeUrl` carries that subscriber's
 * personal token, so the footer link (and the mailbox provider's native
 * unsubscribe button, via the List-Unsubscribe header set by the sender)
 * silences only that one address.
 */

const SERIF = 'Didot, "Playfair Display", Georgia, "Times New Roman", serif';
const SANS = 'Barlow, "Helvetica Neue", Helvetica, Arial, sans-serif';

const INK = "#e4e5e5"; // ivory text
const BRASS = "#c3b498"; // aged brass
const MUTE = "#8a8d8f"; // quiet gray
const GROUND = "#151515"; // near-black

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  const unsub = escapeHtml(unsubscribeUrl);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${GROUND};" bgcolor="${GROUND}">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${excerpt}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${GROUND};" bgcolor="${GROUND}">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <tr>
            <td align="center" style="padding:0 8px 14px;font-family:${SANS};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${BRASS};">
              QSD&#8217;s House of Wonders
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #4d453a;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
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
          </tr>

          <tr>
            <td style="border-top:1px solid #33302b;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 24px 6px;font-family:${SANS};font-size:11px;line-height:1.7;color:${MUTE};">
              You asked to hear when something new was published. This is that, and nothing more.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 40px;font-family:${SANS};font-size:11px;color:${MUTE};">
              <a href="${unsub}" style="color:${MUTE};text-decoration:underline;">Unsubscribe</a>
              &nbsp;&middot;&nbsp;
              <a href="https://qsdqsb.com/terms/#email-subscription" style="color:${MUTE};text-decoration:underline;">Privacy</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderLetterText(letter, unsubscribeUrl) {
  const lines = [
    "QSD'S HOUSE OF WONDERS",
    "",
    letter.title,
    letter.dateLine ? letter.dateLine : null,
    "",
    letter.excerpt ? letter.excerpt : null,
    letter.excerpt ? "" : null,
    `Read it: ${letter.url}`,
    "",
    "—",
    "You asked to hear when something new was published. This is that, and nothing more.",
    `Unsubscribe: ${unsubscribeUrl}`,
    "Privacy: https://qsdqsb.com/terms/#email-subscription",
  ];
  return lines.filter((l) => l !== null).join("\n");
}
