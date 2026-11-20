import type {
  Facets,
  Highlight,
  NpsBreakdown,
  Page,
  ResponseFilters,
  SegmentDimension,
  SegmentStat,
  Survey,
  SurveyResponse,
  SurveySummary,
  SynthesisEvent,
  SynthesisFocus,
  ThemeStat,
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

export const RESPONSE_SORTS = ['recent', 'oldest', 'score-desc', 'score-asc'] as const;
export type ResponseSort = (typeof RESPONSE_SORTS)[number];

export interface ResponsePagination {
  page: number;
  pageSize: number;
  /** Honored by the demo adapter only; the API has no sort parameter. */
  sort?: ResponseSort;
}

export interface AnalysisData {
  themes: ThemeStat[];
  highlights: Highlight[];
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
    pagination: ResponsePagination,
    options?: RequestOptions,
  ): Promise<ResponsesPage>;
  getFacets(surveyId: string, filters: ResponseFilters, options?: RequestOptions): Promise<Facets>;
  getAnalysis(surveyId: string, filters: ResponseFilters, options?: RequestOptions): Promise<AnalysisData>;
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
    focus?: SynthesisFocus,
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
