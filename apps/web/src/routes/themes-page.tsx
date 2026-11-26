import { LOW_SAMPLE_THRESHOLD, sentimentLabel, THEME_LABELS, type Theme, type ThemeStat } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { SENTIMENT_STYLE } from '../components/charts/chart-theme';
import { ThemeTable } from '../components/charts/lazy-tables';
import { ThemePicker, TreemapChart } from '../components/charts/treemap-chart';
import { clearFiltersPatch } from '../components/filter-bar';
import { NavButton } from '../components/nav-button';
import { Avatar, ScoreBadge } from '../components/response-bits';
import { EmptyState, LoadingBlock, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPercent, plural } from '../lib/format';
import { personOf } from '../lib/people';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppEmpty,
  AppGrid,
  AppGridItem,
  AppLegend,
  AppParagraph,
  AppReveal,
  AppStack,
  AppTag,
  AppText,
  AppTitle,
  ArrowRightOutlined,
  BulbOutlined,
  PALETTES,
  useThemeMode,
} from '../ui';

const QUOTES_SHOWN = 6;

function DrillDown({ stat }: { stat: ThemeStat }) {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = { ...filtersOf(search), theme: stat.theme };
  const quotes = useQuery({
    queryKey: ['theme-quotes', surveyId, filters],
    queryFn: ({ signal }) => client.listResponses(surveyId, filters, { page: 1, pageSize: QUOTES_SHOWN, sort: 'score-asc' }, { signal }),
  });
  const style = SENTIMENT_STYLE[sentimentLabel(stat.sentiment)];

  return (
    <AppCard role="region" aria-label={`Detalhe do tema ${stat.label}`}>
      <AppStack gap={4}>
        <div>
          <p className="ih-eyebrow">Tema selecionado</p>
          <AppTitle level={2}>{stat.label}</AppTitle>
          <div className="ih-row ih-gap-2" style={{ marginTop: 'var(--ih-space-2)' }}>
            <AppTag tone={style.tone} icon={style.icon}>
              {style.label} · NPS {formatNps(stat.sentiment)}
            </AppTag>
            <AppText tone="muted" small>
              {plural(stat.mentions, 'menção', 'menções')} · {stat.share}% das respostas
            </AppText>
          </div>
        </div>
        {stat.lowSample ? (
          <AppAlert kind="warning" title="Amostra pequena." description={`Menos de ${LOW_SAMPLE_THRESHOLD} respostas citam este tema; o sentimento varia muito com poucos dados.`} />
        ) : null}
        <AppGrid columns={{ base: 3 }} tight role="list" aria-label="Divisão por faixa de NPS">
          <CountTile value={stat.promoters} label="promotores" tone="promoter" />
          <CountTile value={stat.passives} label="neutros" tone="passive" />
          <CountTile value={stat.detractors} label="detratores" tone="detractor" />
        </AppGrid>
        <div>
          <AppTitle level={3}>O que dizem (das menores notas para as maiores)</AppTitle>
          <div style={{ marginTop: 'var(--ih-space-3)' }}>
            {quotes.isPending ? <LoadingBlock label="Carregando falas" height={180} /> : null}
            {quotes.data ? (
              <ul className="ih-stack ih-gap-4" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {quotes.data.items.map((item) => (
                  <li key={item.id} className="ih-row ih-gap-3 ih-start ih-nowrap">
                    <Avatar respondentId={item.respondentId} size={32} />
                    <div className="ih-fill">
                      <p className="ih-quote" style={{ fontSize: '1rem' }}>
                        {item.comment}
                      </p>
                      <div className="ih-row ih-gap-2" style={{ marginTop: 'var(--ih-space-1)' }}>
                        <AppText tone="muted" small>
                          {personOf(item.respondentId).name}
                        </AppText>
                        <ScoreBadge score={item.npsScore} />
                        <button type="button" className="ih-cite" aria-label={`Abrir resposta ${item.id}`} onClick={() => patch({ r: item.id })}>
                          {item.id}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="ih-row ih-gap-2">
          <NavButton size="sm" to="/s/$surveyId/respostas" params={{ surveyId }} search={(previous: object) => ({ ...previous, theme: stat.theme, t: undefined })}>
            Ver {formatNumber(stat.mentions)} na tabela
            <ArrowRightOutlined aria-hidden="true" />
          </NavButton>
          <NavButton size="sm" icon={<BulbOutlined />} to="/s/$surveyId/sintese" params={{ surveyId }} search={(previous: object) => ({ ...previous, theme: stat.theme, t: undefined })}>
            Resumir este tema
          </NavButton>
        </div>
      </AppStack>
    </AppCard>
  );
}

function CountTile({ value, label, tone }: { value: number; label: string; tone: 'promoter' | 'passive' | 'detractor' }) {
  const background = tone === 'promoter' ? 'var(--ih-primary-soft)' : tone === 'passive' ? 'var(--ih-neutral-soft)' : 'var(--ih-accent-soft)';
  return (
    <div role="listitem" className="ih-count-tile" style={{ background }}>
      <span className="ih-display ih-tabular" style={{ color: `var(--ih-${tone})`, fontSize: '1.4rem' }}>
        {value}
      </span>
      {label}
    </div>
  );
}

export function ThemesPage() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const p = PALETTES[useThemeMode()];
  const filters = filtersOf(search);
  const analysis = useQuery({
    queryKey: ['analysis', surveyId, filters],
    queryFn: ({ signal }) => client.getAnalysis(surveyId, filters, { signal }),
  });

  return (
    <QueryView
      query={analysis}
      loadingLabel="Carregando temas"
      loadingHeight={420}
      empty={(data) =>
        data.themes.length === 0 ? (
          <EmptyState
            illustration="themes"
            title="Nenhum tema neste recorte"
            description="Não há comentários suficientes com os filtros atuais para identificar temas."
            action={hasActiveFilters(search) ? <AppButton onClick={() => patch(clearFiltersPatch())}>Limpar filtros</AppButton> : undefined}
          />
        ) : null
      }
    >
      {({ themes }) => {
        const selected = themes.find((stat) => stat.theme === search.t);
        const selectTheme = (theme: Theme) => patch({ t: search.t === theme ? undefined : theme });
        const legend = (['positive', 'mixed', 'negative'] as const).map((key) => ({
          key,
          label: `${SENTIMENT_STYLE[key].label} (${SENTIMENT_STYLE[key].range})`,
          color: key === 'positive' ? p.promoterBar : key === 'mixed' ? p.passiveBar : p.detractorBar,
          pattern: key === 'positive' ? p.primarySoft : key === 'mixed' ? p.neutralSoft : p.accentSoft,
        }));
        return (
          <AppGrid columns={{ base: 1 }} twelve>
            <AppGridItem span={7}>
              <AppReveal>
                <ChartCard
                  title="Mapa de temas"
                  description="O tamanho é o número de menções; o preenchimento, a palavra e o NPS são o sentimento. Clique para ver as falas."
                  chart={
                    <AppStack gap={3}>
                      <TreemapChart themes={themes} selected={search.t} onSelect={selectTheme} />
                      <ThemePicker themes={themes} selected={search.t} onSelect={selectTheme} />
                      <AppLegend label="Legenda de sentimento" items={legend} />
                    </AppStack>
                  }
                  table={<ThemeTable themes={themes} />}
                />
              </AppReveal>
            </AppGridItem>
            <AppGridItem span={5}>
              <AppReveal index={1}>
                {selected ? (
                  <DrillDown stat={selected} />
                ) : (
                  <AppCard role="region" aria-label="Detalhe do tema">
                    <AppEmpty
                      framed={false}
                      illustration="themes"
                      title="Escolha um tema"
                      description="Clique em um bloco do mapa, ou em um dos botões abaixo dele, para ler o que as pessoas disseram sobre o tema."
                      action={
                        <AppParagraph tone="muted" small>
                          {themes.length} temas · {formatPercent(themes[0]?.mentions ?? 0, themes.reduce((sum, theme) => sum + theme.mentions, 0))} das menções estão em {themes[0] ? THEME_LABELS[themes[0].theme] : '—'}
                        </AppParagraph>
                      }
                    />
                  </AppCard>
                )}
              </AppReveal>
            </AppGridItem>
          </AppGrid>
        );
      }}
    </QueryView>
  );
}
