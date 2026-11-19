import type { NpsCategory } from './types';

export const NPS_MIN = 0;
export const NPS_MAX = 10;
const PROMOTER_MIN = 9;
const PASSIVE_MIN = 7;

export function classifyNps(score: number): NpsCategory {
  if (!Number.isInteger(score) || score < NPS_MIN || score > NPS_MAX) {
    throw new RangeError(`NPS score must be an integer between 0 and 10, got ${score}`);
  }
  if (score >= PROMOTER_MIN) return 'promoter';
  if (score >= PASSIVE_MIN) return 'passive';
  return 'detractor';
}

export interface NpsBreakdown {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number;
}

/** NPS = %promoters - %detractors, rounded to an integer in [-100, 100]. */
export function computeNps(scores: readonly number[]): NpsBreakdown {
  const counts = { promoter: 0, passive: 0, detractor: 0 };
  for (const score of scores) counts[classifyNps(score)] += 1;
  const total = scores.length;
  const nps = total === 0 ? 0 : Math.round(((counts.promoter - counts.detractor) / total) * 100);
  return {
    total,
    promoters: counts.promoter,
    passives: counts.passive,
    detractors: counts.detractor,
    nps,
  };
}

/** Inclusive score range for a category, used to build SQL filters. */
export function npsRange(category: NpsCategory): [number, number] {
  if (category === 'promoter') return [PROMOTER_MIN, NPS_MAX];
  if (category === 'passive') return [PASSIVE_MIN, PROMOTER_MIN - 1];
  return [NPS_MIN, PASSIVE_MIN - 1];
}
