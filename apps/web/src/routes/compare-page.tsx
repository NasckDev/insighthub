import { LOW_SAMPLE_THRESHOLD, SEGMENT_DIMENSIONS, withDeltas, type SegmentDelta, type SegmentDimension } from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { DivergingChart } from '../components/charts/diverging-chart';
import { SegmentTable } from '../components/charts/lazy-tables';
import { EmptyState, PartialNotice, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPoints } from '../lib/format';
import { DIMENSION_LABELS, segmentLabel } from '../lib/labels';
import { filtersOf } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppAlert,
  AppBand,
  AppCard,
  AppGrid,
  AppParagraph,
  AppReveal,
  AppStack,
  AppTabs,
  AppTag,
  AppText,
  AppTitle,
  FallOutlined,
  PALETTES,
  RiseOutlined,
  WarningOutlined,
  useThemeMode,
} from '../ui';

function biggestGap(stats: readonly SegmentDelta[]): SegmentDelta | undefined {
  const reliable = stats.filter((stat) => !stat.lowSample);
  const pool = reliable.length > 0 ? reliable : stats;
  return [...pool].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
}

function SegmentCard({ stat, dimension }: { stat: SegmentDelta; dimension: SegmentDimension }) {
  const p = PALETTES[useThemeMode()];
  return (
    <AppCard role="article" aria-label={segmentLabel(dimension, stat.segment)} fullHeight>
      <AppStack gap={3}>
        <div className="ih-row ih-between ih-start ih-gap-2">
          <AppTitle level={3}>{segmentLabel(dimension, stat.segment)}</AppTitle>
          {stat.lowSample ? (
            <AppTag tone="passive" icon={<WarningOutlined aria-hidden="true" />}>
              Amostra pequena
            </AppTag>
          ) : null}
        </div>
        <p className="ih-display ih-tabular ih-big-number">{formatNps(stat.nps)}</p>
        <AppText tone={stat.delta >= 0 ? 'promoter' : 'detractor'} strong>
          {formatPoints(stat.delta)} em relação ao geral
        </AppText>
        <AppBand
          label={`Detratores ${stat.detractors}%, neutros ${stat.passives}%, promotores ${stat.promoters}%`}
          parts={[
            { key: 'd', label: 'Detratores', value: stat.detractors, color: p.detractorBar },
            { key: 'n', label: 'Neutros', value: stat.passives, color: p.passiveBar },
            { key: 'p', label: 'Promotores', value: stat.promoters, color: p.promoterBar },
          ]}
        />
        <AppText tone="muted" small>
          {formatNumber(stat.count)} respostas · nota média {stat.averageScore.toLocaleString('pt-BR')}
        </AppText>
      </AppStack>
    </AppCard>
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
    <AppStack gap={5}>
      <div className="ih-row ih-gap-3">
        <span className="ih-label" style={{ margin: 0 }}>
          Comparar por
        </span>
        <AppTabs
          aria-label="Comparar por"
          tabsOnly
          activeKey={dimension}
          onChange={(key) => patch({ dimension: key === 'plan' ? undefined : (key as SegmentDimension) })}
          items={SEGMENT_DIMENSIONS.map((option) => ({ key: option, label: DIMENSION_LABELS[option] }))}
        />
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
                <PartialNotice message={`Exibindo ${data.partial.loaded} de ${data.partial.expected} segmentos.`} onRetry={() => void query.refetch()} />
              ) : null}

              {gap && stats.length > 1 ? (
                <AppCard role="region" aria-label="Maior diferença">
                  <div className="ih-row ih-gap-4 ih-nowrap">
                    <span className="ih-gap-icon" style={{ color: gap.delta >= 0 ? 'var(--ih-promoter)' : 'var(--ih-detractor)', background: gap.delta >= 0 ? 'var(--ih-primary-soft)' : 'var(--ih-accent-soft)' }}>
                      {gap.delta >= 0 ? <RiseOutlined aria-hidden="true" /> : <FallOutlined aria-hidden="true" />}
                    </span>
                    <AppParagraph>
                      <strong>{segmentLabel(dimension, gap.segment)}</strong> é o segmento que mais se afasta do NPS geral (<strong className="ih-tabular">{formatNps(data.overall.nps)}</strong>):{' '}
                      <AppText strong tabular tone={gap.delta >= 0 ? 'promoter' : 'detractor'}>
                        {formatPoints(gap.delta)}
                      </AppText>
                      , com {formatNumber(gap.count)} respostas.
                    </AppParagraph>
                  </div>
                </AppCard>
              ) : null}

              {data.truncated ? <PartialNotice message="A API limita a análise a 5.000 respostas; os números abaixo cobrem só uma parte da pesquisa." /> : null}

              {small.length > 0 ? (
                <AppAlert
                  kind="warning"
                  title="Cuidado com amostras pequenas."
                  description={`${small.length === 1 ? 'Um segmento tem' : `${small.length} segmentos têm`} menos de ${LOW_SAMPLE_THRESHOLD} respostas (${small
                    .map((segment) => segmentLabel(dimension, segment.segment))
                    .join(', ')}). Com tão poucos dados, o NPS varia muito e não sustenta conclusões. Estes segmentos aparecem listrados.`}
                />
              ) : null}

              <ChartCard
                title={`NPS por ${DIMENSION_LABELS[dimension].toLowerCase()}, comparado ao geral`}
                description={`Geral: ${formatNps(data.overall.nps)} em ${formatNumber(data.overall.total)} respostas. Barras para a direita estão acima da média. Segmentos com menos de ${LOW_SAMPLE_THRESHOLD} respostas recebem aviso de amostra pequena.`}
                chart={<DivergingChart stats={stats} dimension={dimension} overallNps={data.overall.nps} />}
                table={<SegmentTable stats={stats} dimension={dimension} />}
              />

              <section aria-label="Segmentos lado a lado">
                <h2 className="ih-sr-only">Segmentos lado a lado</h2>
                <AppGrid columns={{ base: 1, sm: 2, lg: 3 }}>
                  {stats.map((stat, index) => (
                    <AppReveal key={stat.segment} index={index}>
                      <SegmentCard stat={stat} dimension={dimension} />
                    </AppReveal>
                  ))}
                </AppGrid>
              </section>
            </>
          );
        }}
      </QueryView>
    </AppStack>
  );
}
