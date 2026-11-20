import { Bookmark, LayoutDashboard, MessagesSquare, Scale, Shapes, Sparkles, type LucideIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/s/$surveyId/visao-geral', slug: 'visao-geral', label: 'Painel', Icon: LayoutDashboard, go: 'P' },
  { to: '/s/$surveyId/respostas', slug: 'respostas', label: 'Respostas', Icon: MessagesSquare, go: 'R' },
  { to: '/s/$surveyId/temas', slug: 'temas', label: 'Temas', Icon: Shapes, go: 'T' },
  { to: '/s/$surveyId/comparar', slug: 'comparar', label: 'Comparar', Icon: Scale, go: 'C' },
  { to: '/s/$surveyId/sintese', slug: 'sintese', label: 'Síntese', Icon: Sparkles, go: 'S' },
  { to: '/s/$surveyId/quadro', slug: 'quadro', label: 'Quadro', Icon: Bookmark, go: 'Q' },
] as const satisfies readonly {
  to: string;
  slug: string;
  label: string;
  Icon: LucideIcon;
  go: string;
}[];

export type NavItem = (typeof NAV_ITEMS)[number];

/** Page titles used in the tab title and the page header. */
export const PAGE_TITLES: Record<NavItem['slug'], string> = {
  'visao-geral': 'Painel',
  respostas: 'Respostas',
  temas: 'Mapa de temas',
  comparar: 'Comparar segmentos',
  sintese: 'Síntese com IA',
  quadro: 'Quadro de insights',
};
