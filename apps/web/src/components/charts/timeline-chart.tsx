import { LOW_SAMPLE_THRESHOLD } from '@insighthub/core';
import { useMemo } from 'react';
import { formatDate, formatDayMonth, formatDayMonthShort, formatNps, formatNumber } from '../../lib/format';
import type { TimelinePoint } from '../../lib/overview';
import { AppChart, FONT_SANS, type AppChartOption, type Palette } from '../../ui';
import { tooltipBox, useChartPalette, withAlpha } from './chart-theme';

const TICK_STEP = 20;
const PADDING = 8;

function niceDomain(points: readonly TimelinePoint[]): [number, number] {
  const values = points.map((point) => point.nps);
  const lo = Math.floor((Math.min(0, ...values) - PADDING) / TICK_STEP) * TICK_STEP;
  const hi = Math.ceil((Math.max(0, ...values) + PADDING) / TICK_STEP) * TICK_STEP;
  return [Math.max(-100, lo), Math.min(100, hi)];
}

export function describeTimeline(points: readonly TimelinePoint[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return 'Sem dados';
  return `Evolução semanal do NPS de ${formatDayMonth(first.weekStart)} a ${formatDayMonth(last.weekStart)}: começa em ${formatNps(first.nps)} e termina em ${formatNps(last.nps)}.`;
}

export function timelineOption(points: readonly TimelinePoint[], p: Palette): AppChartOption {
  const [lo, hi] = niceDomain(points);
  return {
    grid: { left: 8, right: 20, top: 20, bottom: 8, containLabel: true },
    tooltip: {
      ...tooltipBox(p),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: p.controlLine, type: 'dashed' } },
      formatter: (params: { dataIndex: number } | { dataIndex: number }[]) => {
        const index = Array.isArray(params) ? (params[0]?.dataIndex ?? 0) : params.dataIndex;
        const point = points[index];
        if (!point) return '';
        const small = point.count < LOW_SAMPLE_THRESHOLD ? ' · amostra pequena' : '';
        return `<div style="font-size:12px;color:${p.muted}">Semana de ${formatDate(point.weekStart)}</div><div style="font-family:'Fraunces Variable',serif;font-size:22px;font-weight:600">NPS ${formatNps(point.nps)}</div><div style="font-size:12px;color:${p.muted}">${formatNumber(point.count)} respostas${small}</div>`;
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((point) => formatDayMonthShort(point.weekStart)),
      axisLine: { lineStyle: { color: p.line } },
      axisTick: { show: false },
      axisLabel: { color: p.muted, fontFamily: FONT_SANS, fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      min: lo,
      max: hi,
      interval: TICK_STEP,
      axisLabel: { color: p.muted, fontFamily: FONT_SANS, fontSize: 11, formatter: (value: number) => formatNps(value) },
      splitLine: { lineStyle: { color: p.line, type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 9,
        lineStyle: { width: 3, color: p.primary },
        itemStyle: { color: p.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(p.primary, 0.32) },
              { offset: 1, color: withAlpha(p.primary, 0) },
            ],
          },
        },
        // Weeks with few answers are drawn hollow: the number moves a lot with so little data.
        data: points.map((point) => ({
          value: point.nps,
          itemStyle:
            point.count < LOW_SAMPLE_THRESHOLD
              ? { color: p.surface, borderColor: p.primary, borderWidth: 2.5 }
              : { color: p.primary },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: p.controlLine, width: 1.5, type: 'solid' },
          data: [{ yAxis: 0 }],
        },
        animationDuration: 900,
      },
    ],
  };
}

export function TimelineChart({ points }: { points: TimelinePoint[] }) {
  const palette = useChartPalette();
  const option = useMemo(() => timelineOption(points, palette), [points, palette]);
  return <AppChart option={option} height={270} label={describeTimeline(points)} />;
}
