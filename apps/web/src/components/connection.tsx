import { useQueryClient } from '@tanstack/react-query';
import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createHttpClient, type DataClient } from '../data';
import { parseApiUrl } from '../lib/api-url';
import { tokenVault } from '../lib/token-vault';
import { ClientProvider } from './app-context';

interface ConnectionApi {
  mode: 'demo' | 'http';
  apiUrl: string | undefined;
  hasToken: boolean;
  /** Opens the "Conectar à API" dialog. */
  openDialog: () => void;
}

const FALLBACK: ConnectionApi = { mode: 'demo', apiUrl: undefined, hasToken: false, openDialog: () => undefined };

const ConnectionContext = createContext<ConnectionApi>(FALLBACK);

export function useConnection(): ConnectionApi {
  return useContext(ConnectionContext);
}

interface ClientHostProps {
  demoClient: DataClient;
  /** Preconfigured API URL (`VITE_API_URL`); the token is still asked for in the dialog. */
  initialApiUrl?: string;
  children: ReactNode;
}

export { parseApiUrl };

// The dialog (form, inputs, modal) loads only when someone opens it.
const ConnectDialog = lazy(() => import('./connect-dialog'));

const DEFAULT_API_URL = 'http://localhost:3333';

/**
 * Owns the active data client. The app starts on the in-browser demo; "Conectar à API" swaps in the
 * HTTP adapter. The token lives in a ref (memory only): it is never written to storage, never put in
 * the URL and never part of the bundle, and it is gone when the tab closes.
 */
export function ClientHost({ demoClient, initialApiUrl, children }: ClientHostProps) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(false);
  const [apiUrl, setApiUrl] = useState<string | undefined>(initialApiUrl);
  const [dialogOpen, setDialogOpen] = useState(false);

  const client = useMemo(
    () => (apiUrl ? createHttpClient(apiUrl, { getToken: tokenVault.get }) : demoClient),
    [apiUrl, demoClient],
  );

  const connect = useCallback(
    (url: string, nextToken: string) => {
      tokenVault.set(nextToken);
      setHasToken(tokenVault.has());
      setApiUrl(url);
      queryClient.clear();
      setDialogOpen(false);
    },
    [queryClient],
  );

  const disconnect = useCallback(() => {
    tokenVault.clear();
    setHasToken(false);
    setApiUrl(undefined);
    queryClient.clear();
    setDialogOpen(false);
  }, [queryClient]);

  const api = useMemo<ConnectionApi>(
    () => ({
      mode: apiUrl ? 'http' : 'demo',
      apiUrl,
      hasToken,
      openDialog: () => setDialogOpen(true),
    }),
    [apiUrl, hasToken],
  );

  return (
    <ConnectionContext.Provider value={api}>
      <ClientProvider client={client}>
        {children}
        {dialogOpen ? (
          <Suspense fallback={null}>
            <ConnectDialog
              open
              initialUrl={apiUrl ?? DEFAULT_API_URL}
              connected={apiUrl !== undefined}
              onClose={() => setDialogOpen(false)}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </Suspense>
        ) : null}
      </ClientProvider>
    </ConnectionContext.Provider>
  );
}

