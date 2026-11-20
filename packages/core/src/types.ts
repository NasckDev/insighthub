export const PLANS = ['free', 'pro', 'enterprise'] as const;
export const REGIONS = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'] as const;
export const ROLES = ['produto', 'engenharia', 'design', 'pesquisa', 'marketing'] as const;
export const NPS_CATEGORIES = ['promoter', 'passive', 'detractor'] as const;
export const SEGMENT_DIMENSIONS = ['plan', 'region', 'role'] as const;

export type Plan = (typeof PLANS)[number];
export type Region = (typeof REGIONS)[number];
export type Role = (typeof ROLES)[number];
export type NpsCategory = (typeof NPS_CATEGORIES)[number];
export type SegmentDimension = (typeof SEGMENT_DIMENSIONS)[number];

export type QuestionType = 'nps' | 'single' | 'multi' | 'open';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed';
  createdAt: string;
  questions: Question[];
}

export interface SurveySummary {
  id: string;
  title: string;
  description: string;
  status: Survey['status'];
  createdAt: string;
  responseCount: number;
  nps: number | null;
}

export type AnswerValue = number | string | string[];

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  plan: Plan;
  region: Region;
  role: Role;
  npsScore: number;
  comment: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
}

export interface SegmentStat {
  segment: string;
  count: number;
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
  averageScore: number;
  lowSample: boolean;
}

export interface Citation {
  responseId: string;
  quote: string;
}

export type SynthesisEvent =
  | { type: 'meta'; provider: string; sourceCount: number; totalCount?: number; truncated?: boolean }
  | { type: 'delta'; text: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
