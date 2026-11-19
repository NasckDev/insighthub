import { classifyNps, DEFAULT_PAGE_SIZE, type SurveyResponse } from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useClient } from '../components/app-context';
import { EmptyState, PartialNotice, QueryView } from '../components/states';
import { formatDate, formatNumber } from '../lib/format';
import { NPS_SINGULAR, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { filtersOf, hasActiveFilters } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

const PAGE_SIZES = [10, 20, 50] as const;
const CATEGORY_COLOR = {
  promoter: 'var(--promoter)',
  passive: 'var(--passive)',
  detractor: 'var(--detractor)',
} as const;

function Highlight({ text, term }: { text: string; term: string | undefined }) {
  if (!term) return <>{text}</>;
  const index = text.toLocaleLowerCase('pt-BR').indexOf(term.toLocaleLowerCase('pt-BR'));
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm px-0.5" style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)' }}>
        {text.slice(index, index + term.length)}
      </mark>
      {text.slice(index + term.length)}
    </>
  );
}

function ScoreCell({ score }: { score: number }) {
  const category = classifyNps(score);
  return (
    <span className="font-semibold" style={{ color: CATEGORY_COLOR[category] }}>
      {score} <span className="font-normal">· {NPS_SINGULAR[category]}</span>
    </span>
  );
}

function ResponseRow({
  item,
  term,
  onOpen,
}: {
  item: SurveyResponse;
  term?: string;
  onOpen: (id: string) => void;
}) {
  return (
    <tr>
      <td>
        <button
          type="button"
          className="cite"
          aria-label={`Abrir resposta ${item.id}`}
          onClick={() => onOpen(item.id)}
        >
          {item.id}
        </button>
      </td>
      <td className="whitespace-nowrap">{formatDate(item.submittedAt)}</td>
      <td>{PLAN_LABELS[item.plan]}</td>
      <td>{REGION_LABELS[item.region]}</td>
      <td>{ROLE_LABELS[item.role]}</td>
      <td className="whitespace-nowrap">
        <ScoreCell score={item.npsScore} />
      </td>
      <td className="min-w-72">
        <Highlight text={item.comment} term={term} />
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

  const query = useQuery({
    queryKey: ['responses', surveyId, filters, page, pageSize],
    queryFn: ({ signal }) => client.listResponses(surveyId, filters, { page, pageSize }, { signal }),
    placeholderData: keepPreviousData,
  });

  return (
    <QueryView
      query={query}
      loadingLabel="Carregando respostas"
      loadingHeight={320}
      empty={(data) => {
        if (data.total === 0) {
          return (
            <EmptyState
              title="Nenhuma resposta encontrada"
              description="Nenhuma resposta corresponde aos filtros e à busca atuais."
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
                        page: undefined,
                      })
                    }
                  >
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
          <section className="card flex flex-col gap-3 p-0! sm:p-0!" aria-label="Respostas">
            <p className="m-0 px-4 pt-4 text-sm text-muted" aria-live="polite">
              {formatNumber(data.total)} respostas · página {data.page} de {data.totalPages}
            </p>
            {/* A scrollable region must be focusable so keyboard users can scroll it. */}
            {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Tabela de respostas, role para ver mais colunas"
            >
              {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
              <table className="data-table">
                <caption className="sr-only">Respostas da pesquisa</caption>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Data</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Região</th>
                    <th scope="col">Função</th>
                    <th scope="col">Nota</th>
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
            <nav
              aria-label="Paginação"
              className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4"
            >
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
                <button
                  type="button"
                  className="btn"
                  disabled={data.page <= 1}
                  onClick={() => patch({ page: data.page - 1 })}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={data.page >= data.totalPages}
                  onClick={() => patch({ page: data.page + 1 })}
                >
                  Próxima
                </button>
              </div>
            </nav>
          </section>
        </Fragment>
      )}
    </QueryView>
  );
}
