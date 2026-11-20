import { classifyNps } from './nps';
import { matchesFilters, type ResponseFilters } from './filters';
import { detectThemes, THEME_KEYS, type Theme } from './themes';
import {
  NPS_CATEGORIES,
  PLANS,
  REGIONS,
  ROLES,
  type NpsCategory,
  type Plan,
  type Region,
  type Role,
  type SurveyResponse,
} from './types';

export interface Facets {
  plan: Record<Plan, number>;
  region: Record<Region, number>;
  role: Record<Role, number>;
  nps: Record<NpsCategory, number>;
  theme: Record<Theme, number>;
}

function zeroed<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

/**
 * Counts per option for every facet. Each facet is counted with every filter EXCEPT its own, so
 * ticking one option never makes its siblings disappear (the usual faceted-search behavior).
 */
export function computeFacets(responses: readonly SurveyResponse[], filters: ResponseFilters): Facets {
  const facets: Facets = {
    plan: zeroed(PLANS),
    region: zeroed(REGIONS),
    role: zeroed(ROLES),
    nps: zeroed(NPS_CATEGORIES),
    theme: zeroed(THEME_KEYS),
  };
  const without = (key: keyof ResponseFilters): ResponseFilters => ({ ...filters, [key]: undefined });
  for (const response of responses) {
    if (matchesFilters(response, without('plan'))) facets.plan[response.plan] += 1;
    if (matchesFilters(response, without('region'))) facets.region[response.region] += 1;
    if (matchesFilters(response, without('role'))) facets.role[response.role] += 1;
    if (matchesFilters(response, without('nps'))) facets.nps[classifyNps(response.npsScore)] += 1;
    if (matchesFilters(response, without('theme'))) {
      for (const theme of detectThemes(response.comment)) facets.theme[theme] += 1;
    }
  }
  return facets;
}
