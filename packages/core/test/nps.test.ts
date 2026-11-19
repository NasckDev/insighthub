import { describe, expect, it } from 'vitest';
import { classifyNps, computeNps, npsRange } from '../src/nps';

describe('classifyNps', () => {
  it.each([
    [0, 'detractor'],
    [6, 'detractor'],
    [7, 'passive'],
    [8, 'passive'],
    [9, 'promoter'],
    [10, 'promoter'],
  ] as const)('classifies %i as %s', (score, expected) => {
    expect(classifyNps(score)).toBe(expected);
  });

  it('rejects out-of-range and non-integer scores', () => {
    expect(() => classifyNps(11)).toThrow(RangeError);
    expect(() => classifyNps(-1)).toThrow(RangeError);
    expect(() => classifyNps(7.5)).toThrow(RangeError);
  });
});

describe('computeNps', () => {
  it('returns %promoters - %detractors', () => {
    const result = computeNps([10, 9, 8, 3]);
    expect(result).toEqual({ total: 4, promoters: 2, passives: 1, detractors: 1, nps: 25 });
  });

  it('returns 0 for an empty sample', () => {
    expect(computeNps([]).nps).toBe(0);
  });

  it('spans -100 to 100', () => {
    expect(computeNps([0, 1]).nps).toBe(-100);
    expect(computeNps([10, 10]).nps).toBe(100);
  });
});

describe('npsRange', () => {
  it('maps categories to inclusive score ranges', () => {
    expect(npsRange('promoter')).toEqual([9, 10]);
    expect(npsRange('passive')).toEqual([7, 8]);
    expect(npsRange('detractor')).toEqual([0, 6]);
  });
});
