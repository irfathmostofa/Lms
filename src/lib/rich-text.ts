const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'a',
  'code',
  'pre',
]);

const BLOCKED_TAGS =
  /<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|svg|math)[^>]*>[\s\S]*?<\/\1>/gi;

const BLOCKED_VOID_TAGS = /<(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*\/?>/gi;

export function looksLikeHtml(value: string | null | undefined) {
  return /<[a-z][\s\S]*>/i.test(value ?? '');
}

/**
 * Conservative allow-list sanitizer for staff-authored course descriptions.
 * The editor is only available to admins and editors, but descriptions are
 * rendered as HTML on public pages, so scripts and event handlers are removed.
 */
export function sanitizeRichText(value: string) {
  let html = (value ?? '').trim();
  if (!html) return '';

  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(BLOCKED_TAGS, '');
  html = html.replace(BLOCKED_VOID_TAGS, '');
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s+(style|class|id|contenteditable)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/javascript:/gi, '');

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (match.startsWith('</')) return `</${tag}>`;
    if (tag === 'a') {
      const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '') : '';
      const safe = /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : '';
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${tag}>`;
  });

  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  if (!plain) return '';

  return html;
}
