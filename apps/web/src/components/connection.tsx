import { useQueryClient } from '@tanstack/react-query';
import { Plug, Unplug } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { DataError, createHttpClient, type DataClient } from '../data';
import { tokenVault } from '../lib/token-vault';
import { ClientProvider } from './app-context';
import { Modal } from './modal';

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

/** http(s) only, so a pasted `javascript:` or `file:` URL can never become a request target. */
export function parseApiUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

interface ClientHostProps {
  demoClient: DataClient;
  /** Preconfigured API URL (`VITE_API_URL`); the token is still asked for in the dialog. */
  initialApiUrl?: string;
  children: ReactNode;
}

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
          <ConnectDialog
            initialUrl={apiUrl ?? DEFAULT_API_URL}
            connected={apiUrl !== undefined}
            onClose={() => setDialogOpen(false)}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        ) : null}
      </ClientProvider>
    </ConnectionContext.Provider>
  );
}

interface ConnectDialogProps {
  initialUrl: string;
  connected: boolean;
  onClose: () => void;
  onConnect: (url: string, token: string) => void;
  onDisconnect: () => void;
}

function ConnectDialog({ initialUrl, connected, onClose, onConnect, onDisconnect }: ConnectDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseApiUrl(url);
    if (!parsed) {
      setError('Informe um endereço http:// ou https:// válido, por exemplo http://localhost:3333.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Reads the survey list before switching, so a wrong address or a blocked origin fails here, in the dialog.
      await createHttpClient(parsed.origin).listSurveys();
      onConnect(parsed.origin, token);
    } catch (failure: unknown) {
      setError(
        failure instanceof DataError && failure.code === 'NETWORK'
          ? 'Não consegui falar com essa API. Confira o endereço, se ela está rodando e se este site está em CORS_ORIGINS.'
          : failure instanceof Error
            ? failure.message
            : 'Não foi possível conectar.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Conectar à API" onClose={onClose} size="sm">
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <p className="m-0 text-sm text-muted">
          Troque os dados fictícios do navegador por uma API InsightHub sua. O token só é necessário para gerar
          sínteses quando a API exige um, e fica <strong className="text-fg">apenas na memória desta aba</strong>:
          não é gravado, não vai para a URL e some quando você fecha a página.
        </p>
        <div>
          <label htmlFor="api-url" className="label">
            Endereço da API
          </label>
          <input
            id="api-url"
            className="field w-full"
            inputMode="url"
            autoComplete="off"
            value={url}
            aria-invalid={error !== null}
            aria-describedby={error ? 'api-error' : undefined}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="api-token" className="label">
            Token (opcional)
          </label>
          <input
            id="api-token"
            className="field w-full"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        {error ? (
          <p id="api-error" role="alert" className="m-0 text-sm" style={{ color: 'var(--detractor)' }}>
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          {connected ? (
            <button type="button" className="btn" onClick={onDisconnect}>
              <Unplug aria-hidden="true" size={16} />
              Voltar para a demo
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Plug aria-hidden="true" size={16} />
            {busy ? 'Conectando…' : 'Conectar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
