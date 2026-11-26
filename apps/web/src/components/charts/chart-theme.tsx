import type { SentimentLabel } from '@insighthub/core';
import type { ReactNode } from 'react';
import { FONT_SANS, FrownOutlined, MehOutlined, PALETTES, SmileOutlined, useThemeMode, type Palette, type TagTone } from '../../ui';

/** Palette of the current theme, for chart options (ECharts cannot read CSS variables). */
export function useChartPalette(): Palette {
  return PALETTES[useThemeMode()];
}

/** Tooltip box that matches the app: surface color, thin line, rounded corners and the app font. */
export function tooltipBox(p: Palette) {
  return {
    backgroundColor: p.surface,
    borderColor: p.line,
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: p.fg, fontFamily: FONT_SANS, fontSize: 13 },
    extraCssText: 'border-radius:12px;box-shadow:0 12px 32px -16px rgb(18 21 40 / 0.28);',
    confine: true,
  } as const;
}

export interface SentimentStyle {
  label: string;
  tone: TagTone;
  icon: ReactNode;
  /** Range text used in legends. */
  range: string;
}

export const SENTIMENT_STYLE: Record<SentimentLabel, SentimentStyle> = {
  positive: { label: 'Positivo', tone: 'promoter', icon: <SmileOutlined aria-hidden="true" />, range: 'NPS ≥ +15' },
  mixed: { label: 'Misto', tone: 'passive', icon: <MehOutlined aria-hidden="true" />, range: 'entre −15 e +15' },
  negative: { label: 'Negativo', tone: 'detractor', icon: <FrownOutlined aria-hidden="true" />, range: 'NPS ≤ −15' },
};

export function bandColors(p: Palette) {
  return { promoter: p.promoterBar, passive: p.passiveBar, detractor: p.detractorBar } as const;
}

/** `#rrggbb` plus an alpha channel, for the soft tint behind a stronger color. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${channel}`;
}

/** Escapes text that goes into a tooltip's HTML string. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}
