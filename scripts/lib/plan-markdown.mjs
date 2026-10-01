/**
 * The plan's Markdown, as much of it as `_plan/` uses, turned into HTML for the command centre
 * (scripts/hub-page.mjs): headings, paragraphs, lists with task ticks, tables, fences, quotes, rules;
 * inline code, bold, emphasis and links. A link into the plan is shown as its words, since a
 * published page cannot open a file in the repo.
 *
 * Small on purpose. If the plan starts to use something this does not draw, add it here with a test
 * (tests/plan-hub.test.js): a block this walk does not recognise is still taken as prose, so the
 * walk always moves on.
 */

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/**
 * Inline Markdown: code, bold, emphasis, links. Code spans are set aside first and put back last, so
 * a `**` or a `[` inside code is never read as markup. A link into the plan becomes its words; the
 * page cannot open a file.
 */
export const inline = (s) => {
  const code = [];
  const held = esc(s).replace(/`([^`]+)`/g, (m, c) => `\u0000${code.push(c) - 1}\u0000`);
  return held
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<.,;:)])/g, '$1<a href="$2">$2</a>')
    .replace(/\u0000(\d+)\u0000/g, (m, n) => `<code>${code[Number(n)]}</code>`);
};

/** A table row's cells: split on the bars that are not inside code and not escaped. */
export const cells = (row) => {
  const out = [];
  let cur = '', inCode = false;
  const body = row.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '`') inCode = !inCode;
    if (ch === '\\' && body[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '|' && !inCode) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};

/** Block Markdown, as much of it as the plan uses: headings, paragraphs, lists, tables, fences, rules. */
export function markdown(src, { skipTitle = true } = {}) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0, titled = !skipTitle;
  const isBlockStart = (l) => /^(#{1,6} |```|\||- |\d+\. |---\s*$|> )/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; out.push(`<pre>${esc(buf.join('\n'))}</pre>`); continue;
    }
    const h = l.match(/^(#{1,6}) (.+)$/);
    if (h) { i++; if (h[1].length === 1 && !titled) { titled = true; continue; } out.push(`<h${Math.min(6, h[1].length + 2)}>${inline(h[2])}</h${Math.min(6, h[1].length + 2)}>`); continue; }
    if (/^---\s*$/.test(l)) { i++; out.push('<hr>'); continue; }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const body = rows.filter((r, n) => !(n === 1 && /^[\s|:-]+$/.test(r)));
      out.push(`<div class="scroll"><table><thead><tr>${cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^(- |\d+\. )/.test(l)) {
      const ordered = /^\d+\. /.test(l), items = [];
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^(- |\d+\. )/.test(lines[i])) items.push(lines[i].replace(/^(- |\d+\. )/, ''));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const item = (t) => t.replace(/^\[( |x)\] /i, (m, c) => `<span class="tick" data-done="${c !== ' '}"></span>`);
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${item(inline(t))}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (l.startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }
    // Whatever is left is prose; the first line is taken even if it looks like a block, so the walk always moves on.
    const para = [lines[i++].trim()];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
