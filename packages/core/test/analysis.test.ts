import { describe, expect, it } from 'vitest';
import { withDeltas, compareSegments } from '../src/compare';
import { computeFacets } from '../src/facets';
import { matchesFilters, filtersToSearchParams, responseFiltersQuerySchema } from '../src/filters';
import { pickHighlights } from '../src/highlights';
import {
  addInsight,
  csvCell,
  decodeShare,
  encodeShare,
  insightsToCsv,
  insightsToMarkdown,
  isShareTooLarge,
  MAX_SHARE_TOKEN,
  mergeInsights,
  parseBoard,
  removeInsight,
  updateInsight,
  type Insight,
} from '../src/insights';
import { generateSeed } from '../src/seed';
import { applyTemplate, findTemplate, SYNTHESIS_TEMPLATES } from '../src/synthesis-templates';
import { buildExtractiveSynthesis } from '../src/synthesis';
import { analyzeThemes, sentimentLabel } from '../src/theme-analysis';
import { squarify } from '../src/treemap';

const { surveys, responses } = generateSeed();
const atlas = responses.filter((r) => r.surveyId === 's-atlas-q3');

function insight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'i-1',
    title: 'Suporte pesa na nota',
    note: 'Levar ao comitê',
    body: '## Resumo\n- **Suporte**: 12 menções [#atla-0001]',
    citations: [{ responseId: 'atla-0001', quote: 'O suporte demora.' }],
    surveyId: 's-atlas-q3',
    surveyTitle: 'Satisfação trimestral',
    question: 'Resumo executivo',
    scope: 'Todas as respostas',
    createdAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('seed realism', () => {
  it('has many distinct comments and a small region segment', () => {
    expect(new Set(atlas.map((r) => r.comment)).size).toBeGreaterThan(60);
  });
});

describe('analyzeThemes', () => {
  it('counts promoters, passives and detractors per theme', () => {
    const stats = analyzeThemes(atlas);
    expect(stats.length).toBeGreaterThanOrEqual(5);
    for (const stat of stats) {
      expect(stat.promoters + stat.passives + stat.detractors).toBe(stat.mentions);
      expect(stat.sentiment).toBeGreaterThanOrEqual(-100);
      expect(stat.sentiment).toBeLessThanOrEqual(100);
    }
    expect(stats.map((s) => s.mentions)).toEqual([...stats.map((s) => s.mentions)].sort((a, b) => b - a));
  });

  it('classifies sentiment with a neutral band', () => {
    expect(sentimentLabel(40)).toBe('positive');
    expect(sentimentLabel(0)).toBe('mixed');
    expect(sentimentLabel(-40)).toBe('negative');
  });
});

describe('filters: theme and period', () => {
  it('matches a theme by keyword and a period inclusively', () => {
    const slow = atlas.find((r) => r.comment.toLowerCase().includes('lento'))!;
    const day = slow.submittedAt.slice(0, 10);
    expect(matchesFilters(slow, { theme: 'desempenho' })).toBe(true);
    expect(matchesFilters(slow, { theme: 'preço' })).toBe(false);
    expect(matchesFilters(slow, { from: day, to: day })).toBe(true);
    expect(matchesFilters(slow, { from: '2099-01-01' })).toBe(false);
    expect(matchesFilters(slow, { to: '2000-01-01' })).toBe(false);
  });

  it('round-trips the new keys through the query string', () => {
    const params = filtersToSearchParams({ theme: 'suporte', from: '2026-08-10', to: '2026-09-01' });
    const parsed = responseFiltersQuerySchema.parse(Object.fromEntries(params));
    expect(parsed).toMatchObject({ theme: 'suporte', from: '2026-08-10', to: '2026-09-01' });
    expect(responseFiltersQuerySchema.safeParse({ from: 'ontem' }).success).toBe(false);
  });
});

describe('computeFacets', () => {
  it('counts a facet ignoring its own filter but respecting the others', () => {
    const facets = computeFacets(atlas, { plan: ['pro'], region: ['sul'] });
    const sul = atlas.filter((r) => r.region === 'sul');
    expect(facets.plan.pro + facets.plan.free + facets.plan.enterprise).toBe(sul.length);
    const proSul = sul.filter((r) => r.plan === 'pro');
    expect(facets.region.sul).toBe(atlas.filter((r) => r.plan === 'pro' && r.region === 'sul').length);
    expect(facets.role.design + facets.role.produto + facets.role.engenharia + facets.role.pesquisa + facets.role.marketing).toBe(proSul.length);
  });
});

describe('pickHighlights', () => {
  it('returns distinct praise and criticism', () => {
    const picks = pickHighlights(atlas, 2);
    expect(picks.filter((p) => p.tone === 'praise')).toHaveLength(2);
    expect(picks.filter((p) => p.tone === 'criticism')).toHaveLength(2);
    expect(new Set(picks.map((p) => p.response.comment)).size).toBe(picks.length);
  });
});

describe('withDeltas', () => {
  it('measures each segment against the overall NPS', () => {
    const stats = compareSegments(atlas, 'plan');
    const deltas = withDeltas(stats, 10);
    expect(deltas.map((d) => d.delta)).toEqual(stats.map((s) => s.nps - 10));
  });
});

describe('synthesis templates and focus', () => {
  it('forces template filters on top of the user filters', () => {
    const detractors = findTemplate('detractors')!;
    expect(applyTemplate(detractors, { plan: ['pro'] })).toEqual({ plan: ['pro'], nps: 'detractor' });
    expect(SYNTHESIS_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('writes a titled, cited text per focus and warns about tiny samples', () => {
    const survey = surveys[0]!;
    const problems = buildExtractiveSynthesis({
      survey,
      responses: atlas.filter((r) => r.npsScore <= 6),
      focus: 'problems',
    });
    expect(problems.text).toContain('## Principais motivos de insatisfação');
    expect(problems.text).toContain('## O que fazer a seguir');
    const ids = new Set(atlas.map((r) => r.id));
    for (const c of problems.citations) expect(ids.has(c.responseId)).toBe(true);
    const tiny = buildExtractiveSynthesis({ survey, responses: atlas.slice(0, 4) });
    expect(tiny.text).toContain('amostra é pequena');
  });
});

describe('squarify', () => {
  it('fills the area with proportional, non-overlapping tiles', () => {
    const rects = squarify(
      [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
      600,
      400,
    );
    expect(rects).toHaveLength(7);
    const area = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(area).toBeCloseTo(600 * 400, 3);
    const biggest = rects[0]!;
    expect(biggest.width * biggest.height).toBeCloseTo((6 / 24) * 600 * 400, 3);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.width).toBeLessThanOrEqual(600 + 1e-9);
      expect(r.y + r.height).toBeLessThanOrEqual(400 + 1e-9);
    }
  });

  it('handles empty and zero-value input', () => {
    expect(squarify([], 100, 100)).toEqual([]);
    expect(squarify([{ value: 0 }], 100, 100)).toEqual([]);
  });
});

describe('insights board', () => {
  it('adds, edits and removes without mutating', () => {
    const board = [insight()];
    const added = addInsight(board, insight({ id: 'i-2' }));
    expect(added.map((i) => i.id)).toEqual(['i-2', 'i-1']);
    expect(board).toHaveLength(1);
    expect(updateInsight(added, 'i-1', { title: 'Novo' }).find((i) => i.id === 'i-1')?.title).toBe('Novo');
    expect(removeInsight(added, 'i-2').map((i) => i.id)).toEqual(['i-1']);
  });

  it('drops invalid entries when loading and merges without duplicates', () => {
    expect(parseBoard([insight(), { id: 'x' }, 42])).toHaveLength(1);
    expect(parseBoard('lixo')).toEqual([]);
    expect(mergeInsights([insight()], [insight(), insight({ id: 'i-9' })]).map((i) => i.id)).toEqual(['i-1', 'i-9']);
  });

  it('exports markdown with notes and sources', () => {
    const md = insightsToMarkdown([insight()]);
    expect(md).toContain('# Quadro de insights');
    expect(md).toContain('## Suporte pesa na nota');
    expect(md).toContain('> Levar ao comitê');
    expect(md).toContain('### Resumo');
    expect(md).toContain('`#atla-0001`');
  });

  it('exports CSV with escaped quotes and neutralized formulas', () => {
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    const csv = insightsToCsv([insight({ title: '=1+1' })]);
    expect(csv.split('\r\n')).toHaveLength(2);
    expect(csv).toContain('"\'=1+1"');
  });

  it('round-trips the share link and rejects garbage', () => {
    const board = [insight({ note: 'Ação: acentuação e emoji ✓' })];
    expect(decodeShare(encodeShare(board))).toEqual(board);
    expect(decodeShare('@@@')).toEqual([]);
    expect(decodeShare('')).toEqual([]);
    expect(decodeShare(encodeShare([insight()]).slice(0, 20))).toEqual([]);
  });
});

describe('insights hardening', () => {
  it('drops duplicate ids when loading and replaces instead of duplicating on add', () => {
    expect(parseBoard([insight(), insight(), insight({ id: 'i-2' })]).map((i) => i.id)).toEqual(['i-1', 'i-2']);
    const board = addInsight([insight()], insight({ title: 'Mesmo id, novo título' }));
    expect(board).toHaveLength(1);
    expect(board[0]?.title).toBe('Mesmo id, novo título');
  });

  it('refuses to add an invalid insight', () => {
    const board = [insight()];
    expect(addInsight(board, insight({ title: '   ' }))).toEqual(board);
    expect(addInsight(board, insight({ body: 'x'.repeat(9000) }))).toEqual(board);
  });

  it('escapes Markdown structure coming from titles, notes and quotes', () => {
    const md = insightsToMarkdown([
      insight({ title: '# Título [link](x) <b>', note: '**nota** com _ênfase_', citations: [{ responseId: 'atla-0001', quote: '[#x] <i>oi</i>' }] }),
    ]);
    expect(md).toContain('## \\# Título \\[link\\](x) \\<b\\>');
    expect(md).toContain('> \\*\\*nota\\*\\* com \\_ênfase\\_');
    expect(md).toContain('\\[\\#x\\] \\<i\\>oi\\</i\\>');
  });

  it('knows when a share token is too large', () => {
    expect(isShareTooLarge('a'.repeat(MAX_SHARE_TOKEN))).toBe(false);
    expect(isShareTooLarge('a'.repeat(MAX_SHARE_TOKEN + 1))).toBe(true);
  });
});

describe('pickHighlights variety', () => {
  it('does not highlight two near-identical comments', () => {
    const base = atlas.find((r) => r.npsScore === 10)!;
    const copy = (id: string, comment: string) => ({ ...base, id, comment, npsScore: 10 });
    const picks = pickHighlights(
      [
        copy('x-1', 'Depois de meses de uso: atendimento humano e rápido, resolveram minha dúvida sobre exportar dados.'),
        copy('x-2', 'Na engenharia, atendimento humano e rápido, resolveram minha dúvida sobre exportar dados por chamado.'),
        copy('x-3', 'O preço é justo e a licença por usuário é previsível para o orçamento do time.'),
      ],
      2,
    ).filter((p) => p.tone === 'praise');
    expect(picks).toHaveLength(2);
    expect(picks.map((p) => p.response.id)).toContain('x-3');
  });
});
