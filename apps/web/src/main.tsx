import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClientHost } from './components/connection';
import { createAppRouter } from './router';
import { AppProvider, injectPaletteCss } from './ui';

// The palette goes into <head> before React renders, so the first paint already has the right colors.
injectPaletteCss();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // A 4xx will not get better by asking again; only transient failures are retried (and the HTTP
      // adapter already does its own backoff), so React Query does not retry at all.
      retry: false,
    },
  },
});
const router = createAppRouter();

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado');

// The demo adapter carries the whole fictional seed, so it is fetched after the shell is on screen.
const { createDemoClient } = await import('./data/demo-client');
const demoClient = createDemoClient();
const apiUrl = import.meta.env.VITE_API_URL?.trim() || undefined;

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <ClientHost demoClient={demoClient} initialApiUrl={apiUrl}>
          <RouterProvider router={router} />
        </ClientHost>
      </QueryClientProvider>
    </AppProvider>
  </StrictMode>,
);
