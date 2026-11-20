import {
  LOW_SAMPLE_THRESHOLD,
  SEGMENT_DIMENSIONS,
  withDeltas,
  type SegmentDelta,
  type SegmentDimension,
} from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TriangleAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { DivergingChart, SegmentTable } from '../components/charts/diverging-chart';
import { Reveal } from '../components/motion';
import { EmptyState, PartialNotice, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPoints } from '../lib/format';
import { DIMENSION_LABELS, segmentLabel } from '../lib/labels';
import { filtersOf } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

function biggestGap(stats: readonly SegmentDelta[]): SegmentDelta | undefined {
  const reliable = stats.filter((stat) => !stat.lowSample);
  const pool = reliable.length > 0 ? reliable : stats;
  return [...pool].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
}

function SegmentCard({ stat, dimension, index }: { stat: SegmentDelta; dimension: SegmentDimension; index: number }) {
  const total = stat.promoters + stat.passives + stat.detractors || 1;
  const parts = [
    { label: 'Detratores', value: stat.detractors, color: 'var(--detractor-bar)' },
    { label: 'Neutros', value: stat.passives, color: 'var(--passive-bar)' },
    { label: 'Promotores', value: stat.promoters, color: 'var(--promoter-bar)' },
  ];
  return (
    <Reveal index={index}>
      <article className="card flex h-full flex-col gap-3" aria-label={segmentLabel(dimension, stat.segment)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="display m-0 text-lg">{segmentLabel(dimension, stat.segment)}</h3>
          {stat.lowSample ? (
            <span className="badge badge-passive">
              <TriangleAlert aria-hidden="true" size={12} />
              Amostra pequena
            </span>
          ) : null}
        </div>
        <p className="display m-0 text-[44px] tabular-nums leading-none">{formatNps(stat.nps)}</p>
        <p className="m-0 text-sm" style={{ color: stat.delta >= 0 ? 'var(--promoter)' : 'var(--detractor)' }}>
          {formatPoints(stat.delta)} em relação ao geral
        </p>
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-surface-2"
          role="img"
          aria-label={`Detratores ${stat.detractors}%, neutros ${stat.passives}%, promotores ${stat.promoters}%`}
        >
          {parts.map((part) => (
            <span key={part.label} style={{ width: `${(part.value / total) * 100}%`, background: part.color }} />
          ))}
        </div>
        <p className="m-0 text-xs text-muted">
          {formatNumber(stat.count)} respostas · nota média {stat.averageScore.toLocaleString('pt-BR')}
        </p>
      </article>
    </Reveal>
  );
}

export function ComparePage() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = filtersOf(search);
  const dimension = search.dimension ?? 'plan';

  const query = useQuery({
    queryKey: ['compare', surveyId, dimension, filters],
    queryFn: ({ signal }) => client.compare(surveyId, dimension, filters, { signal }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Comparar por" className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-muted">Comparar por</span>
        <div className="seg">
          {SEGMENT_DIMENSIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === dimension}
              onClick={() => patch({ dimension: option === 'plan' ? undefined : option })}
            >
              {DIMENSION_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <QueryView
        query={query}
        loadingLabel="Carregando comparação"
        loadingHeight={380}
        empty={(data) =>
          data.segments.length === 0 ? (
            <EmptyState illustration="chart" title="Nada para comparar" description="Nenhuma resposta corresponde aos filtros atuais." />
          ) : null
        }
      >
        {(data) => {
          const stats = withDeltas(data.segments, data.overall.nps);
          const small = stats.filter((segment) => segment.lowSample);
          const gap = biggestGap(stats);
          return (
            <>
              {data.partial ? (
                <PartialNotice
                  message={`Exibindo ${data.partial.loaded} de ${data.partial.expected} segmentos.`}
                  onRetry={() => void query.refetch()}
                />
              ) : null}

              {gap && stats.length > 1 ? (
                <section className="card flex items-center gap-4" aria-label="Maior diferença">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                    style={{ background: gap.delta >= 0 ? 'var(--primary-soft)' : 'var(--accent-soft)', color: gap.delta >= 0 ? 'var(--promoter)' : 'var(--detractor)' }}
                  >
                    {gap.delta >= 0 ? <TrendingUp aria-hidden="true" size={24} /> : <TrendingDown aria-hidden="true" size={24} />}
                  </span>
                  <p className="m-0 text-base">
                    <strong>{segmentLabel(dimension, gap.segment)}</strong> é o segmento que mais se afasta do NPS geral (
                    <strong className="tabular-nums">{formatNps(data.overall.nps)}</strong>):{' '}
                    <strong className="tabular-nums" style={{ color: gap.delta >= 0 ? 'var(--promoter)' : 'var(--detractor)' }}>
                      {formatPoints(gap.delta)}
                    </strong>
                    , com {formatNumber(gap.count)} respostas.
                  </p>
                </section>
              ) : null}

              {small.length > 0 ? (
                <div
                  role="note"
                  className="flex items-start gap-3 rounded-xl border p-4 text-sm"
                  style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', borderColor: 'var(--warn-line)' }}
                >
                  <TriangleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
                  <p className="m-0">
                    <strong>Cuidado com amostras pequenas.</strong>{' '}
                    {small.length === 1 ? 'Um segmento tem' : `${small.length} segmentos têm`} menos de {LOW_SAMPLE_THRESHOLD}{' '}
                    respostas ({small.map((segment) => segmentLabel(dimension, segment.segment)).join(', ')}). Com tão poucos
                    dados, o NPS varia muito e não sustenta conclusões. Estes segmentos aparecem listrados.
                  </p>
                </div>
              ) : null}

              <ChartCard
                title={`NPS por ${DIMENSION_LABELS[dimension].toLowerCase()}, comparado ao geral`}
                description={`Geral: ${formatNps(data.overall.nps)} em ${formatNumber(data.overall.total)} respostas. Barras para a direita estão acima da média.`}
                chart={<DivergingChart stats={stats} dimension={dimension} overallNps={data.overall.nps} />}
                table={<SegmentTable stats={stats} dimension={dimension} />}
              />

              <section aria-label="Segmentos lado a lado" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                  <SegmentCard key={stat.segment} stat={stat} dimension={dimension} index={index} />
                ))}
              </section>
            </>
          );
        }}
      </QueryView>
    </div>
  );
}
