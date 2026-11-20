import {
  generateSeed,
  matchesFilters,
  paginationSchema,
  responseFiltersQuerySchema,
  sortResponses,
  type SynthesisEvent,
} from '@insighthub/core';
import { describe, expect, it } from 'vitest';
import { createHttpClient, errorForStatus } from './http-client';
import { DataError } from './types';

const { responses } = generateSeed();
const atlas = responses.filter((r) => r.surveyId === 's-atlas-q3');

function envelope(data: unknown, meta: Record<string, unknown> | null = null, status = 200): Response {
  return new Response(JSON.stringify({ success: status < 400, data, error: null, meta }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** A fake API over the seed: same filtering, sorting and paging the real one does. */
function fakeApi() {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    const query = Object.fromEntries(url.searchParams);
    const filters = responseFiltersQuerySchema.parse(query);
    const { page, pageSize, sort } = paginationSchema.parse(query);
    const rows = sortResponses(atlas.filter((r) => matchesFilters(r, filters)), sort);
    return envelope(rows.slice((page - 1) * pageSize, page * pageSize), {
      total: rows.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
    });
  };
  return { calls, fetchImpl };
}

describe('http client: sort and paths', () => {
  it('sends the sort to the API and encodes ids in the path', async () => {
    const api = fakeApi();
    const client = createHttpClient('http://api.test', { fetchImpl: api.fetchImpl });
    const page = await client.listResponses('s-atlas-q3', {}, { page: 1, pageSize: 10, sort: 'score-asc' });
    expect(api.calls[0]?.url.searchParams.get('sort')).toBe('score-asc');
    expect(page.items.map((r) => r.npsScore)).toEqual([...page.items.map((r) => r.npsScore)].sort((a, b) => a - b));
    await client.getResponse('s-atlas-q3', 'a/b?c').catch(() => undefined);
    expect(api.calls.at(-1)?.url.pathname).toContain('a%2Fb%3Fc');
  });
});

describe('http client: errors and retries', () => {
  function failing(status: number) {
    let count = 0;
    const fetchImpl: typeof fetch = async () => {
      count += 1;
      return new Response(JSON.stringify({ success: false, data: null, error: { code: 'X', message: 'api diz não' }, meta: null }), { status });
    };
    return { fetchImpl, count: () => count };
  }

  it('turns 401 and 403 into an AUTH error with a useful message, without retrying', async () => {
    for (const status of [401, 403]) {
      const api = failing(status);
      const client = createHttpClient('http://api.test', { fetchImpl: api.fetchImpl });
      const error = await client.listSurveys().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DataError);
      expect((error as DataError).code).toBe('AUTH');
      expect((error as DataError).message).toMatch(/token/i);
      expect(api.count()).toBe(1);
    }
  });

  it('does not retry 400 or 429', async () => {
    for (const status of [400, 429]) {
      const api = failing(status);
      const client = createHttpClient('http://api.test', { fetchImpl: api.fetchImpl });
      const error = (await client.listSurveys().catch((e: unknown) => e)) as DataError;
      expect(error.code).toBe('CLIENT');
      expect(api.count()).toBe(1);
    }
  });

  it('retries a 5xx a limited number of times', async () => {
    const api = failing(503);
    const client = createHttpClient('http://api.test', { fetchImpl: api.fetchImpl });
    const error = (await client.listSurveys().catch((e: unknown) => e)) as DataError;
    expect(error.code).toBe('SERVER');
    expect(api.count()).toBe(3);
  });

  it('classifies statuses', () => {
    expect(errorForStatus(404).code).toBe('NOT_FOUND');
    expect(errorForStatus(500).code).toBe('SERVER');
    expect(errorForStatus(422, 'x').code).toBe('CLIENT');
  });
});

describe('http client: shared loads', () => {
  it('fetches the screens of one filter set once, and facets once per survey', async () => {
    const api = fakeApi();
    const client = createHttpClient('http://api.test', { fetchImpl: api.fetchImpl });
    const pro = { plan: ['pro' as const] };
    await Promise.all([
      client.getOverview('s-atlas-q3', pro),
      client.getTimeline('s-atlas-q3', pro),
      client.getAnalysis('s-atlas-q3', pro),
      client.getFacets('s-atlas-q3', pro),
    ]);
    const proPages = Math.ceil(atlas.filter((r) => r.plan === 'pro').length / 100);
    const allPages = Math.ceil(atlas.length / 100);
    expect(api.calls).toHaveLength(proPages + allPages);

    api.calls.length = 0;
    const free = { plan: ['free' as const] };
    await Promise.all([
      client.getOverview('s-atlas-q3', free),
      client.getTimeline('s-atlas-q3', free),
      client.getAnalysis('s-atlas-q3', free),
      client.getFacets('s-atlas-q3', free),
    ]);
    expect(api.calls).toHaveLength(Math.ceil(atlas.filter((r) => r.plan === 'free').length / 100));
  });

  it('does not cache a failed load', async () => {
    let fail = true;
    const api = fakeApi();
    const fetchImpl: typeof fetch = async (input, init) => {
      if (fail) return new Response('{}', { status: 400 });
      return api.fetchImpl(input, init);
    };
    const client = createHttpClient('http://api.test', { fetchImpl });
    await expect(client.getOverview('s-atlas-q3', {})).rejects.toBeInstanceOf(DataError);
    fail = false;
    await expect(client.getOverview('s-atlas-q3', {})).resolves.toBeDefined();
  });
});

describe('http client: synthesis', () => {
  function sse(events: string[]): Response {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of events) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }

  it('sends the bearer token only on the synthesis call', async () => {
    const seen: (string | null)[] = [];
    const api = fakeApi();
    const fetchImpl: typeof fetch = async (input, init) => {
      if (String(input).endsWith('/synthesis')) {
        seen.push(new Headers(init?.headers).get('authorization'));
        return sse(['data: {"type":"done"}\n\n']);
      }
      seen.push(new Headers(init?.headers).get('authorization'));
      return api.fetchImpl(input, init);
    };
    let token: string | undefined = 'segredo-de-teste-123';
    const client = createHttpClient('http://api.test', { fetchImpl, getToken: () => token });
    await client.listResponses('s-atlas-q3', {}, { page: 1, pageSize: 5 });
    for await (const event of client.streamSynthesis('s-atlas-q3', {}, new AbortController().signal)) {
      void event;
    }
    expect(seen).toEqual([null, 'Bearer segredo-de-teste-123']);
    token = undefined;
    for await (const event of client.streamSynthesis('s-atlas-q3', {}, new AbortController().signal)) {
      void event;
    }
    expect(seen.at(-1)).toBeNull();
  });

  it('answers 401 on synthesis with an AUTH error', async () => {
    const fetchImpl: typeof fetch = async () => new Response('{}', { status: 401 });
    const client = createHttpClient('http://api.test', { fetchImpl });
    const iterator = client.streamSynthesis('s-atlas-q3', {}, new AbortController().signal);
    await expect(iterator.next()).rejects.toMatchObject({ code: 'AUTH' });
  });

  it('skips a malformed SSE frame instead of crashing the stream', async () => {
    const fetchImpl: typeof fetch = async () =>
      sse([
        'data: {"type":"meta","provider":"x","sourceCount":1}\n\n',
        'data: {oops\n\n',
        'data: {"type":"delta","text":"oi"}\n\ndata: {"type":"done"}\n\n',
      ]);
    const client = createHttpClient('http://api.test', { fetchImpl });
    const events: SynthesisEvent[] = [];
    for await (const event of client.streamSynthesis('s-atlas-q3', {}, new AbortController().signal)) events.push(event);
    expect(events.map((e) => e.type)).toEqual(['meta', 'delta', 'done']);
  });
});
