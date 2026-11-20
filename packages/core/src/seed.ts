import {
  NEGATIVE_COMMENTS,
  NEUTRAL_COMMENTS,
  POSITIVE_COMMENTS,
  ROLE_PREFIX,
  TAILS_CRITICAL,
  TAILS_POSITIVE,
} from './seed-comments';
import { ROLES, type Plan, type Region, type Survey, type SurveyResponse } from './types';

/** Mulberry32: tiny deterministic PRNG so every environment gets identical fictional data. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function pickWeighted<T extends string>(rng: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = rng() * total;
  for (const [key, weight] of entries) {
    cursor -= weight;
    if (cursor < 0) return key;
  }
  return entries[0]![0];
}

const FEATURES = ['Dashboards', 'Exportação de dados', 'Filtros avançados', 'Alertas', 'Integração com Slack'];
const PAINS = ['Lentidão', 'Curva de aprendizado', 'Preço', 'Poucas integrações', 'Relatórios limitados'];

const PLAN_WEIGHTS: Record<Plan, number> = { free: 45, pro: 40, enterprise: 15 };
// Uneven on purpose: small regions produce small segments, which the comparison screen flags.
const REGION_WEIGHTS: Record<Region, number> = {
  sudeste: 40,
  sul: 20,
  nordeste: 20,
  'centro-oeste': 12,
  norte: 8,
};
const PLAN_BIAS: Record<Plan, number> = { free: -1.5, pro: 0.3, enterprise: 1.2 };
const TREND_SPAN_DAYS = 60;
const TREND_GAIN = 1.4;
const BASE_SCORE = 8.9;

function scoreFor(rng: () => number, plan: Plan, surveyBias: number, dayOffset: number): number {
  // Satisfaction drifts up over the collection window, so the evolution chart has a story.
  const trend = (dayOffset / TREND_SPAN_DAYS - 0.5) * TREND_GAIN;
  const raw = BASE_SCORE + PLAN_BIAS[plan] + surveyBias + trend + (rng() + rng() + rng() - 1.5) * 4;
  return Math.max(0, Math.min(10, Math.round(raw)));
}

function commentFor(rng: () => number, score: number, role: (typeof ROLES)[number]): string {
  const bank = score >= 9 ? POSITIVE_COMMENTS : score >= 7 ? NEUTRAL_COMMENTS : NEGATIVE_COMMENTS;
  const base = pick(rng, bank);
  const prefixed =
    rng() < 0.4 ? `${pick(rng, ROLE_PREFIX[role])}${base.charAt(0).toLocaleLowerCase('pt-BR')}${base.slice(1)}` : base;
  const text = prefixed.charAt(0).toLocaleUpperCase('pt-BR') + prefixed.slice(1);
  const tails = score >= 9 ? TAILS_POSITIVE : TAILS_CRITICAL;
  return rng() < 0.2 ? `${text}${pick(rng, tails)}` : text;
}

function buildQuestions(subject: string): Survey['questions'] {
  return [
    { id: 'q-nps', type: 'nps', prompt: `De 0 a 10, quanto você recomendaria ${subject} a um colega?` },
    { id: 'q-feature', type: 'single', prompt: 'Qual recurso você mais usa?', options: FEATURES },
    { id: 'q-pains', type: 'multi', prompt: 'Quais dificuldades você enfrenta?', options: PAINS },
    { id: 'q-comment', type: 'open', prompt: 'Conte o principal motivo da sua nota.' },
  ];
}

interface SurveySpec {
  id: string;
  title: string;
  description: string;
  status: Survey['status'];
  createdAt: string;
  size: number;
  bias: number;
}

const SPECS: SurveySpec[] = [
  { id: 's-atlas-q3', title: 'Satisfação trimestral — Atlas Analytics', description: 'Pulso trimestral com clientes ativos do produto fictício Atlas Analytics.', status: 'active', createdAt: '2026-08-01T12:00:00.000Z', size: 640, bias: 0 },
  { id: 's-onboarding', title: 'Experiência de onboarding', description: 'Primeiros 30 dias de contas novas: ativação, clareza e suporte.', status: 'active', createdAt: '2026-09-10T12:00:00.000Z', size: 320, bias: -0.4 },
  { id: 's-pricing', title: 'Percepção de preço e planos', description: 'Estudo fechado sobre valor percebido por plano e região.', status: 'closed', createdAt: '2026-06-15T12:00:00.000Z', size: 240, bias: -1.4 },
];

const DAY_MS = 86_400_000;

function buildResponse(rng: () => number, spec: SurveySpec, index: number): SurveyResponse {
  const plan = pickWeighted(rng, PLAN_WEIGHTS);
  const dayOffset = Math.floor(rng() * TREND_SPAN_DAYS);
  const role = pick(rng, ROLES);
  const npsScore = scoreFor(rng, plan, spec.bias, dayOffset);
  const comment = commentFor(rng, npsScore, role);
  const pains = PAINS.filter(() => rng() < 0.3);
  const submittedAt = new Date(Date.parse(spec.createdAt) + dayOffset * DAY_MS + Math.floor(rng() * 20) * 3_600_000);
  return {
    id: `${spec.id.slice(2, 6)}-${String(index + 1).padStart(4, '0')}`,
    surveyId: spec.id,
    respondentId: `p-${String(Math.floor(rng() * 5000) + 1).padStart(4, '0')}`,
    plan,
    region: pickWeighted(rng, REGION_WEIGHTS),
    role,
    npsScore,
    comment,
    answers: { 'q-nps': npsScore, 'q-feature': pick(rng, FEATURES), 'q-pains': pains, 'q-comment': comment },
    submittedAt: submittedAt.toISOString(),
  };
}

export interface SeedData {
  surveys: Survey[];
  responses: SurveyResponse[];
}

/** Generates 100% fictional, deterministic research data. */
export function generateSeed(seed = 42): SeedData {
  const rng = createRng(seed);
  const surveys = SPECS.map(({ size: _size, bias: _bias, ...survey }) => ({
    ...survey,
    questions: buildQuestions('o Atlas Analytics'),
  }));
  const responses = SPECS.flatMap((spec) =>
    Array.from({ length: spec.size }, (_, index) => buildResponse(rng, spec, index)),
  );
  return { surveys, responses };
}
