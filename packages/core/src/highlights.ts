import { classifyNps } from './nps';
import type { SurveyResponse } from './types';

export interface Highlight {
  response: SurveyResponse;
  tone: 'praise' | 'criticism';
}

function distinctByComment(candidates: readonly SurveyResponse[], limit: number): SurveyResponse[] {
  const seen = new Set<string>();
  const picked: SurveyResponse[] = [];
  const ranked = [...candidates].sort(
    (a, b) => b.comment.length - a.comment.length || a.id.localeCompare(b.id),
  );
  for (const response of ranked) {
    if (seen.has(response.comment)) continue;
    seen.add(response.comment);
    picked.push(response);
    if (picked.length === limit) break;
  }
  return picked;
}

/** The most detailed distinct comments: `perSide` from promoters and `perSide` from detractors. */
export function pickHighlights(responses: readonly SurveyResponse[], perSide = 2): Highlight[] {
  const praise = responses.filter((r) => classifyNps(r.npsScore) === 'promoter');
  const criticism = responses.filter((r) => classifyNps(r.npsScore) === 'detractor');
  return [
    ...distinctByComment(praise, perSide).map((response) => ({ response, tone: 'praise' as const })),
    ...distinctByComment(criticism, perSide).map((response) => ({ response, tone: 'criticism' as const })),
  ];
}
