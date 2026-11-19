import { createLocalInsightProvider } from '@insighthub/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase, ensureSchema, seedIfEmpty } from '../src/db/client';
import { createSurveyRepository } from '../src/repositories/survey-repository';

interface Envelope {
  success: boolean;
  data: unknown;
  error: { code: string; details?: unknown } | null;
  meta: Record<string, unknown> | null;
}

function buildApp(rateLimitPerMinute = 1_000) {
  const db = createDatabase(':memory:');
  const app = createApp({
    repo: createSurveyRepository(db),
    provider: createLocalInsightProvider({ chunkDelayMs: 0 }),
    corsOrigins: ['http://localhost:5173'],
    rateLimitPerMinute,
    synthesisLimitPerMinute: 5,
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
    const { body } = await getJson('/api/surveys/s-atlas-q3/responses?plan=enterprise&nps=promoter&pageSize=5');
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
