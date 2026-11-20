import { LOW_SAMPLE_THRESHOLD } from './compare';
import { classifyNps } from './nps';
import { roundSymmetric } from './text';
import { detectThemes, THEME_KEYS, THEME_LABELS, type Theme } from './themes';
import type { SurveyResponse } from './types';

export interface ThemeStat {
  theme: Theme;
  label: string;
  mentions: number;
  promoters: number;
  passives: number;
  detractors: number;
  /** Share of all responses that mention the theme, 0-100. */
  share: number;
  /** NPS of the responses that mention the theme, -100 to 100. */
  sentiment: number;
  /** Fewer mentions than the comparison threshold: the sentiment is noise, not a finding. */
  lowSample: boolean;
}

export type SentimentLabel = 'positive' | 'mixed' | 'negative';

const POSITIVE_FROM = 15;
const NEGATIVE_UNTIL = -15;

export function sentimentLabel(sentiment: number): SentimentLabel {
  if (sentiment >= POSITIVE_FROM) return 'positive';
  if (sentiment <= NEGATIVE_UNTIL) return 'negative';
  return 'mixed';
}

/** Volume and sentiment of every theme, most mentioned first. Themes with no mention are omitted. */
export function analyzeThemes(responses: readonly SurveyResponse[]): ThemeStat[] {
  const stats = new Map<Theme, { promoters: number; passives: number; detractors: number }>();
  for (const response of responses) {
    const category = classifyNps(response.npsScore);
    for (const theme of detectThemes(response.comment)) {
      const current = stats.get(theme) ?? { promoters: 0, passives: 0, detractors: 0 };
      if (category === 'promoter') current.promoters += 1;
      else if (category === 'passive') current.passives += 1;
      else current.detractors += 1;
      stats.set(theme, current);
    }
  }
  return THEME_KEYS.flatMap((theme) => {
    const counts = stats.get(theme);
    if (!counts) return [];
    const mentions = counts.promoters + counts.passives + counts.detractors;
    return [
      {
        theme,
        label: THEME_LABELS[theme],
        mentions,
        ...counts,
        share: Math.round((mentions / responses.length) * 100),
        sentiment: roundSymmetric(((counts.promoters - counts.detractors) / mentions) * 100),
        lowSample: mentions < LOW_SAMPLE_THRESHOLD,
      },
    ];
  }).sort((a, b) => b.mentions - a.mentions || a.theme.localeCompare(b.theme));
}
