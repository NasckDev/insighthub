import { computeNps } from './nps';
import type { SegmentDimension, SegmentStat, SurveyResponse } from './types';

/** Segments with fewer responses than this are flagged so the UI can warn about noise. */
export const LOW_SAMPLE_THRESHOLD = 10;

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function compareSegments(
  responses: readonly SurveyResponse[],
  dimension: SegmentDimension,
): SegmentStat[] {
  const groups = new Map<string, number[]>();
  for (const response of responses) {
    const key = response[dimension];
    groups.set(key, [...(groups.get(key) ?? []), response.npsScore]);
  }
  return [...groups.entries()]
    .map(([segment, scores]) => {
      const breakdown = computeNps(scores);
      return {
        segment,
        count: breakdown.total,
        nps: breakdown.nps,
        promoters: percent(breakdown.promoters, breakdown.total),
        passives: percent(breakdown.passives, breakdown.total),
        detractors: percent(breakdown.detractors, breakdown.total),
        averageScore: average(scores),
        lowSample: breakdown.total < LOW_SAMPLE_THRESHOLD,
      };
    })
    .sort((a, b) => b.nps - a.nps || a.segment.localeCompare(b.segment));
}

export interface SegmentDelta extends SegmentStat {
  /** NPS points above (+) or below (-) the overall NPS. */
  delta: number;
}

export function withDeltas(stats: readonly SegmentStat[], overallNps: number): SegmentDelta[] {
  return stats.map((stat) => ({ ...stat, delta: stat.nps - overallNps }));
}
