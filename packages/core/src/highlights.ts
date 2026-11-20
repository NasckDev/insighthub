import { classifyNps } from './nps';
import { normalizeText } from './text';
import { detectThemes } from './themes';
import type { SurveyResponse } from './types';

export interface Highlight {
  response: SurveyResponse;
  tone: 'praise' | 'criticism';
}

const SCORE_LENGTH_CAP = 160;
const SIMILARITY_LIMIT = 0.6;

function wordsOf(text: string): Set<string> {
  return new Set(normalizeText(text).match(/[a-z0-9]{3,}/g) ?? []);
}

/** Share of words two comments have in common (Jaccard), so near-copies are not both highlighted. */
function similarity(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}
const THEME_WEIGHT = 100;

/**
 * Richness of a comment: how many themes it covers first, then its length (capped, so a tacked-on
 * closing sentence does not make a comment "more detailed"), then the id for a stable order.
 */
function richness(response: SurveyResponse): number {
  return detectThemes(response.comment).length * THEME_WEIGHT + Math.min(response.comment.length, SCORE_LENGTH_CAP);
}

function distinctByComment(candidates: readonly SurveyResponse[], limit: number): SurveyResponse[] {
  const seen = new Set<string>();
  const pickedWords: Set<string>[] = [];
  const picked: SurveyResponse[] = [];
  const ranked = candidates
    .map((response) => ({ response, score: richness(response) }))
    .sort((a, b) => b.score - a.score || a.response.id.localeCompare(b.response.id));
  for (const { response } of ranked) {
    if (seen.has(response.comment)) continue;
    const words = wordsOf(response.comment);
    if (pickedWords.some((other) => similarity(words, other) >= SIMILARITY_LIMIT)) continue;
    seen.add(response.comment);
    pickedWords.push(words);
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
