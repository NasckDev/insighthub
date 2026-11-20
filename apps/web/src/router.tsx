import {
  createHashHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  createRouter,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router';
import { AppShell } from './components/app-shell';
import { EmptyState, ErrorState, LoadingBlock } from './components/states';
import { parseSearchString, stringifySearchObject, validateSurveySearch } from './lib/search';
import { SurveyLayout } from './routes/survey-layout';

import { DEFAULT_SURVEY_ID } from './lib/constants';

export { DEFAULT_SURVEY_ID };

/** Anything a screen throws (bad address, broken data) lands here in plain language, never as a blank page. */
function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <ErrorState
      title="Algo deu errado nesta tela"
      error={new Error(error instanceof Error && error.message ? 'Não foi possível montar esta tela com os dados do endereço.' : 'Erro inesperado.')}
      onRetry={reset}
    />
  );
}

function RoutePending() {
  return <LoadingBlock label="Carregando tela" height={240} />;
}

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <EmptyState
      title="Página não encontrada"
      description="Use o menu para voltar a uma tela existente."
      illustration="search"
    />
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/s/$surveyId/visao-geral', params: { surveyId: DEFAULT_SURVEY_ID } });
  },
});

const surveyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 's/$surveyId',
  validateSearch: validateSurveySearch,
  component: SurveyLayout,
});

const surveyIndexRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/s/$surveyId/visao-geral', params, search: (previous) => previous });
  },
});

const overviewRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'visao-geral',
  component: lazyRouteComponent(() => import('./routes/overview-page'), 'OverviewPage'),
});
const responsesRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'respostas',
  component: lazyRouteComponent(() => import('./routes/responses-page'), 'ResponsesPage'),
});
const compareRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'comparar',
  component: lazyRouteComponent(() => import('./routes/compare-page'), 'ComparePage'),
});
const synthesisRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'sintese',
  component: lazyRouteComponent(() => import('./routes/synthesis-page'), 'SynthesisPage'),
});
const themesRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'temas',
  component: lazyRouteComponent(() => import('./routes/themes-page'), 'ThemesPage'),
});
const boardRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'quadro',
  component: lazyRouteComponent(() => import('./routes/board-page'), 'BoardPage'),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  surveyRoute.addChildren([
    surveyIndexRoute,
    overviewRoute,
    responsesRoute,
    themesRoute,
    compareRoute,
    synthesisRoute,
    boardRoute,
  ]),
]);

/**
 * Hash history keeps every route inside `#/...`, so the static host never sees an inner path:
 * the app works under any subpath and survives a reload on any screen.
 * Tests pass a memory history instead.
 */
export function createAppRouter(history: RouterHistory = createHashHistory()) {
  return createRouter({
    routeTree,
    history,
    // Filters use the readable `?plan=pro,free` form instead of JSON-encoded values.
    parseSearch: parseSearchString,
    stringifySearch: stringifySearchObject,
    defaultPreload: false,
    defaultPendingMs: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
  });
}

export { createMemoryHistory };

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
