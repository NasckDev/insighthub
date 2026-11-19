import { LOW_SAMPLE_THRESHOLD, NPS_CATEGORIES } from '@insighthub/core';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { formatNps, formatNumber, formatShortDate } from '../lib/format';
import { NPS_LABELS, NPS_SINGULAR } from '../lib/labels';
import type { DistributionBin, TimelinePoint } from '../lib/overview';

const FALLBACK_WIDTH = 360;
const CHART_HEIGHT = 220;
const PAD = { top: 18, right: 14, bottom: 34, left: 38 };

const CATEGORY_COLOR = {
  promoter: 'var(--promoter-bar)',
  passive: 'var(--passive-bar)',
  detractor: 'var(--detractor-bar)',
} as const;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.floor(entry?.contentRect.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

interface ChartCardProps {
  title: string;
  description: string;
  chart: ReactNode;
  table: ReactNode;
  legend?: ReactNode;
}

/** A chart with an equivalent data table one click away (same data, no information lost). */
export function ChartCard({ title, description, chart, table, legend }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const headingId = useId();
  return (
    <section className="card flex min-w-0 flex-col gap-3" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={headingId} className="m-0 text-base font-semibold">
            {title}
          </h3>
          <p className="m-0 text-sm text-muted">{description}</p>
        </div>
        <div className="flex gap-1" role="group" aria-label={`Visualização de ${title}`}>
          <button
            type="button"
            className={`btn btn-sm ${view === 'chart' ? 'btn-primary' : ''}`}
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            Gráfico
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'table' ? 'btn-primary' : ''}`}
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Tabela
          </button>
        </div>
      </div>
      {view === 'chart' ? (
        <>
          {chart}
          {legend}
        </>
      ) : (
        <div className="overflow-x-auto">{table}</div>
      )}
    </section>
  );
}

export function NpsLegend() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-muted">
      {NPS_CATEGORIES.map((category) => (
        <li key={category} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: CATEGORY_COLOR[category] }}
          />
          {NPS_LABELS[category]}
        </li>
      ))}
    </ul>
  );
}

export function DistributionChart({ bins }: { bins: DistributionBin[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const max = Math.max(1, ...bins.map((bin) => bin.count));
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = innerWidth / bins.length;
  const barWidth = Math.max(10, slot - 6);
  const label = `Distribuição das ${formatNumber(total)} notas de 0 a 10. ${bins
    .map((bin) => `nota ${bin.score}: ${bin.count}`)
    .join('; ')}.`;

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
      <svg width={width} height={CHART_HEIGHT} role="img" aria-label={label}>
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={PAD.top + innerHeight}
          y2={PAD.top + innerHeight}
          stroke="var(--line)"
        />
        {[0, 0.5, 1].map((fraction) => {
          const y = PAD.top + innerHeight - fraction * innerHeight;
          return (
            <g key={fraction}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeDasharray={fraction === 0 ? undefined : '3 4'}
              />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                {Math.round(max * fraction)}
              </text>
            </g>
          );
        })}
        {bins.map((bin, index) => {
          const height = (bin.count / max) * innerHeight;
          const x = PAD.left + index * slot + (slot - barWidth) / 2;
          return (
            <g key={bin.score}>
              <rect
                x={x}
                y={PAD.top + innerHeight - height}
                width={barWidth}
                height={height}
                rx="3"
                fill={CATEGORY_COLOR[bin.category]}
              >
                <title>{`Nota ${bin.score}: ${bin.count} respostas`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={PAD.top + innerHeight - height - 5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--fg)"
              >
                {bin.count > 0 && slot >= 24 ? bin.count : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={PAD.top + innerHeight + 18}
                textAnchor="middle"
                fontSize="12"
                fill="var(--muted)"
              >
                {bin.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DistributionTable({ bins }: { bins: DistributionBin[] }) {
  return (
    <table className="data-table">
      <caption className="sr-only">Quantidade de respostas por nota</caption>
      <thead>
        <tr>
          <th scope="col">Nota</th>
          <th scope="col">Categoria</th>
          <th scope="col" className="num">
            Respostas
          </th>
        </tr>
      </thead>
      <tbody>
        {bins.map((bin) => (
          <tr key={bin.score}>
            <th scope="row">{bin.score}</th>
            <td>{NPS_SINGULAR[bin.category]}</td>
            <td className="num">{formatNumber(bin.count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function niceBounds(points: readonly TimelinePoint[]): [number, number] {
  const values = points.map((point) => point.nps);
  const low = Math.floor(Math.min(0, ...values) / 20) * 20;
  const high = Math.ceil(Math.max(0, ...values) / 20) * 20;
  return high - low < 40 ? [low, low + 40] : [low, high];
}

export function TimelineChart({ points }: { points: TimelinePoint[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [low, high] = niceBounds(points);
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const xOf = (index: number) =>
    PAD.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const yOf = (value: number) => PAD.top + innerHeight - ((value - low) / (high - low)) * innerHeight;
  const ticks = Array.from({ length: (high - low) / 20 + 1 }, (_, index) => low + index * 20);
  const labelEvery = width < 460 ? 2 : 1;
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xOf(index)},${yOf(point.nps)}`)
    .join(' ');
  const label = `Evolução semanal do NPS. ${points
    .map((point) => `semana de ${formatShortDate(point.weekStart)}: NPS ${formatNps(point.nps)}`)
    .join('; ')}.`;

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
      <svg width={width} height={CHART_HEIGHT} role="img" aria-label={label}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke="var(--line)"
              strokeWidth={tick === 0 ? 1.5 : 1}
              strokeDasharray={tick === 0 ? undefined : '3 4'}
            />
            <text x={PAD.left - 6} y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {formatNps(tick)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((point, index) => {
          const small = point.count < LOW_SAMPLE_THRESHOLD;
          return (
            <g key={point.weekStart}>
              <circle
                cx={xOf(index)}
                cy={yOf(point.nps)}
                r="4.5"
                fill={small ? 'var(--surface)' : 'var(--primary)'}
                stroke="var(--primary)"
                strokeWidth="2"
              >
                <title>{`Semana de ${formatShortDate(point.weekStart)}: NPS ${formatNps(point.nps)} (${point.count} respostas)`}</title>
              </circle>
              {index % labelEvery === 0 ? (
                <text
                  x={xOf(index)}
                  y={PAD.top + innerHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--muted)"
                >
                  {formatShortDate(point.weekStart)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {points.some((point) => point.count < LOW_SAMPLE_THRESHOLD) ? (
        <p className="m-0 mt-1 text-xs text-muted">
          Pontos vazados têm menos de {LOW_SAMPLE_THRESHOLD} respostas na semana: leia com cautela.
        </p>
      ) : null}
    </div>
  );
}

export function TimelineTable({ points }: { points: TimelinePoint[] }) {
  return (
    <table className="data-table">
      <caption className="sr-only">NPS e quantidade de respostas por semana</caption>
      <thead>
        <tr>
          <th scope="col">Semana de</th>
          <th scope="col" className="num">
            NPS
          </th>
          <th scope="col" className="num">
            Respostas
          </th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.weekStart}>
            <th scope="row">{formatShortDate(point.weekStart)}</th>
            <td className="num">{formatNps(point.nps)}</td>
            <td className="num">
              {formatNumber(point.count)}
              {point.count < LOW_SAMPLE_THRESHOLD ? ' (amostra pequena)' : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
