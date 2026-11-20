import { z } from 'zod';
import { classifyNps } from './nps';
import { normalizeText } from './text';
import { detectThemes, themesForQuery, THEME_KEYS } from './themes';
import {
  NPS_CATEGORIES,
  PLANS,
  REGIONS,
  ROLES,
  SEGMENT_DIMENSIONS,
  type SurveyResponse,
} from './types';

/** `YYYY-MM-DD` that is a real calendar day (rejects 2026-99-99 and 2026-02-31). */
export function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const isoDate = z.string().refine(isRealIsoDate, { message: 'Data inválida (use AAAA-MM-DD)' });

export const RESPONSE_SORTS = ['recent', 'oldest', 'score-desc', 'score-asc'] as const;
export type ResponseSort = (typeof RESPONSE_SORTS)[number];

/** True when both ends of the period are set and the start is after the end. */
export function isInvertedRange(filters: Pick<ResponseFilters, 'from' | 'to'>): boolean {
  return Boolean(filters.from && filters.to && filters.from > filters.to);
}

const SORTERS: Record<ResponseSort, (a: SurveyResponse, b: SurveyResponse) => number> = {
  recent: (a, b) => b.submittedAt.localeCompare(a.submittedAt) || a.id.localeCompare(b.id),
  oldest: (a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id),
  'score-desc': (a, b) => b.npsScore - a.npsScore || a.id.localeCompare(b.id),
  'score-asc': (a, b) => a.npsScore - b.npsScore || a.id.localeCompare(b.id),
};

/** Sorts a copy of the responses; the same order is used by the demo adapter and the API. */
export function sortResponses(items: readonly SurveyResponse[], sort: ResponseSort): SurveyResponse[] {
  return [...items].sort(SORTERS[sort]);
}

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
  theme: z.enum(THEME_KEYS).optional(),
  /** Inclusive submission date range, `YYYY-MM-DD` (UTC). */
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type ResponseFilters = z.infer<typeof responseFiltersSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.enum(RESPONSE_SORTS).default('recent'),
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
  theme: z.enum(THEME_KEYS).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

function isActive(list: readonly string[] | undefined): list is readonly string[] {
  return list !== undefined && list.length > 0;
}

export function matchesFilters(response: SurveyResponse, filters: ResponseFilters): boolean {
  if (isActive(filters.plan) && !filters.plan.includes(response.plan)) return false;
  if (isActive(filters.region) && !filters.region.includes(response.region)) return false;
  if (isActive(filters.role) && !filters.role.includes(response.role)) return false;
  if (filters.nps && classifyNps(response.npsScore) !== filters.nps) return false;
  if (filters.theme && !detectThemes(response.comment).includes(filters.theme)) return false;
  const day = response.submittedAt.slice(0, 10);
  if (filters.from && day < filters.from) return false;
  if (filters.to && day > filters.to) return false;
  const term = filters.q ? normalizeText(filters.q.trim()) : '';
  if (term && !matchesSearchTerm(response.comment, filters.q ?? '')) return false;
  return true;
}

/**
 * Free-text search: the comment contains the term (ignoring case and accents), or the term names a
 * theme ("desempenho") and the comment talks about it.
 */
export function matchesSearchTerm(comment: string, query: string): boolean {
  const term = normalizeText(query.trim());
  if (!term) return true;
  if (normalizeText(comment).includes(term)) return true;
  const themes = themesForQuery(query);
  if (themes.length === 0) return false;
  const found = detectThemes(comment);
  return themes.some((theme) => found.includes(theme));
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
  for (const key of ['theme', 'from', 'to'] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}
