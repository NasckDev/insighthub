import { describe, expect, it } from 'vitest';
import { compareSegments } from '../src/compare';
import { generateSeed } from '../src/seed';

describe('compareSegments', () => {
  const { responses } = generateSeed();
  const atlas = responses.filter((r) => r.surveyId === 's-atlas-q3');

  it('groups by dimension and accounts for every response', () => {
    const stats = compareSegments(atlas, 'plan');
    expect(stats.map((s) => s.segment).sort()).toEqual(['enterprise', 'free', 'pro']);
    expect(stats.reduce((acc, s) => acc + s.count, 0)).toBe(atlas.length);
  });

  it('sorts segments by NPS descending', () => {
    const scores = compareSegments(atlas, 'plan').map((s) => s.nps);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('flags small samples', () => {
    const stats = compareSegments(atlas.slice(0, 5), 'role');
    expect(stats.every((s) => s.lowSample)).toBe(true);
  });

  it('returns percentages that add up to ~100', () => {
    for (const s of compareSegments(atlas, 'region')) {
      expect(s.promoters + s.passives + s.detractors).toBeCloseTo(100, 0);
    }
  });
});
