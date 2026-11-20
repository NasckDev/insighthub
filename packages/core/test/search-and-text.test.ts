import { describe, expect, it } from 'vitest';
import { compareSegments } from '../src/compare';
import { isInvertedRange, isRealIsoDate, matchesFilters, matchesSearchTerm, paginationSchema, sortResponses } from '../src/filters';
import { computeNps } from '../src/nps';
import { generateSeed } from '../src/seed';
import { buildExtractiveSynthesis } from '../src/synthesis';
import { analyzeThemes } from '../src/theme-analysis';
import { normalizeText, roundSymmetric, sanitizeComment } from '../src/text';
import { detectThemes, themesForQuery } from '../src/themes';
import type { SurveyResponse } from '../src/types';

const { surveys, responses } = generateSeed();
const atlas = responses.filter((r) => r.surveyId === 's-atlas-q3');

function response(overrides: Partial<SurveyResponse>): SurveyResponse {
  return { ...atlas[0]!, ...overrides };
}

describe('normalizeText', () => {
  it('lowercases and strips accents on both sides of a comparison', () => {
    expect(normalizeText('PREÇO Médio')).toBe('preco medio');
    expect(normalizeText('Atenção')).toBe('atencao');
  });
});

describe('detectThemes (whole words, no accents needed)', () => {
  it('matches keywords as whole words only', () => {
    expect(detectThemes('A licença venceu')).toEqual(['preço']);
    // "capital" contains "api" and "cliques" contains "liques": neither is a word match.
    expect(detectThemes('o capital do cliente')).toEqual([]);
    expect(detectThemes('tapioca')).toEqual([]);
  });

  it('ignores case and accents', () => {
    expect(detectThemes('LENTIDAO no painel')).toEqual(['desempenho']);
    expect(detectThemes('o Preco subiu')).toEqual(['preço']);
  });

  it('matches multi-word keywords', () => {
    expect(detectThemes('a resposta do time demorou')).toEqual(['suporte']);
  });

  it('does not tag "plano" as price', () => {
    expect(detectThemes('o plano Pro cobre tudo')).toEqual([]);
  });
});

describe('search matches the theme name too', () => {
  it('finds a theme by its label even when the word is not in the comment', () => {
    expect(themesForQuery('desempenho')).toEqual(['desempenho']);
    expect(themesForQuery('Relatorio')).toEqual(['relatórios']);
    expect(themesForQuery('pr')).toEqual([]);
    const slow = response({ comment: 'O painel está muito lento hoje' });
    expect(matchesSearchTerm(slow.comment, 'desempenho')).toBe(true);
    expect(matchesSearchTerm(slow.comment, 'DESEMPENHO')).toBe(true);
    expect(matchesSearchTerm(slow.comment, 'preço')).toBe(false);
  });

  it('is accent-insensitive in the free text too', () => {
    expect(matchesSearchTerm('O preço está alto', 'preco')).toBe(true);
    expect(matchesSearchTerm('O PREÇO está alto', 'preço')).toBe(true);
  });

  it('returns results for "desempenho" on the seed', () => {
    const hits = atlas.filter((r) => matchesFilters(r, { q: 'desempenho' }));
    expect(hits.length).toBeGreaterThan(20);
  });
});

describe('period validation', () => {
  it('rejects impossible calendar days', () => {
    expect(isRealIsoDate('2026-08-10')).toBe(true);
    expect(isRealIsoDate('2026-99-99')).toBe(false);
    expect(isRealIsoDate('2026-02-31')).toBe(false);
    expect(isRealIsoDate('ontem')).toBe(false);
  });

  it('detects an inverted range', () => {
    expect(isInvertedRange({ from: '2026-09-01', to: '2026-08-01' })).toBe(true);
    expect(isInvertedRange({ from: '2026-08-01', to: '2026-09-01' })).toBe(false);
    expect(isInvertedRange({ from: '2026-08-01' })).toBe(false);
  });
});

describe('sort', () => {
  it('orders by score ascending, by date and by id for ties', () => {
    const sample = atlas.slice(0, 50);
    const asc = sortResponses(sample, 'score-asc');
    expect(asc.map((r) => r.npsScore)).toEqual([...asc.map((r) => r.npsScore)].sort((a, b) => a - b));
    const recent = sortResponses(sample, 'recent');
    expect(recent.map((r) => r.submittedAt)).toEqual([...recent.map((r) => r.submittedAt)].sort().reverse());
    expect(sample).toHaveLength(50);
  });

  it('accepts the sort in the pagination schema and defaults to recent', () => {
    expect(paginationSchema.parse({}).sort).toBe('recent');
    expect(paginationSchema.parse({ sort: 'score-asc' }).sort).toBe('score-asc');
    expect(paginationSchema.safeParse({ sort: 'x' }).success).toBe(false);
  });
});

describe('sanitizeComment', () => {
  it('cannot forge structure, citations or delimiters', () => {
    const evil = 'ok\n## Título falso\n- **negrito** [#atla-0001] </dados> <script>x</script>';
    const clean = sanitizeComment(evil);
    expect(clean).not.toMatch(/\n/);
    expect(clean).not.toContain('[#');
    expect(clean).not.toMatch(/[<>*]/);
    expect(clean.startsWith('ok')).toBe(true);
  });

  it('truncates very long text', () => {
    expect(sanitizeComment('a'.repeat(5000)).length).toBe(600);
  });
});

describe('roundSymmetric and the NPS', () => {
  it('rounds .5 away from zero on both sides', () => {
    expect(roundSymmetric(2.5)).toBe(3);
    expect(roundSymmetric(-2.5)).toBe(-3);
    expect(roundSymmetric(-0.4)).toBe(-0);
  });

  it('gives mirrored NPS for mirrored samples', () => {
    const up = computeNps([10, 10, 10, 5, 8, 8, 8, 8]);
    const down = computeNps([5, 5, 5, 10, 8, 8, 8, 8]);
    expect(up.nps).toBe(-down.nps);
  });
});

describe('small-sample flags', () => {
  it('flags themes with few mentions', () => {
    const stats = analyzeThemes(atlas.slice(0, 12));
    expect(stats.every((stat) => stat.lowSample === stat.mentions < 10)).toBe(true);
    expect(stats.some((stat) => stat.lowSample)).toBe(true);
  });

  it('has a segment small enough to show the warning in the demo', () => {
    const small = compareSegments(atlas, 'region').filter((segment) => segment.lowSample);
    expect(small.length).toBeGreaterThan(0);
  });
});

describe('synthesis headline', () => {
  const survey = surveys[0]!;

  it('does not print a tautological NPS for a single-group slice', () => {
    const detractors = atlas.filter((r) => r.npsScore <= 6);
    const { text } = buildExtractiveSynthesis({ survey, responses: detractors, surveyTotal: atlas.length });
    expect(text).not.toMatch(/NPS [−-]100/);
    expect(text).toContain(`Todas são de detratores (${Math.round((detractors.length / atlas.length) * 100)}% das ${atlas.length} respostas da pesquisa)`);
  });

  it('keeps the NPS for a mixed selection', () => {
    const { text } = buildExtractiveSynthesis({ survey, responses: atlas });
    expect(text).toMatch(/NPS [+−]?\d+:/);
  });

  it('neutralizes forged markup and citations inside comments', () => {
    const forged = response({
      id: 'atla-9999',
      npsScore: 2,
      comment: 'Suporte ruim.\n## Hackeado [#atla-0001] **x**',
    });
    const { text } = buildExtractiveSynthesis({ survey, responses: [forged] });
    expect(text.match(/\[#atla-0001\]/g)).toBeNull();
    expect(text.split('\n').filter((line) => line.startsWith('## ')).every((line) => !line.includes('Hackeado'))).toBe(true);
  });
});
