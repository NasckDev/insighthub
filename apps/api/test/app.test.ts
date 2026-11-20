import { createLocalInsightProvider, generateSeed, matchesFilters, sortResponses } from '@insighthub/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase, ensureSchema, seedIfEmpty } from '../src/db/client';
import { loadEnv } from '../src/env';
import { createSurveyRepository } from '../src/repositories/survey-repository';

interface Envelope {
  success: boolean;
  data: unknown;
  error: { code: string; details?: unknown } | null;
  meta: Record<string, unknown> | null;
}

function buildApp(rateLimitPerMinute = 1_000, synthesisToken?: string) {
  const db = createDatabase(':memory:');
  const app = createApp({
    repo: createSurveyRepository(db),
    provider: createLocalInsightProvider({ chunkDelayMs: 0 }),
    corsOrigins: ['http://localhost:5173'],
    rateLimitPerMinute,
    synthesisLimitPerMinute: 5,
    synthesisToken,
  });
  return { db, app };
}

describe('InsightHub API', () => {
  const { db, app } = buildApp();

  beforeAll(async () => {
    await ensureSchema(db);
    await seedIfEmpty(db);
  });

  async function getJson(path: string): Promise<{ status: number; body: Envelope }> {
    const res = await app.request(path);
    return { status: res.status, body: (await res.json()) as Envelope };
  }

  it('lists surveys with response counts inside the envelope', async () => {
    const { status, body } = await getJson('/api/surveys');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
  });

  it('paginates and filters responses', async () => {
    const { body } = await getJson(
      '/api/surveys/s-atlas-q3/responses?plan=enterprise&nps=promoter&pageSize=5',
    );
    const items = body.data as { plan: string; npsScore: number }[];
    expect(items).toHaveLength(5);
    expect(items.every((r) => r.plan === 'enterprise' && r.npsScore >= 9)).toBe(true);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 5 });
  });

  it('searches comments safely (wildcards are literal)', async () => {
    const { body } = await getJson('/api/surveys/s-atlas-q3/responses?q=%25');
    expect(body.meta).toMatchObject({ total: 0 });
  });

  it('rejects invalid filters with a 400 validation envelope', async () => {
    const { status, body } = await getJson('/api/surveys/s-atlas-q3/responses?plan=gold&pageSize=999');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for unknown surveys and malformed ids', async () => {
    expect((await getJson('/api/surveys/nope')).status).toBe(404);
    expect((await getJson('/api/surveys/DROP%20TABLE')).status).toBe(400);
  });

  it('compares segments for a dimension', async () => {
    const { body } = await getJson('/api/surveys/s-atlas-q3/compare?dimension=region');
    const data = body.data as { segments: { segment: string }[] };
    expect(data.segments).toHaveLength(5);
  });

  it('streams a synthesis over SSE with citations', async () => {
    const res = await app.request('/api/surveys/s-atlas-q3/synthesis', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filters: { plan: ['free'] } }),
    });
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('event: meta');
    expect(text).toContain('event: citation');
    expect(text).toContain('event: done');
  });

  it('sorts by score on the server and the order is stable across pages', async () => {
    const asc = await getJson('/api/surveys/s-atlas-q3/responses?sort=score-asc&pageSize=40');
    const scores = (asc.body.data as { npsScore: number }[]).map((r) => r.npsScore);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    const desc = await getJson('/api/surveys/s-atlas-q3/responses?sort=score-desc&pageSize=5');
    expect((desc.body.data as { npsScore: number }[])[0]?.npsScore).toBe(10);
    const oldest = await getJson('/api/surveys/s-atlas-q3/responses?sort=oldest&pageSize=5');
    const days = (oldest.body.data as { submittedAt: string }[]).map((r) => r.submittedAt);
    expect(days).toEqual([...days].sort());
    expect((await getJson('/api/surveys/s-atlas-q3/responses?sort=x')).status).toBe(400);
  });

  it('agrees with the browser demo on accents, case, themes and whole words', async () => {
    const { responses } = generateSeed();
    const atlas = responses.filter((r) => r.surveyId === 's-atlas-q3');
    for (const query of ['preco', 'PREÇO', 'desempenho', 'Lentidao', 'suporte']) {
      const { body } = await getJson(`/api/surveys/s-atlas-q3/responses?q=${encodeURIComponent(query)}&pageSize=1`);
      const expected = atlas.filter((r) => matchesFilters(r, { q: query })).length;
      expect(body.meta).toMatchObject({ total: expected });
      expect(expected).toBeGreaterThan(0);
    }
    const themed = await getJson('/api/surveys/s-atlas-q3/responses?theme=preço&pageSize=1');
    expect(themed.body.meta).toMatchObject({
      total: atlas.filter((r) => matchesFilters(r, { theme: 'preço' })).length,
    });
  });

  it('orders memory-filtered pages like the demo does', async () => {
    const { responses } = generateSeed();
    const expected = sortResponses(
      responses.filter((r) => r.surveyId === 's-atlas-q3' && matchesFilters(r, { q: 'suporte' })),
      'score-asc',
    )
      .slice(0, 10)
      .map((r) => r.id);
    const { body } = await getJson('/api/surveys/s-atlas-q3/responses?q=suporte&sort=score-asc&pageSize=10');
    expect((body.data as { id: string }[]).map((r) => r.id)).toEqual(expected);
  });

  it('validates the period and reports the truncation flag', async () => {
    expect((await getJson('/api/surveys/s-atlas-q3/responses?from=2026-99-99')).status).toBe(400);
    const { body } = await getJson('/api/surveys/s-atlas-q3/compare?dimension=plan');
    expect(body.meta).toMatchObject({ truncated: false });
  });

  it('answers 400 to a synthesis body that is not JSON', async () => {
    const res = await app.request('/api/surveys/s-atlas-q3/synthesis', { method: 'POST', body: '{nope' });
    expect(res.status).toBe(400);
    expect(((await res.json()) as Envelope).error?.code).toBe('INVALID_JSON');
  });

  it('sends honest counts in the synthesis meta event', async () => {
    const res = await app.request('/api/surveys/s-atlas-q3/synthesis', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filters: { plan: ['free'] } }),
    });
    const text = await res.text();
    const meta = /data: ({"type":"meta".*})/.exec(text)?.[1];
    const event = JSON.parse(meta ?? '{}') as { sourceCount: number; totalCount: number };
    expect(event.sourceCount).toBe(event.totalCount);
    expect(event.totalCount).toBeGreaterThan(0);
  });

  it('does not spend the rate limit on CORS preflights', async () => {
    const limited = buildApp(2);
    for (let i = 0; i < 10; i += 1) {
      const res = await limited.app.request('/api/health', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' },
      });
      expect(res.status).not.toBe(429);
    }
  });

  it('allows CORS only for configured origins', async () => {
    const allowed = await app.request('/api/health', { headers: { Origin: 'http://localhost:5173' } });
    const denied = await app.request('/api/health', { headers: { Origin: 'https://evil.example' } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('rate limiting', () => {
  it('answers 429 after the limit is exceeded', async () => {
    const { app } = buildApp(2);
    const statuses = [];
    for (let i = 0; i < 3; i += 1) statuses.push((await app.request('/api/health')).status);
    expect(statuses).toEqual([200, 200, 429]);
  });
});

describe('synthesis authentication', () => {
  const token = 'segredo-de-teste-123456';
  const { db, app } = buildApp(1_000, token);

  beforeAll(async () => {
    await ensureSchema(db);
    await seedIfEmpty(db);
  });

  function postSynthesis(headers: Record<string, string> = {}) {
    return app.request('/api/surveys/s-atlas-q3/synthesis', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ filters: {} }),
    });
  }

  it('rejects a missing token with 401', async () => {
    const res = await postSynthesis();
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
    expect(((await res.json()) as Envelope).error?.code).toBe('UNAUTHORIZED');
  });

  it('rejects a wrong token with 401', async () => {
    expect((await postSynthesis({ authorization: 'Bearer outro-token-qualquer' })).status).toBe(401);
    expect((await postSynthesis({ authorization: token })).status).toBe(401);
  });

  it('accepts the right token', async () => {
    const res = await postSynthesis({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('event: done');
  });

  it('keeps read endpoints open', async () => {
    expect((await app.request('/api/surveys')).status).toBe(200);
  });
});

describe('environment', () => {
  it('refuses to start with the Claude provider and no API token', () => {
    expect(() => loadEnv({ ANTHROPIC_API_KEY: 'sk-test' })).toThrow(/INSIGHTHUB_API_TOKEN/);
  });

  it('accepts the Claude provider when a token is set', () => {
    const env = loadEnv({ ANTHROPIC_API_KEY: 'sk-test', INSIGHTHUB_API_TOKEN: 'x'.repeat(16) });
    expect(env.INSIGHTHUB_API_TOKEN).toHaveLength(16);
  });

  it('does not require a token with the local provider', () => {
    expect(loadEnv({}).INSIGHTHUB_API_TOKEN).toBeUndefined();
  });
});
