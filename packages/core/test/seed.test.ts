import { describe, expect, it } from 'vitest';
import { generateSeed } from '../src/seed';

describe('generateSeed', () => {
  it('is deterministic for the same seed', () => {
    expect(generateSeed(7)).toEqual(generateSeed(7));
  });

  it('produces unique response ids and valid scores', () => {
    const { responses, surveys } = generateSeed();
    expect(surveys).toHaveLength(3);
    expect(new Set(responses.map((r) => r.id)).size).toBe(responses.length);
    const valid = responses.every((r) => Number.isInteger(r.npsScore) && r.npsScore >= 0 && r.npsScore <= 10);
    expect(valid).toBe(true);
  });
});
