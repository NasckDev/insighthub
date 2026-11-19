import { PLANS, REGIONS, ROLES, type Plan, type Survey, type SurveyResponse } from './types';

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

const FEATURES = ['Dashboards', 'Exportação de dados', 'Filtros avançados', 'Alertas', 'Integração com Slack'];
const PAINS = ['Lentidão', 'Curva de aprendizado', 'Preço', 'Poucas integrações', 'Relatórios limitados'];

const POSITIVE = [
  'A interface é intuitiva e o time encontrou tudo rápido.',
  'O suporte respondeu meu chamado no mesmo dia, atendimento excelente.',
  'Os dashboards e filtros por segmento economizam horas de análise.',
  'A integração com Slack mantém o time atualizado sem esforço.',
  'Carregamento rápido mesmo com milhares de respostas.',
  'Exportar relatórios para a diretoria ficou muito fácil.',
];
const NEUTRAL = [
  'Atende bem, mas o preço do plano pesa no orçamento.',
  'Funciona, porém a navegação entre pesquisas poderia ser mais clara.',
  'Gosto dos gráficos, mas sinto falta de exportar em mais formatos.',
  'Bom produto; a API poderia ter mais exemplos.',
];
const NEGATIVE = [
  'O dashboard fica lento quando aplico muitos filtros, às vezes trava.',
  'Achei a interface confusa e difícil para quem está começando.',
  'O suporte demora dias para responder um chamado simples.',
  'Caro demais para o que entrega no plano atual.',
  'Falta integração com as ferramentas que usamos, a API é limitada.',
  'Os relatórios não deixam comparar segmento com segmento.',
];

const PLAN_BIAS: Record<Plan, number> = { free: -1.5, pro: 0.3, enterprise: 1.2 };

function scoreFor(rng: () => number, plan: Plan, surveyBias: number): number {
  const raw = 7 + PLAN_BIAS[plan] + surveyBias + (rng() + rng() + rng() - 1.5) * 4;
  return Math.max(0, Math.min(10, Math.round(raw)));
}

function commentFor(rng: () => number, score: number): string {
  if (score >= 9) return pick(rng, POSITIVE);
  if (score >= 7) return pick(rng, NEUTRAL);
  return pick(rng, NEGATIVE);
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
  { id: 's-pricing', title: 'Percepção de preço e planos', description: 'Estudo fechado sobre valor percebido por plano e região.', status: 'closed', createdAt: '2026-06-15T12:00:00.000Z', size: 240, bias: -0.8 },
];

const DAY_MS = 86_400_000;

function buildResponse(rng: () => number, spec: SurveySpec, index: number): SurveyResponse {
  const plan = pick(rng, PLANS);
  const npsScore = scoreFor(rng, plan, spec.bias);
  const comment = commentFor(rng, npsScore);
  const pains = PAINS.filter(() => rng() < 0.3);
  const submittedAt = new Date(Date.parse(spec.createdAt) + Math.floor(rng() * 60) * DAY_MS);
  return {
    id: `${spec.id.slice(2, 6)}-${String(index + 1).padStart(4, '0')}`,
    surveyId: spec.id,
    respondentId: `p-${String(Math.floor(rng() * 5000) + 1).padStart(4, '0')}`,
    plan,
    region: pick(rng, REGIONS),
    role: pick(rng, ROLES),
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
