import { LOW_SAMPLE_THRESHOLD, sentimentLabel, THEME_LABELS, type Theme, type ThemeStat } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, MousePointerClick, Sparkles, TriangleAlert } from 'lucide-react';
import { useClient } from '../components/app-context';
import { ChartCard } from '../components/charts/chart-card';
import { SENTIMENT_STYLE, ThemeTable, TreemapChart } from '../components/charts/treemap-chart';
import { clearFiltersPatch } from '../components/filter-bar';
import { Reveal } from '../components/motion';
import { Avatar, ScoreBadge } from '../components/response-bits';
import { EmptyState, LoadingBlock, QueryView } from '../components/states';
import { formatNps, formatNumber, formatPercent, plural } from '../lib/format';
import { personOf } from '../lib/people';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import { Illustration } from '../components/illustrations';

const QUOTES_SHOWN = 6;

function DrillDown({ stat }: { stat: ThemeStat }) {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = { ...filtersOf(search), theme: stat.theme };
  const quotes = useQuery({
    queryKey: ['theme-quotes', surveyId, filters],
    queryFn: ({ signal }) =>
      client.listResponses(surveyId, filters, { page: 1, pageSize: QUOTES_SHOWN, sort: 'score-asc' }, { signal }),
  });
  const style = SENTIMENT_STYLE[sentimentLabel(stat.sentiment)];

  return (
    <section aria-label={`Detalhe do tema ${stat.label}`} className="card flex flex-col gap-4">
      <div>
        <p className="eyebrow">Tema selecionado</p>
        <h2 className="display m-0 text-2xl">{stat.label}</h2>
        <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="badge" style={{ background: style.bg, color: style.text, borderColor: 'transparent' }}>
            <style.Icon aria-hidden="true" size={13} />
            {style.label} · NPS {formatNps(stat.sentiment)}
          </span>
          <span className="text-muted">
            {plural(stat.mentions, 'menção', 'menções')} · {stat.share}% das respostas
          </span>
        </p>
      </div>
      {stat.lowSample ? (
        <p role="note" className="m-0 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)' }}>
          <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Amostra pequena.</strong> Menos de {LOW_SAMPLE_THRESHOLD} respostas citam este tema; o sentimento
            varia muito com poucos dados.
          </span>
        </p>
      ) : null}
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 text-center text-sm">
        <li className="rounded-xl bg-primary-soft p-2">
          <span className="display block text-xl tabular-nums" style={{ color: 'var(--promoter)' }}>{stat.promoters}</span>
          promotores
        </li>
        <li className="rounded-xl p-2" style={{ background: 'var(--amber-soft)' }}>
          <span className="display block text-xl tabular-nums" style={{ color: 'var(--passive)' }}>{stat.passives}</span>
          neutros
        </li>
        <li className="rounded-xl bg-accent-soft p-2">
          <span className="display block text-xl tabular-nums" style={{ color: 'var(--detractor)' }}>{stat.detractors}</span>
          detratores
        </li>
      </ul>
      <div>
        <h3 className="eyebrow mb-2">O que dizem (das menores notas para as maiores)</h3>
        {quotes.isPending ? <LoadingBlock label="Carregando falas" height={180} /> : null}
        {quotes.data ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {quotes.data.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <Avatar respondentId={item.respondentId} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="quote m-0 text-[16px]">{item.comment}</p>
                  <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {personOf(item.respondentId).name}
                    <ScoreBadge score={item.npsScore} />
                    <button
                      type="button"
                      className="cite"
                      aria-label={`Abrir resposta ${item.id}`}
                      onClick={() => patch({ r: item.id })}
                    >
                      {item.id}
                    </button>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/s/$surveyId/respostas"
          params={{ surveyId }}
          search={(previous) => ({ ...previous, theme: stat.theme, t: undefined })}
          className="btn btn-sm"
        >
          Ver {formatNumber(stat.mentions)} na tabela
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
        <Link
          to="/s/$surveyId/sintese"
          params={{ surveyId }}
          search={(previous) => ({ ...previous, theme: stat.theme, t: undefined })}
          className="btn btn-sm"
        >
          <Sparkles aria-hidden="true" size={14} />
          Resumir este tema
        </Link>
      </div>
    </section>
  );
}

export function ThemesPage() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
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
      {({ themes }) => {
        const selected = themes.find((stat) => stat.theme === search.t);
        const selectTheme = (theme: Theme) => patch({ t: search.t === theme ? undefined : theme });
        return (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <Reveal className="min-w-0 lg:col-span-7">
              <ChartCard
                title="Mapa de temas"
                description="O tamanho é o número de menções; a cor e o ícone são o sentimento (NPS de quem cita). Clique para ver as falas."
                chart={
                  <div className="flex flex-col gap-3">
                    <TreemapChart themes={themes} selected={search.t} onSelect={selectTheme} />
                    <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-sm" aria-label="Legenda de sentimento">
                      {(['positive', 'mixed', 'negative'] as const).map((key) => {
                        const style = SENTIMENT_STYLE[key];
                        return (
                          <li key={key} className="flex items-center gap-2">
                            <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: style.bg, borderTop: `3px solid ${style.edge}` }} />
                            {style.label} ({key === 'positive' ? 'NPS ≥ +15' : key === 'negative' ? 'NPS ≤ −15' : 'entre −15 e +15'})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                }
                table={<ThemeTable themes={themes} />}
              />
            </Reveal>
            <Reveal index={1} className="min-w-0 lg:col-span-5">
              {selected ? (
                <DrillDown stat={selected} />
              ) : (
                <section className="card flex flex-col items-center gap-2 py-8 text-center" aria-label="Detalhe do tema">
                  <Illustration name="themes" />
                  <h2 className="display m-0 mt-2 text-xl">Escolha um tema</h2>
                  <p className="m-0 flex max-w-xs items-center gap-2 text-sm text-muted">
                    <MousePointerClick aria-hidden="true" size={16} className="shrink-0" />
                    Clique em um bloco do mapa para ler o que as pessoas disseram sobre ele.
                  </p>
                  <p className="m-0 text-xs text-muted">
                    {themes.length} temas · {formatPercent(themes[0]?.mentions ?? 0, themes.reduce((sum, t) => sum + t.mentions, 0))} das menções
                    estão em {themes[0] ? THEME_LABELS[themes[0].theme] : '—'}
                  </p>
                </section>
              )}
            </Reveal>
          </div>
        );
      }}
    </QueryView>
  );
}
