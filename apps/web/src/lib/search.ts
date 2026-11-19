import {
  dimensionSchema,
  paginationSchema,
  responseFiltersSchema,
  DEFAULT_PAGE_SIZE,
  type ResponseFilters,
  type SegmentDimension,
} from '@insighthub/core';
import { z } from 'zod';

/**
 * Search params of every survey screen. Filters and pagination come straight from the
 * shared core schemas (the same ones the API validates with); only the screen-specific
 * keys (`dimension`, `r`) are declared here.
 */
const surveySearchSchema = responseFiltersSchema.extend({
  page: paginationSchema.shape.page,
  pageSize: paginationSchema.shape.pageSize,
  dimension: dimensionSchema.default('plan'),
  r: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/)
    .optional(),
});

export interface SurveySearch extends ResponseFilters {
  page?: number;
  pageSize?: number;
  dimension?: SegmentDimension;
  /** Id of the response shown in the detail dialog. */
  r?: string;
}

const LIST_KEYS = ['plan', 'region', 'role'] as const;

function dropDefaults(parsed: z.output<typeof surveySearchSchema>): SurveySearch {
  const { page, pageSize, dimension, ...rest } = parsed;
  const search: SurveySearch = { ...rest };
  if (page > 1) search.page = page;
  if (pageSize !== DEFAULT_PAGE_SIZE) search.pageSize = pageSize;
  if (dimension !== 'plan') search.dimension = dimension;
  for (const key of LIST_KEYS) if (search[key]?.length === 0) delete search[key];
  if (!search.q) delete search.q;
  return search;
}

/** Validates raw search params; invalid keys are dropped instead of breaking the page. */
export function parseSurveySearch(raw: Record<string, unknown>): SurveySearch {
  let candidate = { ...raw };
  // Each failed attempt removes at least one offending key, so this always terminates.
  for (let attempt = 0; attempt <= Object.keys(raw).length; attempt += 1) {
    const result = surveySearchSchema.safeParse(candidate);
    if (result.success) return dropDefaults(result.data);
    const bad = new Set(result.error.issues.map((issue) => String(issue.path[0])));
    candidate = Object.fromEntries(Object.entries(candidate).filter(([key]) => !bad.has(key)));
  }
  return {};
}

/** `?plan=pro,free` -> `{ plan: ['pro', 'free'] }` (values are validated later by the core schema). */
export function parseSearchString(searchString: string): Record<string, unknown> {
  const params = new URLSearchParams(searchString.startsWith('?') ? searchString.slice(1) : searchString);
  const raw: Record<string, unknown> = {};
  for (const [key, value] of params) {
    raw[key] = (LIST_KEYS as readonly string[]).includes(key)
      ? value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : value;
  }
  return raw;
}

export function stringifySearchObject(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Only the filter keys, ready for the data layer. */
export function filtersOf(search: SurveySearch): ResponseFilters {
  const filters: ResponseFilters = {};
  if (search.plan?.length) filters.plan = search.plan;
  if (search.region?.length) filters.region = search.region;
  if (search.role?.length) filters.role = search.role;
  if (search.nps) filters.nps = search.nps;
  if (search.q) filters.q = search.q;
  return filters;
}

export function hasActiveFilters(search: SurveySearch): boolean {
  return Object.keys(filtersOf(search)).length > 0;
}

const SEARCH_KEYS = ['plan', 'region', 'role', 'nps', 'q', 'page', 'pageSize', 'dimension', 'r'] as const;

/**
 * Router `validateSearch`. TanStack merges the validated object over the raw params, so a key
 * dropped as invalid would survive from the raw URL. Returning every known key (undefined when
 * absent or invalid) makes the validated value always win.
 */
export function validateSurveySearch(raw: Record<string, unknown>): SurveySearch {
  const parsed = parseSurveySearch(raw);
  return Object.fromEntries(SEARCH_KEYS.map((key) => [key, parsed[key]])) as SurveySearch;
}
