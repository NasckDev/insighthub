/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- the chart wrapper is a keyboard-explorable widget: arrow keys move between data points */
import type { NpsCategory } from '@insighthub/core';
import { useState, type KeyboardEvent } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';
import { NPS_SINGULAR } from '../../lib/labels';
import type { DistributionBin } from '../../lib/overview';
import { useElementWidth } from './use-element-width';

const HEIGHT = 230;
const MARGIN = { top: 22, right: 8, bottom: 28, left: 8 };

const FILL: Record<NpsCategory, string> = {
  promoter: 'var(--promoter-bar)',
  passive: 'var(--passive-bar)',
  detractor: 'var(--detractor-bar)',
};

const BAND_LABEL: Record<NpsCategory, string> = {
  promoter: 'Promotores (9 e 10)',
  passive: 'Neutros (7 e 8)',
  detractor: 'Detratores (0 a 6)',
};

export function NpsLegend() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-sm" aria-label="Legenda das faixas">
      {(['detractor', 'passive', 'promoter'] as const).map((category) => (
        <li key={category} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: FILL[category] }} />
          {BAND_LABEL[category]}
        </li>
      ))}
    </ul>
  );
}

/** Bars for scores 0 to 10, colored by NPS band, with the count above each bar. */
export function DistributionChart({ bins }: { bins: DistributionBin[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const max = Math.max(1, ...bins.map((bin) => bin.count));
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = innerW / bins.length;
  const barW = Math.min(46, slot - 6);
  const activeBin = active === null ? null : bins[active];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (event.key === 'Escape') setActive(null);
    if (step === 0) return;
    event.preventDefault();
    setActive((current) => Math.min(bins.length - 1, Math.max(0, (current ?? (step > 0 ? -1 : bins.length)) + step)));
  }

  return (
    <div
      ref={ref}
      className="relative w-full min-w-0 overflow-x-clip"
      tabIndex={0}
      role="group"
      aria-label={`Distribuição das ${total} notas. Use as setas para explorar cada nota.`}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Distribuição das ${total} notas de 0 a 10: ${bins.map((bin) => `nota ${bin.score}, ${bin.count}`).join('; ')}`}
        className="block"
      >
        <line x1={MARGIN.left} x2={width - MARGIN.right} y1={HEIGHT - MARGIN.bottom} y2={HEIGHT - MARGIN.bottom} stroke="var(--line)" />
        {bins.map((bin, index) => {
          const h = Math.max(bin.count === 0 ? 0 : 3, (bin.count / max) * innerH);
          const cx = MARGIN.left + slot * index + slot / 2;
          const isActive = active === index;
          return (
            <g key={bin.score} onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)}>
              <rect x={cx - slot / 2} y={MARGIN.top} width={slot} height={innerH} fill="transparent" />
              <rect
                x={cx - barW / 2}
                y={HEIGHT - MARGIN.bottom - h}
                width={barW}
                height={h}
                rx="5"
                fill={FILL[bin.category]}
                opacity={active === null || isActive ? 1 : 0.55}
                className="grow-y"
                style={{ animationDelay: `${index * 35}ms` }}
              />
              <text x={cx} y={HEIGHT - 9} textAnchor="middle" fontSize="12" fill="var(--muted)">
                {bin.score}
              </text>
            </g>
          );
        })}
        {/* Count labels are drawn last so a taller neighbour bar never covers them. */}
        {bins.map((bin, index) =>
          bin.count > 0 ? (
            <text
              key={`label-${bin.score}`}
              x={MARGIN.left + slot * index + slot / 2}
              y={HEIGHT - MARGIN.bottom - Math.max(3, (bin.count / max) * innerH) - 6}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="600"
              fill="var(--fg)"
              className="fade-in"
              pointerEvents="none"
            >
              {formatNumber(bin.count)}
            </text>
          ) : null,
        )}
      </svg>
      {activeBin ? (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-xl border border-line bg-surface p-3 text-sm shadow-[var(--shadow-pop)]"
          style={{
            top: 0,
            left: Math.min(Math.max(0, MARGIN.left + slot * (active ?? 0) + slot / 2 - 88), Math.max(0, width - 176)),
          }}
        >
          <p className="m-0 text-xs font-semibold text-muted">Nota {activeBin.score}</p>
          <p className="display m-0 text-2xl">{formatNumber(activeBin.count)}</p>
          <p className="m-0 text-xs text-muted">
            {formatPercent(activeBin.count, total)} das respostas · {NPS_SINGULAR[activeBin.category]}
          </p>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {activeBin ? `Nota ${activeBin.score}: ${activeBin.count} respostas` : ''}
      </p>
    </div>
  );
}

export function DistributionTable({ bins }: { bins: DistributionBin[] }) {
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  return (
    <table className="data-table" aria-label="Quantidade de respostas por nota">
      <thead>
        <tr>
          <th scope="col">Nota</th>
          <th scope="col">Faixa</th>
          <th scope="col">Respostas</th>
          <th scope="col">Parcela</th>
        </tr>
      </thead>
      <tbody>
        {bins.map((bin) => (
          <tr key={bin.score}>
            <th scope="row">{bin.score}</th>
            <td>{NPS_SINGULAR[bin.category]}</td>
            <td className="tabular-nums">{formatNumber(bin.count)}</td>
            <td className="tabular-nums">{formatPercent(bin.count, total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
