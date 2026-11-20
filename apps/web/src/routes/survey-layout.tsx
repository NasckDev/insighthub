import { useQuery } from '@tanstack/react-query';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useClient } from '../components/app-context';
import { FacetPanel } from '../components/facet-panel';
import { FilterBar } from '../components/filter-bar';
import { PAGE_TITLES, type NavItem } from '../components/nav-items';
import { ResponseDialog } from '../components/response-dialog';
import { ErrorState, LoadingBlock } from '../components/states';
import { formatNps, formatNumber } from '../lib/format';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

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
        error={new Error('Essa pesquisa não existe nesta demo.')}
        onRetry={() => void navigate({ to: '/' })}
      />
    );
  }

  const showFilters = section !== 'quadro';
  const showFacets = section === 'respostas';

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-80">
          <p className="eyebrow flex flex-wrap items-center gap-2">
            <span className="badge">{current.status === 'active' ? 'Ativa' : 'Encerrada'}</span>
            <span>
              {formatNumber(current.responseCount)} respostas
              {current.nps !== null ? ` · NPS geral ${formatNps(current.nps)}` : ''}
            </span>
          </p>
          <h1 className="display m-0 mt-1 text-[32px] sm:text-[40px]">{PAGE_TITLES[section] ?? current.title}</h1>
          <p className="m-0 mt-1 text-sm text-muted">{current.title}</p>
        </div>
        <div className="max-sm:w-full sm:w-[22rem]">
          <label htmlFor="survey-select" className="label">
            Pesquisa
          </label>
          <select
            id="survey-select"
            className="field w-full"
            value={surveyId}
            onChange={(event) =>
              void navigate({ to: '.', params: (previous: object) => ({ ...previous, surveyId: event.target.value }), search: {} as never })
            }
          >
            {surveys.data.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {showFilters ? (
        <div className="glass sticky top-[53px] z-10 -mx-4 border-b border-line px-4 py-2.5 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
          <FilterBar facetsVisible={showFacets} />
        </div>
      ) : null}

      {showFacets ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside aria-label="Facetas" className="card sticky top-24 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto lg:block">
            <FacetPanel />
          </aside>
          <div className="flex min-w-0 flex-col gap-4">
            <Outlet />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
      {search.r ? (
        <ResponseDialog surveyId={surveyId} responseId={search.r} onClose={() => patch({ r: undefined })} />
      ) : null}
    </div>
  );
}
