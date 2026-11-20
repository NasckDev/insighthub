import { useMemo } from 'react';
import { formatNps } from '../../lib/format';
import { NPS_ZONES, zoneOf } from '../../lib/nps-zones';
import { AppChart, FONT_DISPLAY, type AppChartOption, type Palette } from '../../ui';
import { useChartPalette, withAlpha } from './chart-theme';

const TONE_KEY = { detractor: 'detractorBar', passive: 'passiveBar', promoter: 'promoterBar' } as const;
const TEXT_KEY = { detractor: 'detractor', passive: 'passive', promoter: 'promoter' } as const;
const SCALE = 200;

export function npsGaugeOption(value: number, p: Palette): AppChartOption {
  const zone = zoneOf(value);
  const bar = p[TONE_KEY[zone.tone]];
  return {
    series: [
      {
        type: 'gauge',
        min: -100,
        max: 100,
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '86%'],
        radius: '128%',
        splitNumber: 4,
        // The four reading bands as soft tints; the value arc below repaints the part up to the score.
        axisLine: {
          lineStyle: {
            width: 18,
            color: NPS_ZONES.map((item) => [(item.to + 100) / SCALE, withAlpha(p[TONE_KEY[item.tone]], 0.3)]),
          },
        },
        progress: { show: true, width: 18, roundCap: true, itemStyle: { color: bar } },
        pointer: { show: false },
        anchor: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-18%'],
          formatter: (current: number) => formatNps(Math.round(current)),
          color: p.fg,
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: 52,
        },
        data: [{ value }],
        animationDuration: 900,
      },
    ],
  };
}

interface NpsGaugeProps {
  value: number;
  total: number;
}

/** Semicircular NPS meter with the four standard reading bands; the zone name sits under it. */
export function NpsGauge({ value, total }: NpsGaugeProps) {
  const palette = useChartPalette();
  const option = useMemo(() => npsGaugeOption(value, palette), [value, palette]);
  const zone = zoneOf(value);
  return (
    <figure style={{ margin: 0, width: '100%', maxWidth: 360 }}>
      <AppChart
        option={option}
        height={190}
        label={`NPS ${formatNps(value)} em uma escala de menos 100 a mais 100, ${zone.label.toLowerCase()}, com base em ${total} respostas`}
      />
      <figcaption style={{ marginTop: 'var(--ih-space-2)', textAlign: 'center', fontWeight: 700, color: `var(--ih-${TEXT_KEY[zone.tone]})` }}>
        {zone.label}
      </figcaption>
    </figure>
  );
}
