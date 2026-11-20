import { LOW_SAMPLE_THRESHOLD, sentimentLabel, type NpsBreakdown, type SentimentLabel, type ThemeStat } from '@insighthub/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { AnalysisData } from '../data';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { SENTIMENT_STYLE } from '../components/charts/chart-theme';
import { DistributionChart, NpsLegend } from '../components/charts/distribution-chart';
import { DistributionTable, TimelineTable } from '../components/charts/lazy-tables';
import { NpsGauge } from '../components/charts/nps-gauge';
import { TimelineChart } from '../components/charts/timeline-chart';
import { clearFiltersPatch } from '../components/filter-bar';
import { NavButton } from '../components/nav-button';
import { Avatar, ThemeChips } from '../components/response-bits';
import { EmptyState, ErrorState, KpiSkeleton, LoadingBlock, QueryView } from '../components/states';
import { TourChip } from '../components/tour';
import { formatNps, formatNumber, formatPercent } from '../lib/format';
import { personOf } from '../lib/people';
import type { TimelinePoint } from '../lib/overview';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppAlert,
  AppBand,
  AppButton,
  AppCard,
  AppGrid,
  AppGridItem,
  AppParagraph,
  AppReveal,
  AppStack,
  AppStatistic,
  AppTag,
  AppText,
  AppTitle,
  ArrowRightOutlined,
  FrownOutlined,
  PALETTES,
  SmileOutlined,
  useThemeMode,
} from '../ui';

const BAR_VAR: Record<SentimentLabel, string> = { positive: 'var(--ih-promoter-bar)', mixed: 'var(--ih-passive-bar)', negative: 'var(--ih-detractor-bar)' };

function NpsCard({ summary }: { summary: NpsBreakdown }) {
  const p = PALETTES[useThemeMode()];
  const share = (count: number) => formatPercent(count, summary.total);
  return (
    <AppCard role="region" aria-label="NPS" fullHeight>
      <AppStack gap={4} align="center">
        <div className="ih-row ih-between ih-gap-2" style={{ width: '100%' }}>
          <AppTitle level={2}>Net Promoter Score</AppTitle>
          <AppText tone="muted" small>
            promotores − detratores
          </AppText>
        </div>
        <NpsGauge value={summary.nps} total={summary.total} />
        <AppBand
          label={`Detratores ${share(summary.detractors)}, neutros ${share(summary.passives)}, promotores ${share(summary.promoters)}`}
          parts={[
            { key: 'detractors', label: `Detratores ${share(summary.detractors)}`, value: summary.detractors, color: p.detractorBar },
            { key: 'passives', label: `Neutros ${share(summary.passives)}`, value: summary.passives, color: p.passiveBar },
            { key: 'promoters', label: `Promotores ${share(summary.promoters)}`, value: summary.promoters, color: p.promoterBar },
          ]}
        />
      </AppStack>
    </AppCard>
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
            <AppGrid columns={{ base: 2, lg: 4 }} tight>
              <AppReveal index={0}>
                <AppStatistic title="Respostas" value={summary.total} format={formatNumber} hint="no recorte atual" />
              </AppReveal>
              <AppReveal index={1}>
                <AppStatistic title="Promotores" value={summary.promoters} format={formatNumber} tone="promoter" hint={`${formatPercent(summary.promoters, summary.total)} · notas 9 e 10`} />
              </AppReveal>
              <AppReveal index={2}>
                <AppStatistic title="Neutros" value={summary.passives} format={formatNumber} tone="passive" hint={`${formatPercent(summary.passives, summary.total)} · notas 7 e 8`} />
              </AppReveal>
              <AppReveal index={3}>
                <AppStatistic title="Detratores" value={summary.detractors} format={formatNumber} tone="detractor" hint={`${formatPercent(summary.detractors, summary.total)} · notas de 0 a 6`} />
              </AppReveal>
            </AppGrid>

            <AppGrid columns={{ base: 1 }} twelve>
              <AppGridItem span={5}>
                <AppReveal index={4}>
                  <NpsCard summary={summary} />
                </AppReveal>
              </AppGridItem>
              <AppGridItem span={7}>
                <AppReveal index={5}>
                  <TimelineCard timelineQuery={timeline} />
                </AppReveal>
              </AppGridItem>
            </AppGrid>

            <AppGrid columns={{ base: 1 }} twelve>
              <AppGridItem span={5}>
                <AppReveal index={6}>
                  <ChartCard
                    fullHeight
                    title="Distribuição das notas"
                    description="Quantas respostas recebeu cada nota de 0 a 10."
                    chart={<DistributionChart bins={distribution} />}
                    legend={<NpsLegend />}
                    table={<DistributionTable bins={distribution} />}
                  />
                </AppReveal>
              </AppGridItem>
              <AppGridItem span={7}>
                <AppReveal index={7}>
                  <ThemesCard analysis={analysis} />
                </AppReveal>
              </AppGridItem>
            </AppGrid>

            <HighlightsSection analysis={analysis} />
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
          <AppTitle level={2}>Evolução do NPS</AppTitle>
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
      fullHeight
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
    <AppCard role="region" aria-label="Temas principais" fullHeight>
      <AppStack gap={4}>
        <div className="ih-row ih-between ih-start ih-gap-3">
          <div className="ih-fill" style={{ flexBasis: '14rem' }}>
            <AppTitle level={2}>Do que as pessoas falam</AppTitle>
            <AppParagraph tone="muted" small>
              Temas mais citados e o sentimento de quem os cita.
            </AppParagraph>
          </div>
          <NavButton size="sm" to="/s/$surveyId/temas" params={{ surveyId }} search={(previous: object) => previous}>
            Mapa de temas
            <ArrowRightOutlined aria-hidden="true" />
          </NavButton>
        </div>
        {themes.length === 0 ? (
          <AppParagraph tone="muted">Nenhum tema recorrente neste recorte.</AppParagraph>
        ) : (
          <ul className="ih-stack ih-gap-1" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {themes.map((theme, index) => {
              const label = sentimentLabel(theme.sentiment);
              const style = SENTIMENT_STYLE[label];
              return (
                <li key={theme.theme}>
                  <Link to="/s/$surveyId/temas" params={{ surveyId }} search={(previous) => ({ ...previous, t: theme.theme })} className="ih-theme-row">
                    <strong>{theme.label}</strong>
                    <span className="ih-bar" aria-hidden="true">
                      <span style={{ width: `${(theme.mentions / max) * 100}%`, background: BAR_VAR[label], ['--i' as string]: index }} />
                    </span>
                    <span className="ih-row ih-gap-2 ih-nowrap">
                      <AppText tone="muted" small tabular>
                        {formatNumber(theme.mentions)}
                        <span className="ih-sr-only"> menções,</span>
                      </AppText>
                      <ThemeSentimentTag stat={theme} style={style} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <AppParagraph tone="muted" small>
          O número ao lado de cada tema é o NPS de quem o cita: acima de +15 é sentimento positivo, abaixo de −15 é negativo. Clique em um tema para ler as falas.
        </AppParagraph>
      </AppStack>
    </AppCard>
  );
}

function ThemeSentimentTag({ stat, style }: { stat: ThemeStat; style: (typeof SENTIMENT_STYLE)[SentimentLabel] }) {
  return (
    <AppTag tone={style.tone} icon={style.icon}>
      {formatNps(stat.sentiment)}
      <span className="ih-sr-only"> de NPS, sentimento {style.label.toLowerCase()}. Abrir no mapa de temas</span>
    </AppTag>
  );
}

function HighlightsSection({ analysis }: { analysis: UseQueryResult<AnalysisData> }) {
  const patch = usePatchSearch();
  const highlights = analysis.data?.highlights ?? [];
  if (highlights.length === 0) return null;
  return (
    <section aria-label="Falas em destaque">
      <AppStack gap={3}>
        <div>
          <AppTitle level={2}>Falas em destaque</AppTitle>
          <AppParagraph tone="muted" small>
            Os comentários mais detalhados de quem elogia e de quem critica.
          </AppParagraph>
        </div>
        <AppGrid columns={{ base: 1, md: 2 }}>
          {highlights.map(({ response, tone }, index) => (
            <AppReveal key={response.id} index={index}>
              <AppCard fullHeight>
                <figure className="ih-figure">
                  {tone === 'praise' ? (
                    <SmileOutlined aria-hidden="true" className="ih-figure-mark" style={{ color: 'var(--ih-promoter)' }} />
                  ) : (
                    <FrownOutlined aria-hidden="true" className="ih-figure-mark" style={{ color: 'var(--ih-detractor)' }} />
                  )}
                  <blockquote className="ih-quote ih-highlight-quote">{response.comment}</blockquote>
                  <ThemeChips comment={response.comment} />
                  <figcaption className="ih-row ih-gap-3 ih-nowrap">
                    <Avatar respondentId={response.respondentId} />
                    <span className="ih-fill">
                      <AppText strong block>
                        {personOf(response.respondentId).name}
                      </AppText>
                      <AppText tone="muted" small>
                        Nota {response.npsScore} · {tone === 'praise' ? 'elogio' : 'crítica'}
                      </AppText>
                    </span>
                    <AppButton size="sm" onClick={() => patch({ r: response.id })} aria-label={`Abrir resposta ${response.id}`}>
                      Abrir
                    </AppButton>
                  </figcaption>
                </figure>
              </AppCard>
            </AppReveal>
          ))}
        </AppGrid>
      </AppStack>
    </section>
  );
}
