import type { EChartsCoreOption } from 'echarts/core';
import { lazy, Suspense, useMemo } from 'react';

export type AppChartOption = EChartsCoreOption;

export interface AppChartClick {
  data?: unknown;
  name?: string;
  dataIndex?: number;
}

export interface AppChartProps {
  option: AppChartOption;
  /** Text alternative read by screen readers. Say what the chart shows and its main finding. */
  label: string;
  /** Height of the plot area in px (a data-viz dimension, not a layout one). */
  height?: number;
  onClick?: (event: AppChartClick) => void;
}

const ChartCanvas = lazy(() => import('./chart-canvas'));
const DEFAULT_HEIGHT = 280;

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * ECharts behind one component. The chart is drawn as SVG, loaded on demand, animates only when the
 * reader allows motion, and is exposed as a single image with a text alternative. The data table that
 * accompanies each chart (see `ChartCard`) is the full, keyboard-friendly equivalent.
 */
export function AppChart({ option, label, height = DEFAULT_HEIGHT, onClick }: AppChartProps) {
  const finalOption = useMemo(() => ({ animation: !reducedMotion(), ...option }), [option]);
  return (
    <div role="img" aria-label={label} className="ih-chart" style={{ height }}>
      <div aria-hidden="true">
        <Suspense fallback={<div className="ih-chart-fallback" style={{ height }} />}>
          <ChartCanvas option={finalOption} height={height} onClick={onClick ? (event) => onClick(event as AppChartClick) : undefined} />
        </Suspense>
      </div>
    </div>
  );
}
