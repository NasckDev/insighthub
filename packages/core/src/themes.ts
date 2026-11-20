/** Keyword dictionary used by the extractive provider and by the seed generator. */
export const THEMES = {
  desempenho: ['lento', 'lentidão', 'demora', 'trava', 'rápido', 'carregamento'],
  usabilidade: ['intuitivo', 'confuso', 'fácil', 'difícil', 'navegação', 'interface'],
  suporte: ['suporte', 'atendimento', 'resposta do time', 'chamado'],
  preço: ['caro', 'preço', 'custo', 'licença', 'plano'],
  integrações: ['integração', 'api', 'slack', 'exportar', 'webhook'],
  relatórios: ['relatório', 'dashboard', 'gráfico', 'filtro', 'segmento'],
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

export function detectThemes(text: string): Theme[] {
  const normalized = text.toLocaleLowerCase('pt-BR');
  return (Object.keys(THEMES) as Theme[]).filter((theme) =>
    THEMES[theme].some((keyword) => normalized.includes(keyword)),
  );
}

export const THEME_KEYS = Object.keys(THEMES) as [Theme, ...Theme[]];
