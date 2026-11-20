import type { SegmentDelta, SegmentDimension } from '@insighthub/core';
import { useMemo } from 'react';
import { formatNps, formatNumber, formatPoints } from '../../lib/format';
import { segmentLabel } from '../../lib/labels';
import { AppChart, FONT_SANS, type AppChartOption, type Palette } from '../../ui';
import { tooltipBox, useChartPalette } from './chart-theme';

const MIN_SPAN = 10;
const ROW_HEIGHT = 58;
const AXIS_PADDING = 56;

const DIMENSION_WORD: Record<SegmentDimension, string> = { plan: 'plano', region: 'região', role: 'função' };

/** Diagonal stripes: the "small sample" cue that does not depend on color. */
const STRIPES = { symbol: 'rect', rotation: Math.PI / 4, dashArrayX: [1, 0], dashArrayY: [5, 4], color: 'rgba(255,255,255,0.65)' } as const;

export function divergingOption(stats: readonly SegmentDelta[], dimension: SegmentDimension, p: Palette): AppChartOption {
  const span = Math.max(MIN_SPAN, ...stats.map((stat) => Math.abs(stat.delta)));
  // Room beyond the longest bar for its own label, so the value never runs into the segment name.
  const bound = Math.ceil((span * 1.4) / 5) * 5;
  const names = stats.map((stat) => segmentLabel(dimension, stat.segment));
  return {
    grid: { left: 8, right: 32, top: 8, bottom: 24, containLabel: true },
    tooltip: {
      ...tooltipBox(p),
      trigger: 'item',
      formatter: ({ dataIndex }: { dataIndex: number }) => {
        const stat = stats[dataIndex];
        if (!stat) return '';
        const small = stat.lowSample ? `<div style="color:${p.warnFg};font-size:12px;margin-top:4px">Amostra pequena: o NPS varia muito com poucos dados</div>` : '';
        return `<div style="font-size:12px;color:${p.muted}">${names[dataIndex] ?? ''}</div><div style="font-family:'Fraunces Variable',serif;font-size:22px;font-weight:600">NPS ${formatNps(stat.nps)}</div><div style="font-size:12px;color:${p.muted}">${formatPoints(stat.delta)} em relação ao geral · ${formatNumber(stat.count)} respostas</div>${small}`;
      },
    },
    xAxis: {
      type: 'value',
      min: -bound,
      max: bound,
      splitNumber: 4,
      axisLabel: { color: p.muted, fontFamily: FONT_SANS, fontSize: 11, formatter: (value: number) => formatNps(value) },
      splitLine: { lineStyle: { color: p.line, type: 'dashed' } },
      name: '← abaixo do geral · acima do geral →',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: p.muted, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600 },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: p.fg,
        fontFamily: FONT_SANS,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 18,
        formatter: (name: string, index: number) => {
          const stat = stats[index];
          if (!stat) return name;
          return `{n|${name}}\n{c|n = ${formatNumber(stat.count)}${stat.lowSample ? ' · amostra pequena' : ''}}`;
        },
        rich: { n: { color: p.fg, fontWeight: 600, fontSize: 13, fontFamily: FONT_SANS }, c: { color: p.muted, fontSize: 11, fontFamily: FONT_SANS } },
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 22,
        data: stats.map((stat) => {
          const color = stat.delta >= 0 ? p.promoterBar : p.detractorBar;
          // A bar that fills most of the axis has no room outside for its value, so the value sits on the bar, on a chip.
          const crowded = Math.abs(stat.delta) / bound > 0.55;
          return {
            value: stat.delta,
            label: crowded
              ? { position: stat.delta < 0 ? 'insideLeft' : 'insideRight', backgroundColor: p.surface, borderRadius: 4, padding: [2, 5] }
              : undefined,
            itemStyle: { color, borderRadius: stat.delta >= 0 ? [0, 6, 6, 0] : [6, 0, 0, 6], ...(stat.lowSample ? { decal: STRIPES, borderColor: color, borderWidth: 1.5 } : {}) },
          };
        }),
        label: {
          show: true,
          position: 'outside',
          fontFamily: FONT_SANS,
          fontWeight: 700,
          fontSize: 12,
          color: p.fg,
          formatter: ({ value }: { value: number }) => formatPoints(value),
        },
        markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: p.controlLine, width: 1.5, type: 'solid' }, data: [{ xAxis: 0 }] },
        animationDuration: 700,
      },
    ],
  };
}

interface DivergingChartProps {
  stats: SegmentDelta[];
  dimension: SegmentDimension;
  overallNps: number;
}

/** Horizontal bars diverging from the overall NPS; segments with a small sample are striped and named. */
export function DivergingChart({ stats, dimension, overallNps }: DivergingChartProps) {
  const palette = useChartPalette();
  const option = useMemo(() => divergingOption(stats, dimension, palette), [stats, dimension, palette]);
  const description = stats
    .map((stat) => `${segmentLabel(dimension, stat.segment)}: NPS ${formatNps(stat.nps)}, ${formatPoints(stat.delta)} em relação ao geral, ${formatNumber(stat.count)} respostas${stat.lowSample ? ', amostra pequena' : ''}`)
    .join('; ');
  return (
    <AppChart
      option={option}
      height={stats.length * ROW_HEIGHT + AXIS_PADDING}
      label={`NPS por ${DIMENSION_WORD[dimension]}, comparado ao geral de ${formatNps(overallNps)}. ${description}`}
    />
  );
}
