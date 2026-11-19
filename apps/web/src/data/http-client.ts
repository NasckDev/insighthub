import {
  computeNps,
  filtersToSearchParams,
  isAbortError,
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

const RETRIES = 2;
const BASE_DELAY_MS = 300;
const MAX_PAGE_SIZE = 100;

/** Adapter for apps/api. GETs are retried with backoff on network failures and 5xx. */
export function createHttpClient(baseUrl: string, fetchImpl: typeof fetch = fetch): DataClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function request<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
    return withRetry(
      async () => {
        let response: Response;
        try {
          response = await fetchImpl(`${root}/api${path}`, { signal: options.signal });
        } catch (error: unknown) {
          if (isAbortError(error) || options.signal?.aborted) throw error;
          throw new DataError('Não foi possível falar com o servidor.', 'NETWORK');
        }
        const body = (await response.json().catch(() => null)) as Envelope<T> | null;
        if (response.status === 404) {
          throw new DataError(body?.error?.message ?? 'Não encontrado.', 'NOT_FOUND');
        }
        if (!response.ok || !body?.success) {
          throw new DataError(body?.error?.message ?? `Erro do servidor (${response.status}).`, 'SERVER');
        }
        return body;
      },
      {
        retries: RETRIES,
        baseDelayMs: BASE_DELAY_MS,
        signal: options.signal,
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

  /** The API has no aggregate endpoints for the overview, so it is derived from the paged responses. */
  async function allResponses(
    surveyId: string,
    filters: ResponseFilters,
    options?: RequestOptions,
  ): Promise<SurveyResponse[]> {
    const items: SurveyResponse[] = [];
    for (let page = 1; ; page += 1) {
      const query = queryOf(filters, { page: String(page), pageSize: String(MAX_PAGE_SIZE) });
      const body = await request<SurveyResponse[]>(`/surveys/${surveyId}/responses${query}`, options);
      items.push(...(body.data ?? []));
      if (page >= Number(body.meta?.totalPages ?? 1)) return items;
    }
  }

  return {
    kind: 'http',

    async listSurveys(options) {
      const body = await request<Awaited<ReturnType<DataClient['listSurveys']>>>('/surveys', options);
      return body.data ?? [];
    },

    async getSurvey(surveyId, options) {
      const body = await request<Awaited<ReturnType<DataClient['getSurvey']>>>(
        `/surveys/${surveyId}`,
        options,
      );
      if (!body.data) throw new DataError('Pesquisa não encontrada.', 'NOT_FOUND');
      return body.data;
    },

    async getOverview(surveyId, filters, options) {
      const responses = await allResponses(surveyId, filters, options);
      return {
        summary: computeNps(responses.map((r) => r.npsScore)),
        distribution: buildDistribution(responses),
      };
    },

    async getTimeline(surveyId, filters, options) {
      return buildTimeline(await allResponses(surveyId, filters, options));
    },

    async listResponses(surveyId, filters, pagination, options) {
      const query = queryOf(filters, {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      const body = await request<SurveyResponse[]>(`/surveys/${surveyId}/responses${query}`, options);
      const meta = body.meta ?? {};
      return {
        items: body.data ?? [],
        total: Number(meta.total ?? 0),
        page: Number(meta.page ?? pagination.page),
        pageSize: Number(meta.pageSize ?? pagination.pageSize),
        totalPages: Number(meta.totalPages ?? 1),
      };
    },

    async getResponse(surveyId, responseId, options) {
      const body = await request<SurveyResponse>(`/surveys/${surveyId}/responses/${responseId}`, options);
      if (!body.data) throw new DataError('Resposta não encontrada.', 'NOT_FOUND');
      return body.data;
    },

    async compare(surveyId, dimension, filters, options) {
      const body = await request<CompareData>(
        `/surveys/${surveyId}/compare${queryOf(filters, { dimension })}`,
        options,
      );
      if (!body.data) throw new DataError('Comparação indisponível.', 'SERVER');
      return body.data;
    },

    async *streamSynthesis(surveyId, filters, signal): AsyncGenerator<SynthesisEvent> {
      let response: Response;
      try {
        response = await fetchImpl(`${root}/api/surveys/${surveyId}/synthesis`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
          body: JSON.stringify({ filters }),
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error) || signal.aborted) throw error;
        throw new DataError('Não foi possível falar com o servidor.', 'NETWORK');
      }
      if (!response.ok || !response.body) {
        throw new DataError(`A síntese falhou (${response.status}).`, 'SERVER');
      }
      yield* parseSse(response.body, signal);
    },
  };
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
        const data = block
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (data) yield JSON.parse(data) as SynthesisEvent;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
