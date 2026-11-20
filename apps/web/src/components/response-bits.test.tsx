import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findHighlightRanges, HighlightText } from './response-bits';

describe('findHighlightRanges', () => {
  it('ignores accents and case, and maps back to the original text', () => {
    const text = 'O Preço está alto; o preco cresce';
    const ranges = findHighlightRanges(text, 'PRECO');
    expect(ranges.map(([a, b]) => text.slice(a, b))).toEqual(['Preço', 'preco']);
  });

  it('finds terms typed with accents in unaccented text', () => {
    const text = 'a lentidao incomoda';
    expect(findHighlightRanges(text, 'lentidão').map(([a, b]) => text.slice(a, b))).toEqual(['lentidao']);
  });

  it('returns nothing for an empty or blank term', () => {
    expect(findHighlightRanges('abc', '')).toEqual([]);
    expect(findHighlightRanges('abc', '   ')).toEqual([]);
    expect(findHighlightRanges('abc', undefined)).toEqual([]);
  });
});

describe('HighlightText', () => {
  it('wraps every match in <mark> and keeps the surrounding text', () => {
    const { container } = render(<HighlightText text="Suporte bom, suporte lento" term="suporte" />);
    const marks = [...container.querySelectorAll('mark')].map((node) => node.textContent);
    expect(marks).toEqual(['Suporte', 'suporte']);
    expect(container.textContent).toBe('Suporte bom, suporte lento');
  });
});
