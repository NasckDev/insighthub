/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- the chart wrapper is a keyboard-explorable widget: arrow keys move between data points */
import { LOW_SAMPLE_THRESHOLD } from '@insighthub/core';
import { useId, useState, type KeyboardEvent } from 'react';
import { monotonePath } from '../../lib/curve';
import { formatDayMonth, formatDayMonthShort, formatNps, formatNumber, formatDate } from '../../lib/format';
import type { TimelinePoint } from '../../lib/overview';
import { useElementWidth } from './use-element-width';

const HEIGHT = 250;
const MARGIN = { top: 14, right: 14, bottom: 30, left: 42 };
const TICK_STEP = 20;

function niceDomain(points: readonly TimelinePoint[]): [number, number] {
  const values = points.map((point) => point.nps);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const lo = Math.floor((min - 8) / TICK_STEP) * TICK_STEP;
  const hi = Math.ceil((max + 8) / TICK_STEP) * TICK_STEP;
  return [Math.max(-100, lo), Math.min(100, hi)];
}

/** Weekly NPS as a smooth area. Hollow dots mark weeks with a small sample. */
export function TimelineChart({ points }: { points: TimelinePoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();
  const [lo, hi] = niceDomain(points);
  const innerW = Math.max(120, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (index: number) =>
    MARGIN.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value: number) => MARGIN.top + ((hi - value) / (hi - lo)) * innerH;
  const coords = points.map((point, index) => ({ x: x(index), y: y(point.nps) }));
  const line = monotonePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const floor = HEIGHT - MARGIN.bottom;
  const area = first && last ? `${line} L ${last.x} ${floor} L ${first.x} ${floor} Z` : '';
  const ticks: number[] = [];
  for (let value = lo; value <= hi; value += TICK_STEP) ticks.push(value);
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70))));
  const activePoint = active === null ? null : points[active];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (event.key === 'Escape') setActive(null);
    if (step === 0) return;
    event.preventDefault();
    setActive((current) => Math.min(points.length - 1, Math.max(0, (current ?? (step > 0 ? -1 : points.length)) + step)));
  }

  return (
    <div
      ref={ref}
      className="relative w-full min-w-0 overflow-x-clip"
      tabIndex={0}
      role="group"
      aria-label={`Evolução semanal do NPS, ${points.length} semanas. Use as setas para explorar os pontos.`}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height={HEIGHT} role="img" aria-label={describeTimeline(points)} className="block">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--line)"
              strokeDasharray={tick === 0 ? undefined : '3 4'}
              strokeWidth={tick === 0 ? 1.5 : 1}
            />
            <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {formatNps(tick)}
            </text>
          </g>
        ))}
        {points.map((point, index) =>
          index % labelEvery === 0 ? (
            <text key={point.weekStart} x={x(index)} y={HEIGHT - 8} textAnchor={x(index) > width - 34 ? 'end' : x(index) < MARGIN.left + 14 ? 'start' : 'middle'} fontSize="11" fill="var(--muted)">
              {formatDayMonthShort(point.weekStart)}
            </text>
          ) : null,
        )}
        <path d={area} fill={`url(#${gradientId})`} className="fade-in" />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="draw-line"
        />
        {activePoint && active !== null ? (
          <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="var(--control-line)" strokeDasharray="3 3" />
        ) : null}
        {points.map((point, index) => (
          <g key={point.weekStart}>
            <circle
              cx={x(index)}
              cy={y(point.nps)}
              r={active === index ? 6 : 4}
              fill={point.count < LOW_SAMPLE_THRESHOLD ? 'var(--surface)' : 'var(--primary)'}
              stroke="var(--primary)"
              strokeWidth="2.5"
              className="fade-in"
            />
            <rect
              x={x(index) - innerW / points.length / 2}
              y={MARGIN.top}
              width={Math.max(14, innerW / points.length)}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setActive(index)}
              onPointerMove={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            />
          </g>
        ))}
      </svg>
      {activePoint && active !== null ? (
        <div
          className="pointer-events-none absolute z-10 w-48 rounded-xl border border-line bg-surface p-3 text-sm shadow-[var(--shadow-pop)]"
          style={{
            top: Math.max(0, y(activePoint.nps) - 84),
            left: Math.min(Math.max(0, x(active) - 96), Math.max(0, width - 192)),
          }}
        >
          <p className="m-0 text-xs font-semibold text-muted">Semana de {formatDate(activePoint.weekStart)}</p>
          <p className="display m-0 text-2xl">NPS {formatNps(activePoint.nps)}</p>
          <p className="m-0 text-xs text-muted">
            {formatNumber(activePoint.count)} respostas
            {activePoint.count < LOW_SAMPLE_THRESHOLD ? ' · amostra pequena' : ''}
          </p>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {activePoint ? `${formatDayMonth(activePoint.weekStart)}: NPS ${formatNps(activePoint.nps)}, ${activePoint.count} respostas` : ''}
      </p>
    </div>
  );
}

function describeTimeline(points: readonly TimelinePoint[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return 'Sem dados';
  return `Evolução semanal do NPS de ${formatDayMonth(first.weekStart)} a ${formatDayMonth(last.weekStart)}: começa em ${formatNps(first.nps)} e termina em ${formatNps(last.nps)}.`;
}

export function TimelineTable({ points }: { points: TimelinePoint[] }) {
  return (
    <table className="data-table" aria-label="NPS por semana">
      <thead>
        <tr>
          <th scope="col">Semana de</th>
          <th scope="col">Respostas</th>
          <th scope="col">NPS</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.weekStart}>
            <th scope="row" className="font-medium">
              {formatDate(point.weekStart)}
            </th>
            <td className="tabular-nums">{formatNumber(point.count)}</td>
            <td className="tabular-nums">{formatNps(point.nps)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
