import { describe, expect, it } from 'vitest';
import { formatNps, formatPercent, formatPoints, plural } from './format';

describe('format helpers', () => {
  it('writes NPS with an explicit sign and a typographic minus', () => {
    expect(formatNps(12)).toBe('+12');
    expect(formatNps(-8)).toBe('−8');
    expect(formatNps(0)).toBe('0');
  });

  it('pluralizes points correctly', () => {
    expect(formatPoints(1)).toBe('+1 pt');
    expect(formatPoints(-1)).toBe('−1 pt');
    expect(formatPoints(14)).toBe('+14 pts');
    expect(formatPoints(0)).toBe('0 pts');
  });

  it('pluralizes counts using pt-BR number format', () => {
    expect(plural(1, 'menção', 'menções')).toBe('1 menção');
    expect(plural(1250, 'menção', 'menções')).toBe('1.250 menções');
  });

  it('computes percentages without dividing by zero', () => {
    expect(formatPercent(1, 4)).toBe('25%');
    expect(formatPercent(0, 0)).toBe('0%');
  });
});
