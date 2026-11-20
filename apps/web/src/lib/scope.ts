import { THEME_LABELS, type ResponseFilters } from '@insighthub/core';
import { formatDate } from './format';
import { NPS_LABELS, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from './labels';

/** Human description of the active filters, e.g. "Plano Pro · Região Sul · Tema Preço". */
export function describeFilters(filters: ResponseFilters): string {
  const parts: string[] = [];
  if (filters.plan?.length) parts.push(`Plano ${filters.plan.map((p) => PLAN_LABELS[p]).join(' ou ')}`);
  if (filters.region?.length) parts.push(`Região ${filters.region.map((r) => REGION_LABELS[r]).join(' ou ')}`);
  if (filters.role?.length) parts.push(`Função ${filters.role.map((r) => ROLE_LABELS[r]).join(' ou ')}`);
  if (filters.nps) parts.push(NPS_LABELS[filters.nps]);
  if (filters.theme) parts.push(`Tema ${THEME_LABELS[filters.theme]}`);
  if (filters.from || filters.to) {
    const from = filters.from ? formatDate(filters.from) : 'o início';
    const to = filters.to ? formatDate(filters.to) : 'hoje';
    parts.push(`de ${from} a ${to}`);
  }
  if (filters.q) parts.push(`busca “${filters.q}”`);
  return parts.length > 0 ? parts.join(' · ') : 'Todas as respostas';
}
