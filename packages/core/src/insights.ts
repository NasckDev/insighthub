import { z } from 'zod';
import { ID_PATTERN } from './identifiers';

const MAX_INSIGHTS = 100;

export const insightSchema = z.object({
  id: z.string().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  note: z.string().trim().max(1000),
  body: z.string().max(8000),
  citations: z
    .array(z.object({ responseId: z.string().regex(ID_PATTERN), quote: z.string().max(600) }))
    .max(30),
  surveyId: z.string().max(60),
  surveyTitle: z.string().max(200),
  question: z.string().max(160),
  scope: z.string().max(300),
  createdAt: z.iso.datetime(),
});

export type Insight = z.infer<typeof insightSchema>;

/** Keeps every valid insight and silently drops the rest (storage can be edited by hand). */
export function parseBoard(raw: unknown): Insight[] {
  if (!Array.isArray(raw)) return [];
  const valid: Insight[] = [];
  const seen = new Set<string>();
  for (const entry of raw.slice(0, MAX_INSIGHTS)) {
    const parsed = insightSchema.safeParse(entry);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    valid.push(parsed.data);
  }
  return valid;
}

/** Adds on top; an id that already exists is replaced, never duplicated. Invalid input is rejected. */
export function addInsight(board: readonly Insight[], insight: Insight): Insight[] {
  const parsed = insightSchema.safeParse(insight);
  if (!parsed.success) return [...board];
  return [parsed.data, ...board.filter((item) => item.id !== parsed.data.id)].slice(0, MAX_INSIGHTS);
}

export function updateInsight(
  board: readonly Insight[],
  id: string,
  patch: Partial<Pick<Insight, 'title' | 'note'>>,
): Insight[] {
  return board.map((insight) => (insight.id === id ? { ...insight, ...patch } : insight));
}

export function removeInsight(board: readonly Insight[], id: string): Insight[] {
  return board.filter((insight) => insight.id !== id);
}

/** Merges imported insights into the board, skipping ids that already exist. */
export function mergeInsights(board: readonly Insight[], incoming: readonly Insight[]): Insight[] {
  const known = new Set(board.map((insight) => insight.id));
  return [...board, ...incoming.filter((insight) => !known.has(insight.id))].slice(0, MAX_INSIGHTS);
}

/** The board has `#` for the document and `##` per insight, so a synthesis heading becomes `###`. */
function demoteHeadings(body: string): string {
  return body.replace(/^## /gm, '### ');
}

const MARKDOWN_SPECIALS = /([\\`*_{}[\]<>#|])/g;

/** Escapes characters that would turn plain text (a title, a note, a quote) into Markdown structure. */
export function escapeMarkdown(text: string): string {
  return text.replace(MARKDOWN_SPECIALS, '\\$1');
}

export function insightsToMarkdown(insights: readonly Insight[], title = 'Quadro de insights'): string {
  const blocks = insights.map((insight) => {
    const lines = [
      `## ${escapeMarkdown(insight.title)}`,
      '',
      `*${escapeMarkdown(insight.surveyTitle)} · ${escapeMarkdown(insight.question)} · ${escapeMarkdown(insight.scope)}*`,
      '',
    ];
    if (insight.note) lines.push(`> ${escapeMarkdown(insight.note).replace(/\n/g, '\n> ')}`, '');
    lines.push(demoteHeadings(insight.body), '');
    if (insight.citations.length > 0) {
      lines.push('**Fontes**', '');
      for (const citation of insight.citations) {
        lines.push(`- \`#${citation.responseId}\`: “${escapeMarkdown(citation.quote)}”`);
      }
      lines.push('');
    }
    return lines.join('\n');
  });
  return [`# ${title}`, '', ...blocks].join('\n');
}

/** CSV cell: quotes escaped, and a leading `= + - @` neutralized so spreadsheets never run it as a formula. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function insightsToCsv(insights: readonly Insight[]): string {
  const header = ['titulo', 'nota', 'pesquisa', 'pergunta', 'escopo', 'criado_em', 'fontes', 'texto'];
  const rows = insights.map((insight) =>
    [
      insight.title,
      insight.note,
      insight.surveyTitle,
      insight.question,
      insight.scope,
      insight.createdAt,
      insight.citations.map((c) => c.responseId).join(' '),
      insight.body,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header.map(csvCell).join(','), ...rows].join('\r\n');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Encodes insights into a URL-safe token for the shareable link. */
export function encodeShare(insights: readonly Insight[]): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(insights)));
}

/** Longest share token accepted (and produced): longer links are refused with a warning, not truncated. */
export const MAX_SHARE_TOKEN = 60_000;

export function isShareTooLarge(token: string): boolean {
  return token.length > MAX_SHARE_TOKEN;
}

/** Decodes and validates a share token; returns an empty list when it is malformed. */
export function decodeShare(token: string): Insight[] {
  if (!token || token.length > MAX_SHARE_TOKEN) return [];
  try {
    const json = new TextDecoder().decode(fromBase64Url(token));
    return parseBoard(JSON.parse(json));
  } catch {
    return [];
  }
}
