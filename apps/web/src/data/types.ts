import type {
  NpsBreakdown,
  Page,
  ResponseFilters,
  SegmentDimension,
  SegmentStat,
  Survey,
  SurveyResponse,
  SurveySummary,
  SynthesisEvent,
} from '@insighthub/core';
import type { DistributionBin, TimelinePoint } from '../lib/overview';

export interface RequestOptions {
  signal?: AbortSignal;
}

/** Set when the backend answered, but with less data than it should have. */
export interface PartialInfo {
  loaded: number;
  expected: number;
}

export interface OverviewData {
  summary: NpsBreakdown;
  distribution: DistributionBin[];
}

export interface ResponsesPage extends Page<SurveyResponse> {
  partial?: PartialInfo;
}

export interface CompareData {
  dimension: SegmentDimension;
  overall: NpsBreakdown;
  segments: SegmentStat[];
  partial?: PartialInfo;
}

export interface DataClient {
  /** `demo` runs the core in the browser; `http` talks to apps/api. */
  readonly kind: 'demo' | 'http';
  listSurveys(options?: RequestOptions): Promise<SurveySummary[]>;
  getSurvey(surveyId: string, options?: RequestOptions): Promise<Survey>;
  getOverview(surveyId: string, filters: ResponseFilters, options?: RequestOptions): Promise<OverviewData>;
  getTimeline(surveyId: string, filters: ResponseFilters, options?: RequestOptions): Promise<TimelinePoint[]>;
  listResponses(
    surveyId: string,
    filters: ResponseFilters,
    pagination: { page: number; pageSize: number },
    options?: RequestOptions,
  ): Promise<ResponsesPage>;
  getResponse(surveyId: string, responseId: string, options?: RequestOptions): Promise<SurveyResponse>;
  compare(
    surveyId: string,
    dimension: SegmentDimension,
    filters: ResponseFilters,
    options?: RequestOptions,
  ): Promise<CompareData>;
  streamSynthesis(
    surveyId: string,
    filters: ResponseFilters,
    signal: AbortSignal,
  ): AsyncGenerator<SynthesisEvent>;
}

export class DataError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NETWORK' | 'SIMULATED' | 'SERVER',
  ) {
    super(message);
    this.name = 'DataError';
  }
}
