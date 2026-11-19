import { LOW_SAMPLE_THRESHOLD, SEGMENT_DIMENSIONS, type SegmentStat } from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useClient } from '../components/app-context';
import { EmptyState, PartialNotice, QueryView } from '../components/states';
import { formatNps, formatNumber } from '../lib/format';
import { DIMENSION_LABELS, segmentLabel } from '../lib/labels';
import { filtersOf } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

const NPS_RANGE = 100;

/** Diverging bar centred on zero; the number beside it carries the exact value. */
function NpsBar({ value }: { value: number }) {
  const share = (Math.abs(value) / NPS_RANGE) * 50;
  const color = value >= 0 ? 'var(--promoter-bar)' : 'var(--detractor-bar)';
  return (
    <span
      aria-hidden="true"
      className="relative block h-3 w-24 rounded-full sm:w-32"
      style={{ background: 'var(--surface-2)' }}
    >
      <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: 'var(--muted)' }} />
      <span
        className="absolute inset-y-0 rounded-full"
        style={{ background: color, width: `${share}%`, left: value >= 0 ? '50%' : `${50 - share}%` }}
      />
    </span>
  );
}

function SegmentRow({
  stat,
  dimension,
}: {
  stat: SegmentStat;
  dimension: (typeof SEGMENT_DIMENSIONS)[number];
}) {
  return (
    <tr>
      <th scope="row" className="whitespace-nowrap font-semibold">
        {segmentLabel(dimension, stat.segment)}
      </th>
      <td className="num">
        {formatNumber(stat.count)}
        {stat.lowSample ? (
          <span
            className="badge ml-2"
            style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', borderColor: 'var(--warn-line)' }}
          >
            Amostra pequena
          </span>
        ) : null}
      </td>
      <td>
        <span className="flex items-center justify-end gap-3">
          <NpsBar value={stat.nps} />
          <span className="w-10 text-right font-bold tabular-nums">{formatNps(stat.nps)}</span>
        </span>
      </td>
      <td className="num">{stat.promoters}%</td>
      <td className="num">{stat.passives}%</td>
      <td className="num">{stat.detractors}%</td>
      <td className="num">{stat.averageScore.toLocaleString('pt-BR')}</td>
    </tr>
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
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Comparar por" className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted">Comparar por</span>
        {SEGMENT_DIMENSIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`btn btn-sm ${option === dimension ? 'btn-primary' : ''}`}
            aria-pressed={option === dimension}
            onClick={() => patch({ dimension: option === 'plan' ? undefined : option })}
          >
            {DIMENSION_LABELS[option]}
          </button>
        ))}
      </div>

      <QueryView
        query={query}
        loadingLabel="Carregando comparação"
        loadingHeight={280}
        empty={(data) =>
          data.segments.length === 0 ? (
            <EmptyState
              title="Nada para comparar"
              description="Nenhuma resposta corresponde aos filtros atuais."
            />
          ) : null
        }
      >
        {(data) => {
          const small = data.segments.filter((segment) => segment.lowSample);
          return (
            <>
              {data.partial ? (
                <PartialNotice
                  message={`Exibindo ${data.partial.loaded} de ${data.partial.expected} segmentos.`}
                  onRetry={() => void query.refetch()}
                />
              ) : null}
              {small.length > 0 ? (
                <div
                  role="note"
                  className="rounded-xl border p-3 text-sm"
                  style={{
                    background: 'var(--warn-bg)',
                    color: 'var(--warn-fg)',
                    borderColor: 'var(--warn-line)',
                  }}
                >
                  <strong>Cuidado com amostras pequenas.</strong>{' '}
                  {small.length === 1 ? 'Um segmento tem' : `${small.length} segmentos têm`} menos de{' '}
                  {LOW_SAMPLE_THRESHOLD} respostas (
                  {small.map((segment) => segmentLabel(dimension, segment.segment)).join(', ')}). Com tão
                  poucos dados, o NPS varia muito e não sustenta conclusões.
                </div>
              ) : null}
              <section className="card overflow-x-auto p-0! sm:p-0!" aria-label="Comparação de segmentos">
                <table className="data-table">
                  <caption className="px-4 pt-4 pb-2 text-sm text-muted">
                    NPS geral dos dados filtrados:{' '}
                    <strong className="text-fg">{formatNps(data.overall.nps)}</strong> em{' '}
                    {formatNumber(data.overall.total)} respostas. Ordenado do maior para o menor NPS.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">{DIMENSION_LABELS[dimension]}</th>
                      <th scope="col" className="num">
                        Respostas
                      </th>
                      <th scope="col" className="num">
                        NPS
                      </th>
                      <th scope="col" className="num">
                        Promotores
                      </th>
                      <th scope="col" className="num">
                        Neutros
                      </th>
                      <th scope="col" className="num">
                        Detratores
                      </th>
                      <th scope="col" className="num">
                        Nota média
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.segments.map((stat) => (
                      <SegmentRow key={stat.segment} stat={stat} dimension={dimension} />
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          );
        }}
      </QueryView>
    </div>
  );
}
