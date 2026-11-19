import { LOW_SAMPLE_THRESHOLD } from '@insighthub/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useClient } from '../components/app-context';
import {
  ChartCard,
  DistributionChart,
  DistributionTable,
  NpsLegend,
  TimelineChart,
  TimelineTable,
} from '../components/charts';
import { EmptyState, ErrorState, LoadingBlock, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPercent } from '../lib/format';
import type { TimelinePoint } from '../lib/overview';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="m-0 text-sm font-semibold text-muted">{label}</p>
      <p className="m-0 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="m-0 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function OverviewPage() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = filtersOf(search);

  const overview = useQuery({
    queryKey: ['overview', surveyId, filters],
    queryFn: ({ signal }) => client.getOverview(surveyId, filters, { signal }),
  });
  const timeline = useQuery({
    queryKey: ['timeline', surveyId, filters],
    queryFn: ({ signal }) => client.getTimeline(surveyId, filters, { signal }),
  });

  return (
    <div className="flex flex-col gap-4">
      <QueryView
        query={overview}
        loadingLabel="Carregando indicadores"
        loadingHeight={96}
        empty={(data) =>
          data.summary.total === 0 ? (
            <EmptyState
              title="Nenhuma resposta com esses filtros"
              description="Remova algum filtro para voltar a ver os indicadores."
              action={
                hasActiveFilters(search) ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      patch({
                        plan: undefined,
                        region: undefined,
                        role: undefined,
                        nps: undefined,
                        q: undefined,
                      })
                    }
                  >
                    Limpar filtros
                  </button>
                ) : undefined
              }
            />
          ) : null
        }
      >
        {({ summary, distribution }) => (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi
                label="NPS"
                value={formatNps(summary.nps)}
                hint="Promotores menos detratores, de −100 a +100"
              />
              <Kpi label="Respostas" value={formatNumber(summary.total)} />
              <Kpi
                label="Promotores"
                value={formatPercent(summary.promoters, summary.total)}
                hint={`${formatNumber(summary.promoters)} notas 9 e 10`}
              />
              <Kpi
                label="Detratores"
                value={formatPercent(summary.detractors, summary.total)}
                hint={`${formatNumber(summary.detractors)} notas de 0 a 6`}
              />
            </div>
            {summary.total < LOW_SAMPLE_THRESHOLD ? (
              <p role="note" className="m-0 text-sm text-muted">
                Amostra pequena ({summary.total} respostas): o NPS oscila muito com poucos dados.
              </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Distribuição das notas"
                description="Quantas respostas recebeu cada nota de 0 a 10."
                chart={<DistributionChart bins={distribution} />}
                legend={<NpsLegend />}
                table={<DistributionTable bins={distribution} />}
              />
              <TimelineCard timelineQuery={timeline} />
            </div>
          </>
        )}
      </QueryView>
    </div>
  );
}

function TimelineCard({ timelineQuery }: { timelineQuery: UseQueryResult<TimelinePoint[]> }) {
  if (timelineQuery.isPending) return <LoadingBlock label="Carregando evolução" height={260} />;
  if (timelineQuery.isError && timelineQuery.data === undefined) {
    return (
      <div className="card flex flex-col gap-2">
        <h3 className="m-0 text-base font-semibold">Evolução do NPS</h3>
        <p role="status" className="m-0 text-sm text-muted">
          Resultado parcial: os indicadores ao lado carregaram, mas esta série não.
        </p>
        <ErrorState
          title="Não foi possível carregar a evolução"
          error={timelineQuery.error}
          onRetry={() => void timelineQuery.refetch()}
        />
      </div>
    );
  }
  const points = timelineQuery.data ?? [];
  if (points.length === 0) {
    return (
      <EmptyState title="Sem dados para a evolução" description="Nenhuma resposta no período filtrado." />
    );
  }
  return (
    <ChartCard
      title="Evolução semanal do NPS"
      description="NPS calculado por semana de envio."
      chart={<TimelineChart points={points} />}
      table={<TimelineTable points={points} />}
    />
  );
}
