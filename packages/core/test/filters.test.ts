import { describe, expect, it } from 'vitest';
import {
  filtersToSearchParams,
  matchesFilters,
  paginationSchema,
  responseFiltersQuerySchema,
} from '../src/filters';
import type { SurveyResponse } from '../src/types';

const base: SurveyResponse = {
  id: 'atla-0001',
  surveyId: 's-atlas-q3',
  respondentId: 'p-0001',
  plan: 'pro',
  region: 'sul',
  role: 'design',
  npsScore: 9,
  comment: 'O dashboard é rápido e intuitivo',
  answers: {},
  submittedAt: '2026-08-02T12:00:00.000Z',
};

describe('responseFiltersQuerySchema', () => {
  it('parses comma separated lists', () => {
    const parsed = responseFiltersQuerySchema.parse({ plan: 'pro,enterprise', nps: 'promoter' });
    expect(parsed.plan).toEqual(['pro', 'enterprise']);
    expect(parsed.nps).toBe('promoter');
  });

  it('rejects unknown segment values', () => {
    expect(responseFiltersQuerySchema.safeParse({ plan: 'gold' }).success).toBe(false);
  });

  it('rejects overly long search terms', () => {
    expect(responseFiltersQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });

  it('round-trips through filtersToSearchParams', () => {
    const params = filtersToSearchParams({ plan: ['free', 'pro'], q: 'lento' });
    const parsed = responseFiltersQuerySchema.parse(Object.fromEntries(params));
    expect(parsed).toEqual({ plan: ['free', 'pro'], q: 'lento' });
  });
});

describe('paginationSchema', () => {
  it('applies defaults and caps the page size', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20, sort: 'recent' });
    expect(paginationSchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});

describe('matchesFilters', () => {
  it('matches when no filters are active', () => {
    expect(matchesFilters(base, {})).toBe(true);
  });

  it('applies segment, NPS category and case-insensitive search', () => {
    expect(matchesFilters(base, { plan: ['pro'], nps: 'promoter', q: 'DASHBOARD' })).toBe(true);
    expect(matchesFilters(base, { plan: ['free'] })).toBe(false);
    expect(matchesFilters(base, { nps: 'detractor' })).toBe(false);
    expect(matchesFilters(base, { q: 'suporte' })).toBe(false);
  });
});
