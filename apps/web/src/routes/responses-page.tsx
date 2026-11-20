import { DEFAULT_PAGE_SIZE, THEME_KEYS, THEME_LABELS, type SurveyResponse } from '@insighthub/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
import { AppButton, AppCard, AppPagination, AppSelect, AppStack, AppTable, AppTag, AppText, type AppColumn } from '../ui';

const PAGE_SIZES = [10, 20, 50] as const;

const SORT_LABELS: Record<ResponseSort, string> = {
  recent: 'Mais recentes',
  oldest: 'Mais antigas',
  'score-desc': 'Maior nota',
  'score-asc': 'Menor nota',
};

function Respondent({ item, onOpen }: { item: SurveyResponse; onOpen: (id: string) => void }) {
  const person = personOf(item.respondentId);
  return (
    <button type="button" className="ih-respondent" onClick={() => onOpen(item.id)}>
      <Avatar respondentId={item.respondentId} size={34} />
      <span className="ih-stack">
        <span className="ih-respondent-name">
          <span className="ih-sr-only">Abrir resposta </span>
          {person.name}
        </span>
        <span className="ih-respondent-id">{item.id}</span>
      </span>
    </button>
  );
}

function Profile({ item }: { item: SurveyResponse }) {
  return (
    <span className="ih-stack">
      <AppText strong>{PLAN_LABELS[item.plan]}</AppText>
      <AppText tone="muted" small>
        {REGION_LABELS[item.region]} · {ROLE_LABELS[item.role]}
      </AppText>
    </span>
  );
}

function Comment({ item, term }: { item: SurveyResponse; term?: string }) {
  return (
    <AppStack gap={2}>
      <span>
        <HighlightText text={item.comment} term={term} />
      </span>
      <ThemeChips comment={item.comment} />
    </AppStack>
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
  const open = (id: string) => patch({ r: id });

  const query = useQuery({
    queryKey: ['responses', surveyId, filters, page, pageSize, sort],
    queryFn: ({ signal }) => client.listResponses(surveyId, filters, { page, pageSize, sort }, { signal }),
    placeholderData: keepPreviousData,
  });

  const columns: AppColumn<SurveyResponse>[] = [
    { key: 'person', title: 'Respondente', width: '25%', render: (item) => <Respondent item={item} onOpen={open} /> },
    {
      key: 'score',
      title: 'Nota e data',
      nowrap: true,
      render: (item) => (
        <span className="ih-stack ih-gap-1" style={{ alignItems: 'flex-start' }}>
          <ScoreBadge score={item.npsScore} />
          <AppText tone="muted" small>
            {formatDate(item.submittedAt)}
          </AppText>
        </span>
      ),
    },
    { key: 'profile', title: 'Perfil', render: (item) => <Profile item={item} /> },
    { key: 'comment', title: 'Comentário', width: '38%', render: (item) => <Comment item={item} term={search.q} /> },
  ];

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
              description="Nenhuma resposta corresponde aos filtros e à busca atuais. Tente outro termo, remova um filtro ou comece por um tema."
              action={
                <AppStack gap={3} align="center">
                  <ul className="ih-row ih-gap-2 ih-center" style={{ margin: 0, padding: 0, listStyle: 'none' }} aria-label="Temas para explorar">
                    {THEME_KEYS.map((theme) => (
                      <li key={theme}>
                        <AppButton size="sm" onClick={() => patch({ ...clearFiltersPatch(), theme })}>
                          Ver tema {THEME_LABELS[theme]}
                        </AppButton>
                      </li>
                    ))}
                  </ul>
                  {hasActiveFilters(search) ? <AppButton onClick={() => patch(clearFiltersPatch())}>Limpar filtros</AppButton> : null}
                </AppStack>
              }
            />
          );
        }
        if (data.items.length === 0 && !data.partial) {
          return (
            <EmptyState
              title="Esta página não existe"
              description={`Há ${formatNumber(data.total)} respostas em ${data.totalPages} páginas.`}
              action={<AppButton onClick={() => patch({ page: undefined })}>Voltar à primeira página</AppButton>}
            />
          );
        }
        return null;
      }}
    >
      {(data) => (
        <>
          {data.partial ? (
            <PartialNotice message={`Foram carregadas ${data.partial.loaded} de ${data.partial.expected} linhas desta página.`} onRetry={() => void query.refetch()} />
          ) : null}
          <section aria-label="Respostas">
            <AppStack gap={3}>
              <div className="ih-row ih-between ih-gap-3">
                <p className="ih-muted" aria-live="polite" style={{ margin: 0 }}>
                  {formatNumber(data.total)} respostas · página {data.page} de {data.totalPages}
                  {search.q ? (
                    <>
                      {' '}
                      <AppTag tone="primary">busca ativa</AppTag>
                    </>
                  ) : null}
                </p>
                {client.kind === 'demo' ? (
                  <div className="ih-row ih-gap-2 ih-nowrap">
                    <label htmlFor="sort" className="ih-muted">
                      Ordenar por
                    </label>
                    <AppSelect<ResponseSort>
                      id="sort"
                      value={sort}
                      options={RESPONSE_SORTS.map((option) => ({ value: option, label: SORT_LABELS[option] }))}
                      onChange={(value) => patch({ sort: value, page: undefined })}
                      popupMatchSelectWidth={false}
                    />
                  </div>
                ) : null}
              </div>
              <AppCard styles={{ body: { padding: 0 } }} appearance="outlined" className="ih-table-card">
                <AppTable<SurveyResponse>
                  label="Respostas da pesquisa"
                  rows={data.items}
                  rowKey={(item) => item.id}
                  columns={columns}
                  mobileCard={(item) => (
                    <AppStack gap={3}>
                      <div className="ih-row ih-between ih-start ih-gap-2 ih-nowrap">
                        <Respondent item={item} onOpen={open} />
                        <ScoreBadge score={item.npsScore} />
                      </div>
                      <Comment item={item} term={search.q} />
                      <AppText tone="muted" small>
                        {formatDate(item.submittedAt)} · {PLAN_LABELS[item.plan]} · {REGION_LABELS[item.region]} · {ROLE_LABELS[item.role]}
                      </AppText>
                    </AppStack>
                  )}
                />
              </AppCard>
              <nav aria-label="Paginação">
                <AppPagination
                  current={data.page}
                  pageSize={pageSize}
                  total={data.total}
                  pageSizeOptions={PAGE_SIZES}
                  onChange={(nextPage, nextSize) => patch(nextSize !== pageSize ? { pageSize: nextSize, page: undefined } : { page: nextPage })}
                />
              </nav>
            </AppStack>
          </section>
        </>
      )}
    </QueryView>
  );
}
