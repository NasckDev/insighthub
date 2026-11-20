import {
  classifyNps,
  computeNps,
  NPS_MAX,
  NPS_MIN,
  type NpsCategory,
  type SurveyResponse,
} from '@insighthub/core';

export interface DistributionBin {
  score: number;
  count: number;
  category: NpsCategory;
}

export interface TimelinePoint {
  /** ISO date (UTC) of the Monday that opens the week. */
  weekStart: string;
  count: number;
  nps: number;
}

const DAY_MS = 86_400_000;

export function buildDistribution(responses: readonly SurveyResponse[]): DistributionBin[] {
  const counts = new Array<number>(NPS_MAX - NPS_MIN + 1).fill(0);
  for (const response of responses) {
    const index = response.npsScore - NPS_MIN;
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts.map((count, index) => ({
    score: NPS_MIN + index,
    count,
    category: classifyNps(NPS_MIN + index),
  }));
}

function weekStartOf(iso: string): string {
  const date = new Date(iso);
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(midnight - daysSinceMonday * DAY_MS).toISOString().slice(0, 10);
}

/** NPS per ISO week (Monday start), ascending. */
export function buildTimeline(responses: readonly SurveyResponse[]): TimelinePoint[] {
  const weeks = new Map<string, number[]>();
  for (const response of responses) {
    const key = weekStartOf(response.submittedAt);
    const scores = weeks.get(key);
    if (scores) scores.push(response.npsScore);
    else weeks.set(key, [response.npsScore]);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, scores]) => ({ weekStart, count: scores.length, nps: computeNps(scores).nps }));
}
