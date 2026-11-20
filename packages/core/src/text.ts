/** Lowercase, accent-free form used for every search and theme match (the same on the API and in the browser). */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const MAX_COMMENT_LENGTH = 600;
const LINE_BREAKS = /[\r\n]+/g;
const ANGLE_BRACKETS = /[<>]/g;
const CITATION_OPENER = /\[\s*#/g;
const ASTERISKS = /\*+/g;
const LEADING_MARKUP = /^[\s#>\-+]+/;
const WHITESPACE = /\s+/g;

/**
 * Makes a customer comment safe to embed in a prompt or in generated Markdown: one line, no angle
 * brackets (so it can never close a delimiter), no `[#` (so it can never forge a citation) and no
 * bold or heading markup.
 */
export function sanitizeComment(text: string, maxLength = MAX_COMMENT_LENGTH): string {
  return text
    .replace(LINE_BREAKS, ' ')
    .replace(ANGLE_BRACKETS, '')
    .replace(CITATION_OPENER, '[ ')
    .replace(ASTERISKS, '')
    .replace(LEADING_MARKUP, '')
    .replace(WHITESPACE, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Rounds half away from zero, so +x.5 and -x.5 are treated the same. */
export function roundSymmetric(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
