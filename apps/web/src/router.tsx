import {
  createHashHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router';
import { AppShell } from './components/app-shell';
import { EmptyState } from './components/states';
import { parseSearchString, stringifySearchObject, validateSurveySearch } from './lib/search';
import { ComparePage } from './routes/compare-page';
import { OverviewPage } from './routes/overview-page';
import { ResponsesPage } from './routes/responses-page';
import { SurveyLayout } from './routes/survey-layout';
import { SynthesisPage } from './routes/synthesis-page';

export const DEFAULT_SURVEY_ID = 's-atlas-q3';

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <EmptyState title="Página não encontrada" description="Use o menu para voltar a uma tela existente." />
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
  component: OverviewPage,
});
const responsesRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'respostas',
  component: ResponsesPage,
});
const compareRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'comparar',
  component: ComparePage,
});
const synthesisRoute = createRoute({
  getParentRoute: () => surveyRoute,
  path: 'sintese',
  component: SynthesisPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  surveyRoute.addChildren([surveyIndexRoute, overviewRoute, responsesRoute, compareRoute, synthesisRoute]),
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
  });
}

export { createMemoryHistory };

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
