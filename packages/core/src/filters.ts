import { z } from 'zod';
import { classifyNps } from './nps';
import {
  NPS_CATEGORIES,
  PLANS,
  REGIONS,
  ROLES,
  SEGMENT_DIMENSIONS,
  type SurveyResponse,
} from './types';

export const MAX_SEARCH_LENGTH = 100;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

/** Canonical filter shape, shared by the API boundary, the web router and the mock client. */
export const responseFiltersSchema = z.object({
  plan: z.array(z.enum(PLANS)).optional(),
  region: z.array(z.enum(REGIONS)).optional(),
  role: z.array(z.enum(ROLES)).optional(),
  nps: z.enum(NPS_CATEGORIES).optional(),
  q: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
});

export type ResponseFilters = z.infer<typeof responseFiltersSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const dimensionSchema = z.enum(SEGMENT_DIMENSIONS);

function csvOf<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .string()
    .max(200)
    .transform((raw) => raw.split(',').map((part) => part.trim()).filter(Boolean))
    .pipe(z.array(z.enum(values)))
    .optional();
}

/** Query-string form of the filters: lists are comma separated (`?plan=pro,enterprise`). */
export const responseFiltersQuerySchema = z.object({
  plan: csvOf(PLANS),
  region: csvOf(REGIONS),
  role: csvOf(ROLES),
  nps: z.enum(NPS_CATEGORIES).optional(),
  q: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
});

function isActive(list: readonly string[] | undefined): list is readonly string[] {
  return list !== undefined && list.length > 0;
}

export function matchesFilters(response: SurveyResponse, filters: ResponseFilters): boolean {
  if (isActive(filters.plan) && !filters.plan.includes(response.plan)) return false;
  if (isActive(filters.region) && !filters.region.includes(response.region)) return false;
  if (isActive(filters.role) && !filters.role.includes(response.role)) return false;
  if (filters.nps && classifyNps(response.npsScore) !== filters.nps) return false;
  const term = filters.q?.trim().toLocaleLowerCase('pt-BR');
  if (term && !response.comment.toLocaleLowerCase('pt-BR').includes(term)) return false;
  return true;
}

/** Serializes filters to the query-string form understood by `responseFiltersQuerySchema`. */
export function filtersToSearchParams(filters: ResponseFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['plan', 'region', 'role'] as const) {
    const list = filters[key];
    if (isActive(list)) params.set(key, list.join(','));
  }
  if (filters.nps) params.set('nps', filters.nps);
  if (filters.q) params.set('q', filters.q);
  return params;
}
