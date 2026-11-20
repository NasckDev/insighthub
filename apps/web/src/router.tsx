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
import { lazy, Suspense } from 'react';
import { LoadingBlock } from './components/loading';
import { parseSearchString, stringifySearchObject, validateSurveySearch } from './lib/search';

import { DEFAULT_SURVEY_ID } from './lib/constants';

export { DEFAULT_SURVEY_ID };

// Failure screens are rarely seen, so they load on demand and keep Ant Design's Result and Empty out of the entry.
const RouteErrorLazy = lazy(() => import('./components/route-failure').then((m) => ({ default: m.RouteError })));
const NotFoundLazy = lazy(() => import('./components/route-failure').then((m) => ({ default: m.NotFound })));

function RouteError(props: { error: unknown; reset: () => void }) {
  return (
    <Suspense fallback={<LoadingBlock label="Carregando" height={160} />}>
      <RouteErrorLazy {...props} />
    </Suspense>
  );
}

function RoutePending() {
  return <LoadingBlock label="Carregando tela" height={240} />;
}

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <Suspense fallback={null}>
      <NotFoundLazy />
    </Suspense>
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
  component: lazyRouteComponent(() => import('./routes/survey-layout'), 'SurveyLayout'),
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
