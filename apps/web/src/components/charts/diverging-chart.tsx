import type { SegmentDelta, SegmentDimension } from '@insighthub/core';
import { TriangleAlert } from 'lucide-react';
import { formatNps, formatNumber, formatPoints } from '../../lib/format';
import { segmentLabel } from '../../lib/labels';

interface DivergingChartProps {
  stats: SegmentDelta[];
  dimension: SegmentDimension;
  overallNps: number;
}

/**
 * Horizontal bars diverging from the overall NPS: right (teal) is above the average, left
 * (coral) below. Segments with a small sample are hatched and flagged, never hidden.
 */
export function DivergingChart({ stats, dimension, overallNps }: DivergingChartProps) {
  const span = Math.max(10, ...stats.map((stat) => Math.abs(stat.delta)));
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[88px_1fr] items-end gap-3 text-xs font-semibold text-muted sm:grid-cols-[120px_1fr_150px]">
        <span />
        <div className="flex justify-between">
          <span>← abaixo do geral</span>
          <span>acima do geral →</span>
        </div>
        <span className="max-sm:hidden" />
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={`NPS por ${dimension === 'plan' ? 'plano' : dimension === 'region' ? 'região' : 'função'}, comparado ao geral de ${formatNps(overallNps)}`}>
        {stats.map((stat, index) => {
          const share = (Math.abs(stat.delta) / span) * 38;
          const positive = stat.delta >= 0;
          const name = segmentLabel(dimension, stat.segment);
          return (
            <li
              key={stat.segment}
              className="grid grid-cols-[88px_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[120px_1fr_150px]"
            >
              <span className="text-sm font-semibold">{name}</span>
              <div
                className="relative h-9 rounded-lg bg-surface-2"
                role="img"
                aria-label={`${name}: NPS ${formatNps(stat.nps)}, ${formatPoints(stat.delta)} em relação ao geral, ${formatNumber(stat.count)} respostas${stat.lowSample ? ', amostra pequena' : ''}`}
              >
                <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-control-line" />
                <span
                  aria-hidden="true"
                  className="grow-x absolute inset-y-1.5 rounded-md"
                  style={{
                    [positive ? 'left' : 'right']: '50%',
                    width: `${Math.max(share, 0.8)}%`,
                    transformOrigin: positive ? 'left' : 'right',
                    animationDelay: `${index * 70}ms`,
                    background: stat.lowSample
                      ? `repeating-linear-gradient(135deg, ${positive ? 'var(--promoter-bar)' : 'var(--detractor-bar)'} 0 5px, transparent 5px 9px)`
                      : positive
                        ? 'var(--promoter-bar)'
                        : 'var(--detractor-bar)',
                    outline: stat.lowSample ? `1.5px solid ${positive ? 'var(--promoter-bar)' : 'var(--detractor-bar)'}` : undefined,
                  }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-[13px] font-bold tabular-nums"
                  style={{
                    [positive ? 'left' : 'right']: `calc(50% + ${share}% + 8px)`,
                    color: positive ? 'var(--promoter)' : 'var(--detractor)',
                  }}
                >
                  {formatPoints(stat.delta)}
                </span>
              </div>
              <span className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-[100px] text-xs text-muted sm:col-span-1 sm:pl-0">
                <span className="tabular-nums">
                  NPS <strong className="text-fg">{formatNps(stat.nps)}</strong> · n = {formatNumber(stat.count)}
                </span>
                {stat.lowSample ? (
                  <span className="badge badge-passive">
                    <TriangleAlert aria-hidden="true" size={12} />
                    Amostra pequena
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SegmentTable({ stats, dimension }: { stats: SegmentDelta[]; dimension: SegmentDimension }) {
  return (
    <table className="data-table" aria-label="NPS por segmento">
      <thead>
        <tr>
          <th scope="col">Segmento</th>
          <th scope="col">Respostas</th>
          <th scope="col">NPS</th>
          <th scope="col">Diferença</th>
          <th scope="col">Promotores</th>
          <th scope="col">Neutros</th>
          <th scope="col">Detratores</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((stat) => (
          <tr key={stat.segment}>
            <th scope="row">
              {segmentLabel(dimension, stat.segment)}
              {stat.lowSample ? <span className="badge badge-passive ml-2">Amostra pequena</span> : null}
            </th>
            <td className="tabular-nums">{formatNumber(stat.count)}</td>
            <td className="tabular-nums">{formatNps(stat.nps)}</td>
            <td className="tabular-nums">{formatPoints(stat.delta)}</td>
            <td className="tabular-nums">{stat.promoters}%</td>
            <td className="tabular-nums">{stat.passives}%</td>
            <td className="tabular-nums">{stat.detractors}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
