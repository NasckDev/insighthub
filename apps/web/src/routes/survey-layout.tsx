import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useClient } from '../components/app-context';
import { FilterBar } from '../components/filter-bar';
import { ResponseDialog } from '../components/response-dialog';
import { ErrorState, LoadingBlock } from '../components/states';
import { formatNps, formatNumber } from '../lib/format';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

const SECTIONS = [
  { to: '/s/$surveyId/visao-geral', label: 'Visão geral' },
  { to: '/s/$surveyId/respostas', label: 'Respostas' },
  { to: '/s/$surveyId/comparar', label: 'Comparar segmentos', short: 'Comparar' },
  { to: '/s/$surveyId/sintese', label: 'Síntese' },
] as const;

export function SurveyLayout() {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const navigate = useNavigate();

  const surveys = useQuery({
    queryKey: ['surveys'],
    queryFn: ({ signal }) => client.listSurveys({ signal }),
  });

  if (surveys.isPending) return <LoadingBlock label="Carregando pesquisas" height={140} />;
  if (surveys.isError) return <ErrorState error={surveys.error} onRetry={() => void surveys.refetch()} />;

  const current = surveys.data.find((survey) => survey.id === surveyId);
  if (!current) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorState
          title="Pesquisa não encontrada"
          error={new Error('Essa pesquisa não existe nesta demo.')}
          onRetry={() => void navigate({ to: '/' })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Pesquisa" className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 basis-72">
          <h1 className="m-0 text-lg font-bold sm:text-2xl">{current.title}</h1>
          <p className="m-0 hidden text-sm text-muted sm:block">{current.description}</p>
          <p className="m-0 mt-1 text-sm text-muted">
            <span className="badge">{current.status === 'active' ? 'Ativa' : 'Encerrada'}</span>{' '}
            {formatNumber(current.responseCount)} respostas
            {current.nps !== null ? ` · NPS geral ${formatNps(current.nps)}` : ''}
          </p>
        </div>
        <div className="max-sm:w-full">
          <label htmlFor="survey-select" className="label">
            Pesquisa
          </label>
          <select
            id="survey-select"
            className="field w-full"
            value={surveyId}
            onChange={(event) =>
              void navigate({ to: '/s/$surveyId/visao-geral', params: { surveyId: event.target.value } })
            }
          >
            {surveys.data.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <nav aria-label="Seções da pesquisa" className="-mx-4 overflow-x-auto px-4">
        <ul className="m-0 flex min-w-max list-none gap-1 border-b border-line p-0">
          {SECTIONS.map((section) => (
            <li key={section.to}>
              <Link
                to={section.to}
                params={{ surveyId }}
                search={(previous) => previous}
                className="block border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-muted no-underline hover:text-fg"
                activeProps={{ className: 'border-primary! text-fg!' }}
              >
                {'short' in section ? (
                  <>
                    {section.short}
                    <span className="max-sm:sr-only"> segmentos</span>
                  </>
                ) : (
                  section.label
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <FilterBar />
      <Outlet />
      {search.r ? (
        <ResponseDialog surveyId={surveyId} responseId={search.r} onClose={() => patch({ r: undefined })} />
      ) : null}
    </div>
  );
}
