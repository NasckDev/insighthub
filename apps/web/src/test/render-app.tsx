import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { ClientProvider } from '../components/app-context';
import { createDemoClient, type DemoClientOptions } from '../data/demo-client';
import { createAppRouter, createMemoryHistory } from '../router';
import { AppProvider } from '../ui';

/** Renders the whole app on a memory history with an instant demo client. */
export function renderApp(path: string, options: DemoClientOptions = {}) {
  const client = createDemoClient({ latencyMs: 0, chunkDelayMs: 0, ...options });
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const view = render(
    <AppProvider>
      <ClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ClientProvider>
    </AppProvider>,
  );
  return { ...view, client, router };
}
