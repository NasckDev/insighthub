import { classifyNps, computeNps } from './nps';
import { abortableSleep } from './retry';
import { detectThemes, THEME_LABELS, type Theme } from './themes';
import type { Citation, Survey, SurveyResponse, SynthesisEvent } from './types';

export interface SynthesisInput {
  survey: Survey;
  responses: readonly SurveyResponse[];
}

/** Contract implemented by every synthesis backend (local extractive, Claude, ...). */
export interface InsightProvider {
  readonly name: string;
  stream(input: SynthesisInput, signal: AbortSignal): AsyncGenerator<SynthesisEvent>;
}

export interface ThemeSummary {
  theme: Theme;
  mentions: number;
  detractorShare: number;
  representative: SurveyResponse;
}

const TOP_THEMES = 3;

function pickRepresentative(candidates: readonly SurveyResponse[]): SurveyResponse {
  // Deterministic: the most detailed comment wins, ties broken by id.
  return [...candidates].sort(
    (a, b) => b.comment.length - a.comment.length || a.id.localeCompare(b.id),
  )[0] as SurveyResponse;
}

export function summarizeThemes(responses: readonly SurveyResponse[]): ThemeSummary[] {
  const byTheme = new Map<Theme, SurveyResponse[]>();
  for (const response of responses) {
    for (const theme of detectThemes(response.comment)) {
      byTheme.set(theme, [...(byTheme.get(theme) ?? []), response]);
    }
  }
  return [...byTheme.entries()]
    .map(([theme, matches]) => {
      const detractors = matches.filter((r) => classifyNps(r.npsScore) === 'detractor').length;
      return {
        theme,
        mentions: matches.length,
        detractorShare: Math.round((detractors / matches.length) * 100),
        representative: pickRepresentative(matches),
      };
    })
    .sort((a, b) => b.mentions - a.mentions || a.theme.localeCompare(b.theme))
    .slice(0, TOP_THEMES);
}

export interface ExtractiveSynthesis {
  text: string;
  citations: Citation[];
}

export function buildExtractiveSynthesis({ survey, responses }: SynthesisInput): ExtractiveSynthesis {
  if (responses.length === 0) {
    return { text: 'Nenhuma resposta corresponde aos filtros atuais.', citations: [] };
  }
  const breakdown = computeNps(responses.map((r) => r.npsScore));
  const themes = summarizeThemes(responses);
  const lines = [
    `Síntese de ${breakdown.total} respostas de "${survey.title}".`,
    `NPS ${breakdown.nps}: ${breakdown.promoters} promotores, ${breakdown.passives} neutros e ${breakdown.detractors} detratores.`,
    '',
    'Temas mais citados:',
    ...themes.map(
      (t) =>
        `- ${THEME_LABELS[t.theme]}: ${t.mentions} menções (${t.detractorShare}% de detratores). ` +
        `Exemplo: "${t.representative.comment}" [#${t.representative.id}]`,
    ),
  ];
  if (themes.length === 0) lines.push('- Nenhum tema recorrente identificado.');
  const citations = themes.map((t) => ({ responseId: t.representative.id, quote: t.representative.comment }));
  return { text: lines.join('\n'), citations };
}

export interface LocalProviderOptions {
  /** Delay between streamed chunks; 0 disables pacing (tests). */
  chunkDelayMs?: number;
}

/** Deterministic, offline provider: extractive statistics + representative quotes. */
export function createLocalInsightProvider(options: LocalProviderOptions = {}): InsightProvider {
  const chunkDelayMs = options.chunkDelayMs ?? 25;
  return {
    name: 'local-extractive',
    async *stream(input, signal) {
      const { text, citations } = buildExtractiveSynthesis(input);
      yield { type: 'meta', provider: 'local-extractive', sourceCount: input.responses.length };
      for (const chunk of text.match(/\S+\s*/g) ?? []) {
        if (chunkDelayMs > 0) await abortableSleep(chunkDelayMs, signal);
        yield { type: 'delta', text: chunk };
      }
      for (const citation of citations) yield { type: 'citation', citation };
      yield { type: 'done' };
    },
  };
}

const CITATION_MARKER = /\[#([a-z0-9-]{1,40})\]/g;

/** Extracts `[#id]` markers, keeping only ids that exist in the source set (no invented sources). */
export function extractCitations(text: string, sources: readonly SurveyResponse[]): Citation[] {
  const byId = new Map(sources.map((r) => [r.id, r]));
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const match of text.matchAll(CITATION_MARKER)) {
    const id = match[1] ?? '';
    const source = byId.get(id);
    if (!source || seen.has(id)) continue;
    seen.add(id);
    citations.push({ responseId: id, quote: source.comment });
  }
  return citations;
}
