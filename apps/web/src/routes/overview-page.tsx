import { LOW_SAMPLE_THRESHOLD, sentimentLabel, type NpsBreakdown, type ThemeStat } from '@insighthub/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Info, Quote } from 'lucide-react';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { DistributionChart, DistributionTable, NpsLegend } from '../components/charts/distribution-chart';
import { NpsGauge } from '../components/charts/nps-gauge';
import { TimelineChart, TimelineTable } from '../components/charts/timeline-chart';
import { SENTIMENT_STYLE } from '../components/charts/treemap-chart';
import { CountUp, Reveal } from '../components/motion';
import { Avatar, ThemeChips } from '../components/response-bits';
import { EmptyState, ErrorState, KpiSkeleton, LoadingBlock, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPercent } from '../lib/format';
import { personOf } from '../lib/people';
import type { TimelinePoint } from '../lib/overview';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { clearFiltersPatch } from '../components/filter-bar';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import type { AnalysisData } from '../data';

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="eyebrow">{label}</p>
      <p className="display m-0 text-[40px] tabular-nums" style={{ color: tone }}>
        <CountUp value={value} format={formatNumber} />
      </p>
      {hint ? <p className="m-0 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function BandBar({ summary }: { summary: NpsBreakdown }) {
  const parts = [
    { key: 'detractors', label: 'Detratores', count: summary.detractors, color: 'var(--detractor-bar)' },
    { key: 'passives', label: 'Neutros', count: summary.passives, color: 'var(--passive-bar)' },
    { key: 'promoters', label: 'Promotores', count: summary.promoters, color: 'var(--promoter-bar)' },
  ] as const;
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Detratores ${formatPercent(summary.detractors, summary.total)}, neutros ${formatPercent(summary.passives, summary.total)}, promotores ${formatPercent(summary.promoters, summary.total)}`}>
        {parts.map((part) => (
          <span key={part.key} className="grow-x block h-full" style={{ width: `${(part.count / summary.total) * 100}%`, background: part.color }} />
        ))}
      </div>
      <ul className="m-0 mt-2 flex list-none justify-between p-0 text-xs text-muted">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: part.color }} />
            {part.label} {formatPercent(part.count, summary.total)}
          </li>
        ))}
      </ul>
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
  const analysis = useQuery({
    queryKey: ['analysis', surveyId, filters],
    queryFn: ({ signal }) => client.getAnalysis(surveyId, filters, { signal }),
  });

  return (
    <div className="flex flex-col gap-5">
      <QueryView
        query={overview}
        loading={
          <>
            <KpiSkeleton />
            <LoadingBlock label="Carregando painel" height={300} />
          </>
        }
        empty={(data) =>
          data.summary.total === 0 ? (
            <EmptyState
              illustration="chart"
              title="Nenhuma resposta com esses filtros"
              description="Remova algum filtro para voltar a ver os indicadores."
              action={
                hasActiveFilters(search) ? (
                  <button type="button" className="btn" onClick={() => patch(clearFiltersPatch())}>
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
            {summary.total < LOW_SAMPLE_THRESHOLD ? (
              <p role="note" className="m-0 flex items-center gap-2 text-sm text-muted">
                <Info aria-hidden="true" size={16} />
                Amostra pequena ({summary.total} respostas): o NPS oscila muito com poucos dados.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Reveal index={0}>
                <Stat label="Respostas" value={summary.total} hint="no recorte atual" />
              </Reveal>
              <Reveal index={1}>
                <Stat label="Promotores" value={summary.promoters} hint={`${formatPercent(summary.promoters, summary.total)} · notas 9 e 10`} tone="var(--promoter)" />
              </Reveal>
              <Reveal index={2}>
                <Stat label="Neutros" value={summary.passives} hint={`${formatPercent(summary.passives, summary.total)} · notas 7 e 8`} tone="var(--passive)" />
              </Reveal>
              <Reveal index={3}>
                <Stat label="Detratores" value={summary.detractors} hint={`${formatPercent(summary.detractors, summary.total)} · notas de 0 a 6`} tone="var(--detractor)" />
              </Reveal>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <Reveal index={4} className="lg:col-span-5">
                <section className="card flex h-full flex-col items-center gap-4" aria-label="NPS">
                  <div className="flex w-full flex-wrap items-baseline justify-between gap-x-3">
                    <h2 className="display m-0 text-xl">Net Promoter Score</h2>
                    <span className="text-xs text-muted">promotores − detratores</span>
                  </div>
                  <NpsGauge value={summary.nps} total={summary.total} />
                  <BandBar summary={summary} />
                </section>
              </Reveal>
              <Reveal index={5} className="lg:col-span-7">
                <TimelineCard timelineQuery={timeline} />
              </Reveal>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <Reveal index={6} className="lg:col-span-5">
                <ChartCard
                  className="h-full"
                  title="Distribuição das notas"
                  description="Quantas respostas recebeu cada nota de 0 a 10."
                  chart={<DistributionChart bins={distribution} />}
                  legend={<NpsLegend />}
                  table={<DistributionTable bins={distribution} />}
                />
              </Reveal>
              <Reveal index={7} className="lg:col-span-7">
                <ThemesCard analysis={analysis} />
              </Reveal>
            </div>

            <HighlightsSection analysis={analysis} />
          </>
        )}
      </QueryView>
    </div>
  );
}

function TimelineCard({ timelineQuery }: { timelineQuery: UseQueryResult<TimelinePoint[]> }) {
  if (timelineQuery.isPending) return <LoadingBlock label="Carregando evolução" height={340} />;
  if (timelineQuery.isError && timelineQuery.data === undefined) {
    return (
      <div className="card flex flex-col gap-2">
        <h3 className="display m-0 text-xl">Evolução do NPS</h3>
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
    return <EmptyState illustration="chart" title="Sem dados para a evolução" description="Nenhuma resposta no período filtrado." />;
  }
  return (
    <ChartCard
      className="h-full"
      title="Evolução semanal do NPS"
      description="NPS calculado por semana de envio. Pontos vazados: poucas respostas na semana."
      chart={<TimelineChart points={points} />}
      table={<TimelineTable points={points} />}
    />
  );
}

function ThemesCard({ analysis }: { analysis: UseQueryResult<AnalysisData> }) {
  const surveyId = useSurveyId();
  if (analysis.isPending) return <LoadingBlock label="Carregando temas" height={340} />;
  const themes: ThemeStat[] = analysis.data?.themes.slice(0, 6) ?? [];
  const max = Math.max(1, ...themes.map((theme) => theme.mentions));
  return (
    <section className="card flex h-full flex-col gap-4" aria-label="Temas principais">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="display m-0 text-xl">Do que as pessoas falam</h3>
          <p className="m-0 mt-0.5 text-sm text-muted">Temas mais citados e o sentimento de quem os cita.</p>
        </div>
        <Link
          to="/s/$surveyId/temas"
          params={{ surveyId }}
          search={(previous) => previous}
          className="btn btn-sm"
        >
          Mapa de temas
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>
      {themes.length === 0 ? (
        <p className="m-0 text-sm text-muted">Nenhum tema recorrente neste recorte.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {themes.map((theme, index) => {
            const style = SENTIMENT_STYLE[sentimentLabel(theme.sentiment)];
            return (
              <li key={theme.theme}>
                <Link
                  to="/s/$surveyId/temas"
                  params={{ surveyId }}
                  search={(previous) => ({ ...previous, t: theme.theme })}
                  className="grid grid-cols-[110px_1fr_auto] items-center gap-3 rounded-lg text-sm text-fg no-underline hover:bg-surface-2 sm:grid-cols-[150px_1fr_auto]"
                >
                  <span className="font-semibold">{theme.label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="grow-x block h-full rounded-full"
                      style={{ width: `${(theme.mentions / max) * 100}%`, background: style.edge, animationDelay: `${index * 60}ms` }}
                    />
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="tabular-nums text-muted">
                      {formatNumber(theme.mentions)}
                      <span className="sr-only"> menções,</span>
                    </span>
                    <span className="badge" style={{ background: style.bg, color: style.text, borderColor: 'transparent' }}>
                      <style.Icon aria-hidden="true" size={12} />
                      {formatNps(theme.sentiment)}
                      <span className="sr-only"> de NPS, sentimento {style.label.toLowerCase()}. Abrir no mapa de temas</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="m-0 mt-auto border-t border-line pt-3 text-xs text-muted">
        O número ao lado de cada tema é o NPS de quem o cita: acima de +15 é sentimento positivo, abaixo de −15 é negativo.
        Clique em um tema para ler as falas.
      </p>
    </section>
  );
}

function HighlightsSection({ analysis }: { analysis: UseQueryResult<AnalysisData> }) {
  const patch = usePatchSearch();
  const highlights = analysis.data?.highlights ?? [];
  if (highlights.length === 0) return null;
  return (
    <section aria-label="Falas em destaque" className="flex flex-col gap-3">
      <div>
        <h2 className="display m-0 text-2xl">Falas em destaque</h2>
        <p className="m-0 text-sm text-muted">Os comentários mais detalhados de quem elogia e de quem critica.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {highlights.map(({ response, tone }, index) => (
          <Reveal key={response.id} index={index}>
            <figure className="card m-0 flex h-full flex-col gap-4">
              <Quote aria-hidden="true" size={26} className={tone === 'praise' ? 'text-promoter' : 'text-detractor'} />
              <blockquote className="quote m-0 flex-1 text-[19px]">{response.comment}</blockquote>
              <ThemeChips comment={response.comment} />
              <figcaption className="flex items-center gap-3 text-sm">
                <Avatar respondentId={response.respondentId} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{personOf(response.respondentId).name}</span>
                  <span className="text-muted">
                    Nota {response.npsScore} · {tone === 'praise' ? 'elogio' : 'crítica'}
                  </span>
                </span>
                <button type="button" className="btn btn-sm" onClick={() => patch({ r: response.id })} aria-label={`Abrir resposta ${response.id}`}>
                  Abrir
                </button>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
