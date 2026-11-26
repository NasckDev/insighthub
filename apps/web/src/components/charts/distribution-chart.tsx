import type { NpsCategory } from '@insighthub/core';
import { useMemo } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';
import { NPS_SINGULAR } from '../../lib/labels';
import type { DistributionBin } from '../../lib/overview';
import { AppChart, AppLegend, FONT_SANS, type AppChartOption, type Palette } from '../../ui';
import { bandColors, tooltipBox, useChartPalette } from './chart-theme';

const BAND_LABEL: Record<NpsCategory, string> = {
  promoter: 'Promotores (9 e 10)',
  passive: 'Neutros (7 e 8)',
  detractor: 'Detratores (0 a 6)',
};

export function NpsLegend() {
  const palette = useChartPalette();
  const colors = bandColors(palette);
  return (
    <AppLegend
      label="Legenda das faixas"
      items={(['detractor', 'passive', 'promoter'] as const).map((category) => ({
        key: category,
        label: BAND_LABEL[category],
        color: colors[category],
      }))}
    />
  );
}

export function distributionOption(bins: readonly DistributionBin[], p: Palette): AppChartOption {
  const colors = bandColors(p);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  return {
    grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
    tooltip: {
      ...tooltipBox(p),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: p.surface2, opacity: 0.6 } },
      formatter: (params: { dataIndex: number } | { dataIndex: number }[]) => {
        const index = Array.isArray(params) ? (params[0]?.dataIndex ?? 0) : params.dataIndex;
        const bin = bins[index];
        if (!bin) return '';
        return `<div style="font-size:12px;color:${p.muted}">Nota ${bin.score}</div><div style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">${formatNumber(bin.count)}</div><div style="font-size:12px;color:${p.muted}">${formatPercent(bin.count, total)} das respostas · ${NPS_SINGULAR[bin.category]}</div>`;
      },
    },
    xAxis: {
      type: 'category',
      data: bins.map((bin) => String(bin.score)),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: p.line } },
      axisLabel: { color: p.muted, fontFamily: FONT_SANS, fontSize: 12 },
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        barMaxWidth: 44,
        data: bins.map((bin) => ({ value: bin.count, itemStyle: { color: colors[bin.category], borderRadius: [6, 6, 0, 0] } })),
        label: { show: true, position: 'top', color: p.fg, fontFamily: FONT_SANS, fontWeight: 600, fontSize: 12, formatter: ({ value }: { value: number }) => (value > 0 ? formatNumber(value) : '') },
        animationDuration: 700,
      },
    ],
  };
}

/** Bars for scores 0 to 10, colored by NPS band, with the count above each bar. */
export function DistributionChart({ bins }: { bins: DistributionBin[] }) {
  const palette = useChartPalette();
  const option = useMemo(() => distributionOption(bins, palette), [bins, palette]);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  return (
    <AppChart
      option={option}
      height={230}
      label={`Distribuição das ${total} notas de 0 a 10: ${bins.map((bin) => `nota ${bin.score}, ${bin.count}`).join('; ')}`}
    />
  );
}
