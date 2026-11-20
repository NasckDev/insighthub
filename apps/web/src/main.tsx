import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClientProvider } from './components/app-context';
import { MotionRoot } from './components/motion';
import { ToastProvider } from './components/toast';
import { createDefaultClient } from './data';
import { createAppRouter } from './router';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 } },
});
const client = createDefaultClient();
const router = createAppRouter();

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado');

createRoot(container).render(
  <StrictMode>
    <ClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <MotionRoot>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </MotionRoot>
      </QueryClientProvider>
    </ClientProvider>
  </StrictMode>,
);
