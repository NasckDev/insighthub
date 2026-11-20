import type { ReactNode } from 'react';
import { ApartmentOutlined, BulbOutlined, DashboardOutlined, MessageOutlined, PushpinOutlined, SwapOutlined } from '../ui';

export const NAV_ITEMS = [
  { to: '/s/$surveyId/visao-geral', slug: 'visao-geral', label: 'Painel', icon: <DashboardOutlined />, go: 'P' },
  { to: '/s/$surveyId/respostas', slug: 'respostas', label: 'Respostas', icon: <MessageOutlined />, go: 'R' },
  { to: '/s/$surveyId/temas', slug: 'temas', label: 'Temas', icon: <ApartmentOutlined />, go: 'T' },
  { to: '/s/$surveyId/comparar', slug: 'comparar', label: 'Comparar', icon: <SwapOutlined />, go: 'C' },
  { to: '/s/$surveyId/sintese', slug: 'sintese', label: 'Síntese', icon: <BulbOutlined />, go: 'S' },
  { to: '/s/$surveyId/quadro', slug: 'quadro', label: 'Quadro', icon: <PushpinOutlined />, go: 'Q' },
] as const satisfies readonly {
  to: string;
  slug: string;
  label: string;
  icon: ReactNode;
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
