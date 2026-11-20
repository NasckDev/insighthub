import { DEFAULT_PAGE_SIZE, type SurveyResponse } from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { useClient } from '../components/app-context';
import { clearFiltersPatch } from '../components/filter-bar';
import { Avatar, HighlightText, ScoreBadge, ThemeChips } from '../components/response-bits';
import { EmptyState, PartialNotice, QueryView } from '../components/states';
import { RESPONSE_SORTS, type ResponseSort } from '../data';
import { formatDate, formatNumber } from '../lib/format';
import { PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { personOf } from '../lib/people';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

const PAGE_SIZES = [10, 20, 50] as const;

const SORT_LABELS: Record<ResponseSort, string> = {
  recent: 'Mais recentes',
  oldest: 'Mais antigas',
  'score-desc': 'Maior nota',
  'score-asc': 'Menor nota',
};

function ResponseRow({
  item,
  term,
  onOpen,
}: {
  item: SurveyResponse;
  term?: string;
  onOpen: (id: string) => void;
}) {
  const person = personOf(item.respondentId);
  return (
    <tr>
      <td>
        <button
          type="button"
          className="flex items-center gap-2.5 border-0 bg-transparent p-0 text-left"
          onClick={() => onOpen(item.id)}
        >
          <Avatar respondentId={item.respondentId} size={34} />
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              <span className="sr-only">Abrir resposta </span>
              {person.name}
            </span>
            <span className="font-mono text-xs text-muted">{item.id}</span>
          </span>
        </button>
      </td>
      <td className="whitespace-nowrap">
        <ScoreBadge score={item.npsScore} />
        <span className="mt-1 block text-xs text-muted">{formatDate(item.submittedAt)}</span>
      </td>
      <td className="meta">
        <span className="font-semibold text-fg">{PLAN_LABELS[item.plan]}</span>
        <span className="block md:mt-0.5">
          {REGION_LABELS[item.region]} · {ROLE_LABELS[item.role]}
        </span>
      </td>
      <td className="min-w-0 md:min-w-64">
        <p className="m-0 mb-1.5">
          <HighlightText text={item.comment} term={term} />
        </p>
        <ThemeChips comment={item.comment} />
      </td>
    </tr>
  );
}

export function ResponsesPage() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = filtersOf(search);
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = search.sort ?? 'recent';

  const query = useQuery({
    queryKey: ['responses', surveyId, filters, page, pageSize, sort],
    queryFn: ({ signal }) => client.listResponses(surveyId, filters, { page, pageSize, sort }, { signal }),
    placeholderData: keepPreviousData,
  });

  return (
    <QueryView
      query={query}
      loadingLabel="Carregando respostas"
      loadingHeight={420}
      empty={(data) => {
        if (data.total === 0) {
          return (
            <EmptyState
              illustration="search"
              title="Nenhuma resposta encontrada"
              description="Nenhuma resposta corresponde aos filtros e à busca atuais. Tente outro termo ou remova um filtro."
              action={
                hasActiveFilters(search) ? (
                  <button type="button" className="btn" onClick={() => patch(clearFiltersPatch())}>
                    Limpar filtros
                  </button>
                ) : undefined
              }
            />
          );
        }
        if (data.items.length === 0 && !data.partial) {
          return (
            <EmptyState
              title="Esta página não existe"
              description={`Há ${formatNumber(data.total)} respostas em ${data.totalPages} páginas.`}
              action={
                <button type="button" className="btn" onClick={() => patch({ page: undefined })}>
                  Voltar à primeira página
                </button>
              }
            />
          );
        }
        return null;
      }}
    >
      {(data) => (
        <Fragment>
          {data.partial ? (
            <PartialNotice
              message={`Foram carregadas ${data.partial.loaded} de ${data.partial.expected} linhas desta página.`}
              onRetry={() => void query.refetch()}
            />
          ) : null}
          <section className="flex flex-col gap-3" aria-label="Respostas">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-sm text-muted" aria-live="polite">
                {formatNumber(data.total)} respostas · página {data.page} de {data.totalPages}
              </p>
              {client.kind === 'demo' ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-muted">
                    Ordenar por
                  </label>
                  <select
                    id="sort"
                    className="field"
                    value={sort}
                    onChange={(event) => patch({ sort: event.target.value as ResponseSort, page: undefined })}
                  >
                    {RESPONSE_SORTS.map((option) => (
                      <option key={option} value={option}>
                        {SORT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="card p-0! md:overflow-hidden sm:p-0! max-md:border-0 max-md:bg-transparent max-md:shadow-none">
              {/* A scrollable region must be focusable so keyboard users can scroll it. */}
              {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
              <div className="md:overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de respostas, role para ver mais colunas">
                {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
                <table className="data-table rt">
                  <caption className="sr-only">Respostas da pesquisa</caption>
                  <thead>
                    <tr>
                      <th scope="col">Respondente</th>
                      <th scope="col">Nota e data</th>
                      <th scope="col">Perfil</th>
                      <th scope="col">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <ResponseRow key={item.id} item={item} term={search.q} onOpen={(r) => patch({ r })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-muted">
                  Por página
                </label>
                <select
                  id="page-size"
                  className="field"
                  value={pageSize}
                  onChange={(event) => patch({ pageSize: Number(event.target.value), page: undefined })}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn" disabled={data.page <= 1} onClick={() => patch({ page: data.page - 1 })}>
                  <ChevronLeft aria-hidden="true" size={16} />
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={data.page >= data.totalPages}
                  onClick={() => patch({ page: data.page + 1 })}
                >
                  Próxima
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              </div>
            </nav>
          </section>
        </Fragment>
      )}
    </QueryView>
  );
}
