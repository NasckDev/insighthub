import type { NpsCategory, Plan, Region, Role, SegmentDimension } from '@insighthub/core';

export const PLAN_LABELS: Record<Plan, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

export const REGION_LABELS: Record<Region, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  'centro-oeste': 'Centro-Oeste',
  sudeste: 'Sudeste',
  sul: 'Sul',
};

export const ROLE_LABELS: Record<Role, string> = {
  produto: 'Produto',
  engenharia: 'Engenharia',
  design: 'Design',
  pesquisa: 'Pesquisa',
  marketing: 'Marketing',
};

export const NPS_LABELS: Record<NpsCategory, string> = {
  promoter: 'Promotores',
  passive: 'Neutros',
  detractor: 'Detratores',
};

export const NPS_SINGULAR: Record<NpsCategory, string> = {
  promoter: 'Promotor',
  passive: 'Neutro',
  detractor: 'Detrator',
};

export const DIMENSION_LABELS: Record<SegmentDimension, string> = {
  plan: 'Plano',
  region: 'Região',
  role: 'Função',
};

const SEGMENT_LABELS: Record<SegmentDimension, Record<string, string>> = {
  plan: PLAN_LABELS,
  region: REGION_LABELS,
  role: ROLE_LABELS,
};

export function segmentLabel(dimension: SegmentDimension, value: string): string {
  return SEGMENT_LABELS[dimension][value] ?? value;
}
