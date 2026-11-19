import { describe, expect, it } from 'vitest';
import { filtersOf, parseSearchString, parseSurveySearch, stringifySearchObject } from './search';

describe('survey search params', () => {
  it('parses comma separated lists and validates them with the core schemas', () => {
    const search = parseSurveySearch(parseSearchString('?plan=pro,free&nps=detractor&q=lento&page=3'));
    expect(search).toEqual({ plan: ['pro', 'free'], nps: 'detractor', q: 'lento', page: 3 });
  });

  it('drops invalid values instead of failing, keeping the valid ones', () => {
    const search = parseSurveySearch(parseSearchString('?plan=gold&region=sul&page=0&pageSize=999'));
    expect(search).toEqual({ region: ['sul'] });
  });

  it('removes default values so the URL stays clean', () => {
    const search = parseSurveySearch({ page: '1', pageSize: '20', dimension: 'plan' });
    expect(search).toEqual({});
  });

  it('round-trips through the query string', () => {
    const original = { plan: ['pro', 'enterprise'], q: 'preço alto', page: 2 };
    const text = stringifySearchObject({ ...original });
    expect(parseSurveySearch(parseSearchString(text))).toEqual(original);
  });

  it('omits empty values when stringifying', () => {
    expect(stringifySearchObject({ plan: [], q: '', page: undefined })).toBe('');
  });

  it('extracts only the filter keys for the data layer', () => {
    expect(filtersOf({ plan: ['pro'], page: 2, dimension: 'role', r: 'atla-0001' })).toEqual({
      plan: ['pro'],
    });
  });
});
