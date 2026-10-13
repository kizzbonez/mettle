/** Shared shell for every email: table layout and inline styles, for mail clients. */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailBody {
  /** Hidden preview line shown next to the subject in most inboxes. */
  preview: string;
  heading: string;
  /** Paragraphs of trusted HTML built by the templates, never raw user input. */
  paragraphs: string[];
  action?: { label: string; url: string };
  footnote?: string;
}

const INK = '#14181b';
const PAPER = '#eef0ee';
const EMBER = '#f26419';
const MUTED = '#5b6468';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(action: { label: string; url: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr>
<td style="background:${EMBER};border-radius:4px">
<a href="${escapeHtml(action.url)}" style="display:inline-block;padding:13px 26px;font:700 15px ${FONT};color:${INK};text-decoration:none">${escapeHtml(action.label)}</a>
</td></tr></table>
<p style="margin:0;font:13px/1.6 ${FONT};color:${MUTED}">Or paste this link into your browser:<br>
<span style="color:${INK};word-break:break-all">${escapeHtml(action.url)}</span></p>`;
}

export function renderHtml(siteName: string, body: EmailBody): string {
  const paragraphs = body.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font:16px/1.65 ${FONT};color:${INK}">${p}</p>`)
    .join('\n');
  const footnote = body.footnote
    ? `<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #d5dad8;font:13px/1.6 ${FONT};color:${MUTED}">${body.footnote}</p>`
    : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(body.heading)}</title></head>
<body style="margin:0;padding:0;background:${PAPER}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(body.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="background:${INK};padding:22px 32px;border-bottom:4px solid ${EMBER}">
<span style="font:800 20px ${FONT};letter-spacing:.18em;color:#ffffff;text-transform:uppercase">${escapeHtml(siteName)}</span>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 32px 32px">
<h1 style="margin:0 0 18px;font:700 24px/1.25 ${FONT};color:${INK}">${escapeHtml(body.heading)}</h1>
${paragraphs}
${body.action ? button(body.action) : ''}
${footnote}
</td></tr>
<tr><td style="padding:18px 32px;font:12px/1.6 ${FONT};color:${MUTED}">
Sent by ${escapeHtml(siteName)}. Prove your mettle.
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export function renderText(siteName: string, body: EmailBody): string {
  const lines = [body.heading, '', ...body.paragraphs.map(stripTags)];
  if (body.action) lines.push('', `${body.action.label}: ${body.action.url}`);
  if (body.footnote) lines.push('', stripTags(body.footnote));
  lines.push('', `-- ${siteName}`);
  return lines.join('\n');
}
