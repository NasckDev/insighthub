import {
  abortableSleep,
  analyzeThemes,
  compareSegments,
  computeFacets,
  computeNps,
  createLocalInsightProvider,
  generateSeed,
  matchesFilters,
  paginate,
  sortResponses,
  pickHighlights,
  type ResponseFilters,
  type SeedData,
  type SynthesisFocus,
  type SurveyResponse,
  type SynthesisEvent,
} from '@insighthub/core';
import { buildDistribution, buildTimeline } from '../lib/overview';
import { createFaultController, type FaultController } from './faults';
import {
  DataError,
  type DataClient,
  type PartialInfo,
  type RequestOptions,
} from './types';

export interface DemoClientOptions {
  /** Simulated network latency in ms (0 disables it, used by tests). */
  latencyMs?: number;
  /** Delay between streamed synthesis chunks in ms. */
  chunkDelayMs?: number;
  faults?: FaultController;
  seed?: SeedData;
}

const DEFAULT_LATENCY_MS = 380;
const DEFAULT_CHUNK_DELAY_MS = 28;
const PARTIAL_SHARE = 0.5;
const INTERRUPT_AFTER_DELTAS = 24;

export type DemoClient = DataClient & { faults: FaultController };

export function createDemoClient(options: DemoClientOptions = {}): DemoClient {
  const latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS;
  const chunkDelayMs = options.chunkDelayMs ?? DEFAULT_CHUNK_DELAY_MS;
  const faults = options.faults ?? createFaultController();
  const data = options.seed ?? generateSeed();

  async function simulateNetwork({ signal }: RequestOptions = {}): Promise<void> {
    if (latencyMs > 0) await abortableSleep(latencyMs, signal);
    if (faults.consumeFailure()) {
      throw new DataError('Falha simulada: o servidor não respondeu.', 'SIMULATED');
    }
  }

  function requireSurvey(surveyId: string) {
    const survey = data.surveys.find((item) => item.id === surveyId);
    if (!survey) throw new DataError('Pesquisa não encontrada.', 'NOT_FOUND');
    return survey;
  }

  function responsesOf(surveyId: string, filters: ResponseFilters): SurveyResponse[] {
    requireSurvey(surveyId);
    return data.responses.filter((item) => item.surveyId === surveyId && matchesFilters(item, filters));
  }

  function partialOf<T>(items: readonly T[]): { items: T[]; partial?: PartialInfo } {
    if (faults.getMode() !== 'partial' || items.length < 2) return { items: [...items] };
    const loaded = Math.ceil(items.length * PARTIAL_SHARE);
    return { items: items.slice(0, loaded), partial: { loaded, expected: items.length } };
  }

  return {
    kind: 'demo',
    faults,

    async listSurveys(requestOptions) {
      await simulateNetwork(requestOptions);
      return data.surveys.map((survey) => {
        const scores = data.responses.filter((r) => r.surveyId === survey.id).map((r) => r.npsScore);
        const { questions: _questions, ...summary } = survey;
        return {
          ...summary,
          responseCount: scores.length,
          nps: scores.length ? computeNps(scores).nps : null,
        };
      });
    },

    async getSurvey(surveyId, requestOptions) {
      await simulateNetwork(requestOptions);
      return requireSurvey(surveyId);
    },

    async getOverview(surveyId, filters, requestOptions) {
      await simulateNetwork(requestOptions);
      const responses = responsesOf(surveyId, filters);
      return {
        summary: computeNps(responses.map((r) => r.npsScore)),
        distribution: buildDistribution(responses),
      };
    },

    async getTimeline(surveyId, filters, requestOptions) {
      await simulateNetwork(requestOptions);
      if (faults.getMode() === 'partial') {
        throw new DataError('A série temporal está indisponível no momento.', 'SIMULATED');
      }
      return buildTimeline(responsesOf(surveyId, filters));
    },

    async listResponses(surveyId, filters, pagination, requestOptions) {
      await simulateNetwork(requestOptions);
      const sorted = sortResponses(responsesOf(surveyId, filters), pagination.sort ?? 'recent');
      const page = paginate(sorted, pagination.page, pagination.pageSize);
      const { items, partial } = partialOf(page.items);
      return { ...page, items, partial };
    },

    async getFacets(surveyId, filters, requestOptions) {
      await simulateNetwork(requestOptions);
      requireSurvey(surveyId);
      return computeFacets(
        data.responses.filter((item) => item.surveyId === surveyId),
        filters,
      );
    },

    async getAnalysis(surveyId, filters, requestOptions) {
      await simulateNetwork(requestOptions);
      const responses = responsesOf(surveyId, filters);
      return { themes: analyzeThemes(responses), highlights: pickHighlights(responses) };
    },

    async getResponse(surveyId, responseId, requestOptions) {
      await simulateNetwork(requestOptions);
      requireSurvey(surveyId);
      const found = data.responses.find((r) => r.surveyId === surveyId && r.id === responseId);
      if (!found) throw new DataError('Resposta não encontrada.', 'NOT_FOUND');
      return found;
    },

    async compare(surveyId, dimension, filters, requestOptions) {
      await simulateNetwork(requestOptions);
      const responses = responsesOf(surveyId, filters);
      const { items, partial } = partialOf(compareSegments(responses, dimension));
      return { dimension, overall: computeNps(responses.map((r) => r.npsScore)), segments: items, partial };
    },

    async *streamSynthesis(
      surveyId,
      filters,
      signal,
      focus?: SynthesisFocus,
    ): AsyncGenerator<SynthesisEvent> {
      await simulateNetwork({ signal });
      const survey = requireSurvey(surveyId);
      const provider = createLocalInsightProvider({ chunkDelayMs });
      const surveyTotal = data.responses.filter((item) => item.surveyId === surveyId).length;
      const events = provider.stream(
        { survey, responses: responsesOf(surveyId, filters), focus, surveyTotal },
        signal,
      );
      const interruptAfter =
        faults.getMode() === 'partial' ? INTERRUPT_AFTER_DELTAS : Number.POSITIVE_INFINITY;
      let deltas = 0;
      for await (const event of events) {
        if (event.type === 'delta') {
          deltas += 1;
          if (deltas > interruptAfter) {
            yield { type: 'error', message: 'A conexão com o provedor foi interrompida.' };
            return;
          }
        }
        yield event;
      }
    },
  };
}
