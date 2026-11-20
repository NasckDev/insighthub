import { describe, expect, it } from 'vitest';
import { describeFilters } from './scope';

describe('describeFilters', () => {
  it('says "Todas as respostas" when nothing is filtered', () => {
    expect(describeFilters({})).toBe('Todas as respostas');
  });

  it('joins the active filters in plain Portuguese', () => {
    expect(describeFilters({ plan: ['pro', 'free'], region: ['sul'], theme: 'preço', nps: 'detractor' })).toBe(
      'Plano Pro ou Free · Região Sul · Detratores · Tema Preço',
    );
  });

  it('describes open and closed periods and the search term', () => {
    expect(describeFilters({ from: '2026-08-10' })).toContain('a hoje');
    expect(describeFilters({ q: 'lento' })).toBe('busca “lento”');
  });
});
