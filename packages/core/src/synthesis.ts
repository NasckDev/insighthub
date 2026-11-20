import { classifyNps, computeNps } from './nps';
import type { SynthesisFocus } from './synthesis-templates';
import { analyzeThemes, type ThemeStat } from './theme-analysis';
import { abortableSleep } from './retry';
import { detectThemes, THEME_LABELS, type Theme } from './themes';
import type { Citation, NpsCategory, Survey, SurveyResponse, SynthesisEvent } from './types';

export interface SynthesisInput {
  survey: Survey;
  responses: readonly SurveyResponse[];
  focus?: SynthesisFocus;
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

const FOCUS_TITLE: Record<SynthesisFocus, string> = {
  overview: 'Resumo executivo',
  problems: 'Principais motivos de insatisfação',
  strengths: 'O que os clientes mais valorizam',
  opportunities: 'Oportunidades de produto',
};

const THEME_ACTIONS: Record<Theme, string> = {
  desempenho: 'Investigar os gargalos de carregamento e publicar um orçamento de desempenho',
  usabilidade: 'Revisar a navegação e o primeiro uso com quem está começando',
  suporte: 'Definir prazo de primeira resposta e dar um dono a cada chamado',
  preço: 'Explicar melhor o valor de cada plano e rever a transição entre eles',
  integrações: 'Priorizar conectores e webhooks pedidos, com exemplos na documentação',
  relatórios: 'Oferecer modelos de relatório e salvar combinações de filtros',
};

const MIN_RELIABLE_SAMPLE = 10;
const THEMES_SHOWN = 4;
const FOCUS_CATEGORY: Partial<Record<SynthesisFocus, NpsCategory>> = {
  problems: 'detractor',
  strengths: 'promoter',
};

function rankFor(focus: SynthesisFocus, stat: ThemeStat): number {
  if (focus === 'problems') return stat.detractors;
  if (focus === 'strengths') return stat.promoters;
  if (focus === 'opportunities') return stat.detractors + stat.passives;
  return stat.mentions;
}

export function buildExtractiveSynthesis({
  survey,
  responses,
  focus = 'overview',
}: SynthesisInput): ExtractiveSynthesis {
  if (responses.length === 0) {
    return { text: 'Nenhuma resposta corresponde aos filtros atuais.', citations: [] };
  }
  const breakdown = computeNps(responses.map((r) => r.npsScore));
  const wanted = FOCUS_CATEGORY[focus];
  const ranked = analyzeThemes(responses)
    .map((stat) => ({ stat, score: rankFor(focus, stat) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.stat.theme.localeCompare(b.stat.theme))
    .slice(0, THEMES_SHOWN);
  // Each theme gets its own example whenever possible, so the text never repeats the same quote.
  const usedComments = new Set<string>();
  const picked = ranked.map(({ stat }) => {
    const matches = responses.filter((r) => detectThemes(r.comment).includes(stat.theme));
    const preferred = wanted ? matches.filter((r) => classifyNps(r.npsScore) === wanted) : matches;
    const pool = preferred.length > 0 ? preferred : matches;
    const fresh = pool.filter((r) => !usedComments.has(r.comment));
    const representative = pickRepresentative(fresh.length > 0 ? fresh : pool);
    usedComments.add(representative.comment);
    return { stat, representative };
  });
  const mixedCategories =
    [breakdown.promoters, breakdown.passives, breakdown.detractors].filter((count) => count > 0).length > 1;

  const lines = [
    `## ${FOCUS_TITLE[focus]}`,
    `Síntese de ${breakdown.total} respostas de "${survey.title}". ` +
      `NPS ${signedNps(breakdown.nps)}: ${breakdown.promoters} promotores, ` +
      `${breakdown.passives} neutros e ${breakdown.detractors} detratores.`,
  ];
  if (breakdown.total < MIN_RELIABLE_SAMPLE) {
    lines.push(`Atenção: com ${breakdown.total} respostas a amostra é pequena; trate como indício, não como regra.`);
  }
  lines.push('', '## Temas em destaque');
  for (const { stat, representative } of picked) {
    lines.push(
      `- **${THEME_LABELS[stat.theme]}**: ${stat.mentions} menções${mixedCategories ? `, ${stat.detractors} de detratores` : ''}. ` +
        `Exemplo: “${representative.comment}” [#${representative.id}]`,
    );
  }
  if (picked.length === 0) lines.push('- Nenhum tema recorrente identificado.');
  if (picked.length > 0) {
    lines.push('', '## O que fazer a seguir');
    for (const { stat, representative } of picked.slice(0, 3)) {
      lines.push(`- ${THEME_ACTIONS[stat.theme]} [#${representative.id}]`);
    }
  }
  const citations = picked.map(({ representative }) => ({
    responseId: representative.id,
    quote: representative.comment,
  }));
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

/** "+12", "−8" (typographic minus) or "0". */
function signedNps(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `\u2212${Math.abs(value)}`;
  return '0';
}
