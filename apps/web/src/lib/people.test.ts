import { describe, expect, it } from 'vitest';
import { personOf } from './people';

describe('personOf', () => {
  it('is stable for the same respondent and varies across respondents', () => {
    expect(personOf('p-0001')).toEqual(personOf('p-0001'));
    const names = new Set(Array.from({ length: 50 }, (_, i) => personOf(`p-${i}`).name));
    expect(names.size).toBeGreaterThan(20);
  });

  it('builds two-letter initials', () => {
    expect(personOf('p-0042').initials).toMatch(/^\p{Lu}{2}$/u);
  });
});
