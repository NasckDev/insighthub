import { describe, expect, it } from 'vitest';
import { monotonePath } from './curve';

describe('monotonePath', () => {
  it('returns an empty path for no points and a move for one', () => {
    expect(monotonePath([])).toBe('');
    expect(monotonePath([{ x: 1, y: 2 }])).toBe('M 1 2');
  });

  it('starts at the first point and ends at the last', () => {
    const path = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 30 },
      { x: 20, y: 20 },
    ]);
    expect(path.startsWith('M 0.00 10.00')).toBe(true);
    expect(path.endsWith('20.00 20.00')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(2);
  });

  it('does not overshoot: control points stay within the neighbours range', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 100 },
      { x: 30, y: 100 },
    ];
    const numbers = [...monotonePath(points).matchAll(/-?\d+\.\d+/g)].map((m) => Number(m[0]));
    const ys = numbers.filter((_, index) => index % 2 === 1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-1e-6);
    expect(Math.max(...ys)).toBeLessThanOrEqual(100 + 1e-6);
  });
});
