import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useClient } from '../components/app-context';
import { FacetPanel } from '../components/facet-panel';
import { FilterBar } from '../components/filter-bar';
import { PAGE_TITLES, type NavItem } from '../components/nav-items';
import { ResponseDialog } from '../components/response-dialog';
import { ErrorState, LoadingBlock } from '../components/states';
import { formatNps, formatNumber } from '../lib/format';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import { AppCard, AppPageHeader, AppSelect, AppStack, AppTag } from '../ui';

export function SurveyLayout() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const section = (pathname.split('/').pop() ?? '') as NavItem['slug'];

  const surveys = useQuery({
    queryKey: ['surveys'],
    queryFn: ({ signal }) => client.listSurveys({ signal }),
  });

  if (surveys.isPending) return <LoadingBlock label="Carregando pesquisas" height={140} />;
  if (surveys.isError) return <ErrorState error={surveys.error} onRetry={() => void surveys.refetch()} />;

  const current = surveys.data.find((survey) => survey.id === surveyId);
  if (!current) {
    return (
      <ErrorState
        title="Pesquisa não encontrada"
        error={new Error('Essa pesquisa não existe nesta demonstração. Escolha outra na lista.')}
        onRetry={() => void navigate({ to: '/' })}
      />
    );
  }

  const showFilters = section !== 'quadro';
  const showFacets = section === 'respostas';
  const pageTitle = PAGE_TITLES[section] ?? current.title;

  const body = showFacets ? (
    <div className="ih-with-facets">
      <aside aria-label="Facetas" className="ih-facets">
        <AppCard>
          <FacetPanel />
        </AppCard>
      </aside>
      <AppStack gap={4}>
        <Outlet />
      </AppStack>
    </div>
  ) : (
    <Outlet />
  );

  return (
    <AppStack gap={4}>
      <AppPageHeader
        title={pageTitle}
        breadcrumb={[
          { title: <Link to="/">InsightHub</Link> },
          { title: pageTitle },
        ]}
        eyebrow={
          <>
            <AppTag tone={current.status === 'active' ? 'primary' : 'neutral'}>{current.status === 'active' ? 'Ativa' : 'Encerrada'}</AppTag>
            <span>
              {formatNumber(current.responseCount)} respostas
              {current.nps !== null ? ` · NPS geral ${formatNps(current.nps)}` : ''}
            </span>
          </>
        }
        extra={
          <div className="ih-survey-picker">
            <label htmlFor="survey-select" className="ih-label">
              Pesquisa
            </label>
            <AppSelect
              id="survey-select"
              value={surveyId}
              style={{ width: '100%' }}
              options={surveys.data.map((survey) => ({ value: survey.id, label: survey.title }))}
              onChange={(value) =>
                void navigate({ to: '.', params: (previous: object) => ({ ...previous, surveyId: value }), search: {} as never })
              }
            />
          </div>
        }
      />

      {showFilters ? (
        <div className="ih-filterbar">
          <FilterBar facetsVisible={showFacets} />
        </div>
      ) : null}

      {body}
      {search.r ? <ResponseDialog surveyId={surveyId} responseId={search.r} onClose={() => patch({ r: undefined })} /> : null}
    </AppStack>
  );
}
