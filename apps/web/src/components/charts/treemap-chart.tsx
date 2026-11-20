import { sentimentLabel, type Theme, type ThemeStat } from '@insighthub/core';
import { useMemo } from 'react';
import { formatNps, formatNumber } from '../../lib/format';
import { AppButton, AppChart, FONT_DISPLAY, FONT_SANS, useIsPhone, type AppChartOption, type Palette } from '../../ui';
import { SENTIMENT_STYLE, escapeHtml, tooltipBox, useChartPalette } from './chart-theme';

interface TreemapChartProps {
  themes: ThemeStat[];
  selected: Theme | undefined;
  onSelect: (theme: Theme) => void;
}

const HEIGHT = 380;

/** Dots and diagonal stripes: the sentiment cue that survives without color vision. */
const DOTS = { symbol: 'circle', symbolSize: 0.7, dashArrayX: [8, 8], dashArrayY: [8, 8], color: 'rgba(120,90,10,0.35)' } as const;
const STRIPES = { symbol: 'rect', rotation: Math.PI / 4, dashArrayX: [1, 0], dashArrayY: [2, 9], color: 'rgba(160,50,30,0.3)' } as const;

function tileFill(sentiment: ReturnType<typeof sentimentLabel>, p: Palette): { color: string; decal?: object } {
  if (sentiment === 'positive') return { color: p.primarySoft };
  if (sentiment === 'mixed') return { color: p.amberSoft, decal: DOTS };
  return { color: p.accentSoft, decal: STRIPES };
}

export function treemapOption(themes: readonly ThemeStat[], selected: Theme | undefined, p: Palette, compact = false): AppChartOption {
  // Narrow screens cut the map into narrow tiles, so the type shrinks to keep a word like "Integrações" whole.
  const size = compact ? { name: 14, count: 22, sent: 11, line: [18, 26, 15] } : { name: 18, count: 30, sent: 12, line: [24, 38, 18] };
  return {
    tooltip: {
      ...tooltipBox(p),
      trigger: 'item',
      formatter: ({ dataIndex }: { dataIndex: number }) => {
        const stat = themes[dataIndex];
        if (!stat) return '';
        const style = SENTIMENT_STYLE[sentimentLabel(stat.sentiment)];
        return `<div style="font-family:'Fraunces Variable',serif;font-size:20px;font-weight:600">${escapeHtml(stat.label)}</div><div style="font-size:12px;color:${p.muted}">${formatNumber(stat.mentions)} menções · ${stat.share}% das respostas</div><div style="font-size:12px">${style.label} · NPS ${formatNps(stat.sentiment)}</div>`;
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        squareRatio: 1,
        itemStyle: { gapWidth: 4, borderColor: p.surface, borderWidth: 0 },
        label: { show: true, position: 'insideTopLeft', overflow: 'truncate', padding: compact ? [8, 8] : [10, 12] },
        data: themes.map((stat) => {
          const sentiment = sentimentLabel(stat.sentiment);
          const fill = tileFill(sentiment, p);
          const isSelected = selected === stat.theme;
          const edge = sentiment === 'positive' ? p.promoterBar : sentiment === 'mixed' ? p.passiveBar : p.detractorBar;
          return {
            name: stat.label,
            value: stat.mentions,
            theme: stat.theme,
            itemStyle: { color: fill.color, decal: fill.decal, borderColor: isSelected ? p.fg : edge, borderWidth: isSelected ? 4 : 2, borderRadius: 12 },
            label: {
              formatter: `{name|${stat.label}}\n{count|${formatNumber(stat.mentions)}}\n{sent|${SENTIMENT_STYLE[sentiment].label} · NPS ${formatNps(stat.sentiment)}${stat.lowSample ? ' · amostra pequena' : ''}}`,
              rich: {
                name: { fontFamily: FONT_DISPLAY, fontSize: size.name, fontWeight: 600, color: p.fg, lineHeight: size.line[0] },
                count: { fontFamily: FONT_DISPLAY, fontSize: size.count, fontWeight: 600, color: p.fg, lineHeight: size.line[1] },
                sent: { fontFamily: FONT_SANS, fontSize: size.sent, fontWeight: 600, color: p[sentiment === 'positive' ? 'promoter' : sentiment === 'mixed' ? 'passive' : 'detractor'], lineHeight: size.line[2] },
              },
            },
          };
        }),
        animationDuration: 700,
      },
    ],
  };
}

/** Treemap of themes: area is the number of mentions; the fill pattern, the word and the number are the sentiment. */
export function TreemapChart({ themes, selected, onSelect }: TreemapChartProps) {
  const palette = useChartPalette();
  const compact = useIsPhone();
  const option = useMemo(() => treemapOption(themes, selected, palette, compact), [themes, selected, palette, compact]);
  const description = themes
    .map((stat) => `${stat.label}: ${stat.mentions} menções, sentimento ${SENTIMENT_STYLE[sentimentLabel(stat.sentiment)].label.toLowerCase()}, NPS ${formatNps(stat.sentiment)}`)
    .join('; ');
  return (
    <AppChart
      option={option}
      height={HEIGHT}
      label={`Mapa de temas: o tamanho é o número de menções. ${description}`}
      onClick={(event) => {
        const data = event.data as { theme?: Theme } | undefined;
        if (data?.theme) onSelect(data.theme);
      }}
    />
  );
}

/** The same choice for keyboard and screen reader users: one button per theme, in the order of the map. */
export function ThemePicker({ themes, selected, onSelect }: TreemapChartProps) {
  return (
    <div role="group" aria-label="Escolher um tema">
    <ul className="ih-row ih-gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {themes.map((stat) => (
        <li key={stat.theme}>
          <AppButton size="sm" variant={selected === stat.theme ? 'primary' : 'secondary'} aria-pressed={selected === stat.theme} onClick={() => onSelect(stat.theme)}>
            {stat.label} · {formatNumber(stat.mentions)}
          </AppButton>
        </li>
      ))}
    </ul>
    </div>
  );
}
