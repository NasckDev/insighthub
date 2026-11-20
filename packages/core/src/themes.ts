import { normalizeText } from './text';

/**
 * Keyword dictionary used by the extractive provider, the filters and the seed generator.
 * Keywords are matched as whole words, ignoring case and accents, and each one belongs to a
 * single theme so a comment is never tagged by an accident of vocabulary.
 */
export const THEMES = {
  desempenho: ['lento', 'lentidão', 'trava', 'travar', 'congela', 'carregamento', 'carrega', 'rápido', 'rápidos', 'pesado', 'demora tanto', 'segundos'],
  usabilidade: ['intuitivo', 'intuitiva', 'confuso', 'confusa', 'fácil', 'difícil', 'navegação', 'interface', 'labirinto', 'menu', 'menus', 'cliques', 'aprendizado'],
  suporte: ['suporte', 'atendimento', 'chamado', 'chamados', 'resposta do time'],
  preço: ['caro', 'preço', 'preços', 'custo', 'custos', 'licença', 'reajuste', 'orçamento', 'pagamos'],
  integrações: ['integração', 'integrações', 'api', 'slack', 'webhook', 'webhooks', 'conector', 'conectores', 'crm', 'exportar', 'exportação', 'csv', 'data warehouse'],
  relatórios: ['relatório', 'relatórios', 'gráfico', 'gráficos', 'dashboard', 'dashboards', 'segmento', 'segmentos', 'filtro', 'filtros', 'análise', 'planilha'],
} as const;

export type Theme = keyof typeof THEMES;

export const THEME_LABELS: Record<Theme, string> = {
  desempenho: 'Desempenho',
  usabilidade: 'Usabilidade',
  suporte: 'Suporte',
  preço: 'Preço',
  integrações: 'Integrações',
  relatórios: 'Relatórios e análise',
};

export const THEME_KEYS = Object.keys(THEMES) as [Theme, ...Theme[]];

const WORD_EDGE_BEFORE = '(?<![a-z0-9])';
const WORD_EDGE_AFTER = '(?![a-z0-9])';

const MATCHERS: Record<Theme, RegExp> = Object.fromEntries(
  THEME_KEYS.map((theme) => {
    const words = THEMES[theme].map((keyword) => normalizeText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return [theme, new RegExp(`${WORD_EDGE_BEFORE}(?:${words.join('|')})${WORD_EDGE_AFTER}`)];
  }),
) as Record<Theme, RegExp>;

/** Themes a comment talks about (whole-word keyword match, accent- and case-insensitive). */
export function detectThemes(text: string): Theme[] {
  const normalized = normalizeText(text);
  return THEME_KEYS.filter((theme) => MATCHERS[theme].test(normalized));
}

const MIN_QUERY_LENGTH = 3;

/**
 * Themes a free-text search refers to: the search term is the start of the theme name, of its
 * label or of one of its words ("desempenho", "relatorio", "preco").
 */
export function themesForQuery(query: string): Theme[] {
  const term = normalizeText(query).trim();
  if (term.length < MIN_QUERY_LENGTH) return [];
  return THEME_KEYS.filter((theme) =>
    [theme, THEME_LABELS[theme]].some((name) =>
      normalizeText(name)
        .split(/\s+/)
        .some((word) => word.startsWith(term)),
    ),
  );
}
