import { classifyNps, LOW_SAMPLE_THRESHOLD, sentimentLabel, type ThemeStat } from '@insighthub/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import type { AnalysisData } from '../data';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { SENTIMENT_STYLE } from '../components/charts/chart-theme';
import { DistributionChart, NpsLegend } from '../components/charts/distribution-chart';
import { DistributionTable, TimelineTable } from '../components/charts/lazy-tables';
import { TimelineChart } from '../components/charts/timeline-chart';
import { clearFiltersPatch } from '../components/filter-bar';
import { NavButton } from '../components/nav-button';
import { EmptyState, ErrorState, KpiSkeleton, LoadingBlock, QueryView } from '../components/states';
import { NpsCard } from '../components/nps-card';
import { SynthesisPanel } from '../components/synthesis-panel';
import { TourChip } from '../components/tour';
import { formatNps, formatNumber } from '../lib/format';
import { NPS_SINGULAR, PLAN_LABELS } from '../lib/labels';
import type { TimelinePoint } from '../lib/overview';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppLegend,
  AppParagraph,
  AppReveal,
  AppStack,
  AppTitle,
  ArrowRightOutlined,
  PALETTES,
  useThemeMode,
} from '../ui';

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
    <AppStack gap={5}>
      <TourChip />
      <QueryView
        query={overview}
        loading={
          <AppStack gap={4}>
            <KpiSkeleton />
            <LoadingBlock label="Carregando painel" height={300} />
          </AppStack>
        }
        empty={(data) =>
          data.summary.total === 0 ? (
            <EmptyState
              illustration="chart"
              title="Nenhuma resposta com esses filtros"
              description="Remova algum filtro para voltar a ver os indicadores."
              action={
                hasActiveFilters(search) ? (
                  <AppButton onClick={() => patch(clearFiltersPatch())}>Limpar filtros</AppButton>
                ) : undefined
              }
            />
          ) : null
        }
      >
        {({ summary, distribution }) => (
          <>
            {summary.total < LOW_SAMPLE_THRESHOLD ? (
              <AppAlert
                kind="info"
                title={`Amostra pequena (${summary.total} respostas): o NPS oscila muito com poucos dados.`}
                showIcon
              />
            ) : null}
            <div className="ih-dashboard">
              <div className="ih-dashboard-main">
                <AppReveal index={0}>
                  <NpsCard summary={summary} />
                </AppReveal>
                <AppReveal index={1}>
                  <TimelineCard timelineQuery={timeline} />
                </AppReveal>
                <AppReveal index={2}>
                  <ThemesCard analysis={analysis} />
                </AppReveal>
                <AppReveal index={3}>
                  <ChartCard
                    title="Distribuição das notas"
                    description="Quantas respostas recebeu cada nota de 0 a 10."
                    chart={<DistributionChart bins={distribution} />}
                    legend={<NpsLegend />}
                    table={<DistributionTable bins={distribution} />}
                  />
                </AppReveal>
              </div>
              <div className="ih-dashboard-aside">
                <AppReveal index={1}>
                  <SynthesisPanel total={summary.total} />
                </AppReveal>
                <HighlightsSection analysis={analysis} />
              </div>
            </div>
          </>
        )}
      </QueryView>
    </AppStack>
  );
}

function TimelineCard({ timelineQuery }: { timelineQuery: UseQueryResult<TimelinePoint[]> }) {
  if (timelineQuery.isPending) return <LoadingBlock label="Carregando evolução" height={340} />;
  if (timelineQuery.isError && timelineQuery.data === undefined) {
    return (
      <AppCard>
        <AppStack gap={3}>
          <AppTitle level={2}>Evolução semanal do NPS</AppTitle>
          <AppParagraph tone="muted" small>
            Resultado parcial: os indicadores ao lado carregaram, mas esta série não.
          </AppParagraph>
          <ErrorState title="Não foi possível carregar a evolução" error={timelineQuery.error} onRetry={() => void timelineQuery.refetch()} />
        </AppStack>
      </AppCard>
    );
  }
  const points = timelineQuery.data ?? [];
  if (points.length === 0) {
    return <EmptyState illustration="chart" title="Sem dados para a evolução" description="Nenhuma resposta no período filtrado." />;
  }
  return (
    <ChartCard
      title="Evolução semanal do NPS"
      description={`Semanas com menos de ${LOW_SAMPLE_THRESHOLD} respostas ficam vazadas.`}
      chart={<TimelineChart points={points} />}
      table={<TimelineTable points={points} />}
    />
  );
}

const THEMES_SHOWN = 6;

function ThemeBar({ theme, max }: { theme: ThemeStat; max: number }) {
  const scale = (count: number) => `${(count / max) * 100}%`;
  return (
    <span className="ih-theme-bar" aria-hidden="true">
      {theme.detractors > 0 ? <span className="is-negative" style={{ width: scale(theme.detractors) }} /> : null}
      {theme.passives > 0 ? <span className="is-neutral" style={{ width: scale(theme.passives) }} /> : null}
      {theme.promoters > 0 ? <span className="is-positive" style={{ width: scale(theme.promoters) }} /> : null}
    </span>
  );
}

function ThemesCard({ analysis }: { analysis: UseQueryResult<AnalysisData> }) {
  const surveyId = useSurveyId();
  const p = PALETTES[useThemeMode()];
  const headingId = useId();
  if (analysis.isPending) return <LoadingBlock label="Carregando temas" height={340} />;
  const themes: ThemeStat[] = analysis.data?.themes.slice(0, THEMES_SHOWN) ?? [];
  const max = Math.max(1, ...themes.map((theme) => theme.mentions));
  return (
    <AppCard role="region" aria-label="Temas principais">
      <AppStack gap={4}>
        <div className="ih-row ih-between ih-gap-3">
          <AppTitle level={2} id={headingId}>
            Temas mais citados
          </AppTitle>
          <AppLegend
            label="Legenda das barras de tema"
            items={[
              { key: 'negative', label: 'Detratores', color: p.detractorBar },
              { key: 'neutral', label: 'Neutros', color: p.passiveBar },
              { key: 'positive', label: 'Promotores', color: p.promoterBar },
            ]}
          />
        </div>
        {themes.length === 0 ? (
          <AppParagraph tone="muted">Nenhum tema recorrente neste recorte.</AppParagraph>
        ) : (
          <ul className="ih-theme-list" aria-labelledby={headingId}>
            {themes.map((theme, index) => {
              const style = SENTIMENT_STYLE[sentimentLabel(theme.sentiment)];
              return (
                <li key={theme.theme} style={{ ['--i' as string]: index }}>
                  <Link to="/s/$surveyId/temas" params={{ surveyId }} search={(previous) => ({ ...previous, t: theme.theme })} className="ih-theme-row">
                    <span className="ih-theme-row-label">{theme.label}</span>
                    <ThemeBar theme={theme} max={max} />
                    <span className="ih-theme-row-count">
                      {formatNumber(theme.mentions)}
                      <span className="ih-sr-only">
                        {' '}
                        menções: {theme.detractors} detratores, {theme.passives} neutros e {theme.promoters} promotores. NPS {formatNps(theme.sentiment)}, sentimento{' '}
                        {style.label.toLowerCase()}. Abrir no mapa de temas
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="ih-row ih-between ih-gap-3">
          <AppParagraph tone="muted" small>
            Cada barra mostra quem cita o tema. Clique em um tema para ler as falas.
          </AppParagraph>
          <NavButton size="sm" variant="ghost" to="/s/$surveyId/temas" params={{ surveyId }} search={(previous: object) => previous}>
            Mapa de temas
            <ArrowRightOutlined aria-hidden="true" />
          </NavButton>
        </div>
      </AppStack>
    </AppCard>
  );
}

function HighlightsSection({ analysis }: { analysis: UseQueryResult<AnalysisData> }) {
  const patch = usePatchSearch();
  const highlights = analysis.data?.highlights ?? [];
  if (highlights.length === 0) return null;
  return (
    <section aria-label="Falas em destaque" className="ih-stack ih-gap-5">
      {highlights.map(({ response, tone }, index) => (
        <AppReveal key={response.id} index={index + 2}>
          <figure className={`ih-quote-card${index === 0 ? ' is-lead' : ''}`}>
            <span className={`ih-quote-kicker${tone === 'praise' ? '' : ' is-negative'}`}>{tone === 'praise' ? 'Fala em destaque' : 'Ponto de atenção'}</span>
            <blockquote className="ih-quote">“{response.comment}”</blockquote>
            <figcaption className="ih-quote-caption">
              <span>
                {NPS_SINGULAR[classifyNps(response.npsScore)]}, nota {response.npsScore}, {PLAN_LABELS[response.plan]}
              </span>
              <AppButton size="sm" variant="link" onClick={() => patch({ r: response.id })} aria-label={`Abrir resposta ${response.id}`}>
                Abrir resposta
              </AppButton>
            </figcaption>
          </figure>
        </AppReveal>
      ))}
    </section>
  );
}
