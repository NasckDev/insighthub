import {
  analyzeThemes,
  computeFacets,
  computeNps,
  filtersToSearchParams,
  isAbortError,
  pickHighlights,
  withRetry,
  type ResponseFilters,
  type SurveyResponse,
  type SynthesisEvent,
} from '@insighthub/core';
import { buildDistribution, buildTimeline } from '../lib/overview';
import { DataError, type CompareData, type DataClient, type RequestOptions } from './types';

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
}

export interface HttpClientOptions {
  fetchImpl?: typeof fetch;
  /** Read at call time; the token lives in memory only and is sent just to the synthesis endpoint. */
  getToken?: () => string | undefined;
  /** Injectable clock, for the cache lifetime in tests. */
  now?: () => number;
}

const RETRIES = 2;
const BASE_DELAY_MS = 300;
const MAX_PAGE_SIZE = 100;
const CACHE_ENTRIES = 8;
const CACHE_TTL_MS = 60_000;

const MESSAGES = {
  401: 'A API exige um token para esta ação. Informe o token para continuar.',
  403: 'O token informado não tem acesso a esta ação. Confira o token e tente de novo.',
  429: 'A API recebeu requisições demais. Aguarde alguns instantes e tente de novo.',
} as const;

function segment(id: string): string {
  return encodeURIComponent(id);
}

/** Maps an HTTP status to a typed error. Only network failures and 5xx are worth retrying. */
export function errorForStatus(status: number, apiMessage?: string): DataError {
  if (status === 401 || status === 403) return new DataError(MESSAGES[status], 'AUTH');
  if (status === 404) return new DataError(apiMessage ?? 'Não encontrado.', 'NOT_FOUND');
  if (status === 429) return new DataError(MESSAGES[429], 'CLIENT');
  if (status >= 400 && status < 500) {
    return new DataError(apiMessage ?? `A API recusou o pedido (${status}).`, 'CLIENT');
  }
  return new DataError(apiMessage ?? `Erro do servidor (${status}).`, 'SERVER');
}

/**
 * Adapter for apps/api. GETs are retried with backoff on network failures and 5xx only; 4xx errors
 * (bad request, rate limit, auth) fail at once instead of hammering the server.
 */
export function createHttpClient(baseUrl: string, options: HttpClientOptions = {}): DataClient {
  const { fetchImpl = fetch, getToken, now = Date.now } = options;
  const root = baseUrl.replace(/\/+$/, '');
  const cache = new Map<string, { at: number; value: Promise<SurveyResponse[]> }>();

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<Envelope<T>> {
    return withRetry(
      async () => {
        let response: Response;
        try {
          response = await fetchImpl(`${root}/api${path}`, { signal: requestOptions.signal });
        } catch (error: unknown) {
          if (isAbortError(error) || requestOptions.signal?.aborted) throw error;
          throw new DataError('Não foi possível falar com o servidor.', 'NETWORK');
        }
        const body = (await response.json().catch(() => null)) as Envelope<T> | null;
        if (!response.ok) throw errorForStatus(response.status, body?.error?.message);
        if (!body?.success) throw new DataError('Resposta inesperada da API.', 'SERVER');
        return body;
      },
      {
        retries: RETRIES,
        baseDelayMs: BASE_DELAY_MS,
        signal: requestOptions.signal,
        shouldRetry: (error) =>
          error instanceof DataError && (error.code === 'NETWORK' || error.code === 'SERVER'),
      },
    );
  }

  function queryOf(filters: ResponseFilters, extra: Record<string, string> = {}): string {
    const params = filtersToSearchParams(filters);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    const text = params.toString();
    return text ? `?${text}` : '';
  }

  async function fetchPage(surveyId: string, filters: ResponseFilters, page: number) {
    const query = queryOf(filters, { page: String(page), pageSize: String(MAX_PAGE_SIZE) });
    return request<SurveyResponse[]>(`/surveys/${segment(surveyId)}/responses${query}`);
  }

  async function loadAll(surveyId: string, filters: ResponseFilters): Promise<SurveyResponse[]> {
    const first = await fetchPage(surveyId, filters, 1);
    const totalPages = Number(first.meta?.totalPages ?? 1);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => fetchPage(surveyId, filters, index + 2)),
    );
    return [first, ...rest].flatMap((body) => body.data ?? []);
  }

  /**
   * The API has no aggregate endpoints yet, so overview, timeline, themes and facets are derived from
   * the paged responses. One shared, short-lived promise per survey and filter set means those four
   * screens cost one round of requests, not four, and a failed load is never cached.
   */
  function allResponses(surveyId: string, filters: ResponseFilters): Promise<SurveyResponse[]> {
    const key = `${surveyId}|${JSON.stringify(filters)}`;
    const hit = cache.get(key);
    if (hit && now() - hit.at < CACHE_TTL_MS) return hit.value;
    const value = loadAll(surveyId, filters);
    cache.set(key, { at: now(), value });
    value.catch(() => cache.delete(key));
    while (cache.size > CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
    return value;
  }

  return {
    kind: 'http',

    async listSurveys(requestOptions) {
      const body = await request<Awaited<ReturnType<DataClient['listSurveys']>>>('/surveys', requestOptions);
      return body.data ?? [];
    },

    async getSurvey(surveyId, requestOptions) {
      const body = await request<Awaited<ReturnType<DataClient['getSurvey']>>>(
        `/surveys/${segment(surveyId)}`,
        requestOptions,
      );
      if (!body.data) throw new DataError('Pesquisa não encontrada.', 'NOT_FOUND');
      return body.data;
    },

    async getOverview(surveyId, filters) {
      const responses = await allResponses(surveyId, filters);
      return {
        summary: computeNps(responses.map((r) => r.npsScore)),
        distribution: buildDistribution(responses),
      };
    },

    async getTimeline(surveyId, filters) {
      return buildTimeline(await allResponses(surveyId, filters));
    },

    async listResponses(surveyId, filters, pagination, requestOptions) {
      const query = queryOf(filters, {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        ...(pagination.sort ? { sort: pagination.sort } : {}),
      });
      const body = await request<SurveyResponse[]>(`/surveys/${segment(surveyId)}/responses${query}`, requestOptions);
      const meta = body.meta ?? {};
      return {
        items: body.data ?? [],
        total: Number(meta.total ?? 0),
        page: Number(meta.page ?? pagination.page),
        pageSize: Number(meta.pageSize ?? pagination.pageSize),
        totalPages: Number(meta.totalPages ?? 1),
      };
    },

    async getFacets(surveyId, filters) {
      // Facets count against the whole survey, so the unfiltered set (shared across filters) is counted locally.
      return computeFacets(await allResponses(surveyId, {}), filters);
    },

    async getAnalysis(surveyId, filters) {
      const responses = await allResponses(surveyId, filters);
      return { themes: analyzeThemes(responses), highlights: pickHighlights(responses) };
    },

    async getResponse(surveyId, responseId, requestOptions) {
      const body = await request<SurveyResponse>(
        `/surveys/${segment(surveyId)}/responses/${segment(responseId)}`,
        requestOptions,
      );
      if (!body.data) throw new DataError('Resposta não encontrada.', 'NOT_FOUND');
      return body.data;
    },

    async compare(surveyId, dimension, filters, requestOptions) {
      const body = await request<CompareData>(
        `/surveys/${segment(surveyId)}/compare${queryOf(filters, { dimension })}`,
        requestOptions,
      );
      if (!body.data) throw new DataError('Comparação indisponível.', 'SERVER');
      return { ...body.data, truncated: body.meta?.truncated === true };
    },

    async *streamSynthesis(surveyId, filters, signal, focus): AsyncGenerator<SynthesisEvent> {
      let response: Response;
      const token = getToken?.();
      try {
        response = await fetchImpl(`${root}/api/surveys/${segment(surveyId)}/synthesis`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'text/event-stream',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ filters, focus }),
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error) || signal.aborted) throw error;
        throw new DataError('Não foi possível falar com o servidor.', 'NETWORK');
      }
      if (!response.ok || !response.body) throw errorForStatus(response.status);
      yield* parseSse(response.body, signal);
    },
  };
}

function parseEvent(block: string): SynthesisEvent | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  if (!data) return null;
  try {
    return JSON.parse(data) as SynthesisEvent;
  } catch {
    // A malformed frame is skipped; the stream-ended-without-done check reports a truncated answer.
    return null;
  }
}

async function* parseSse(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<SynthesisEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const event = parseEvent(block);
        if (event) yield event;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
