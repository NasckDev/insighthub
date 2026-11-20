import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DataError, createHttpClient, type DataClient } from '../data';
import { tokenVault } from '../lib/token-vault';
import { ClientProvider } from './app-context';
import { AppAlert, AppButton, AppForm, AppFormItem, AppInput, AppModal, AppParagraph, AppPasswordInput, ApiOutlined, DisconnectOutlined } from '../ui';

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
        <ConnectDialog
          open={dialogOpen}
          initialUrl={apiUrl ?? DEFAULT_API_URL}
          connected={apiUrl !== undefined}
          onClose={() => setDialogOpen(false)}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </ClientProvider>
    </ConnectionContext.Provider>
  );
}

interface ConnectDialogProps {
  open: boolean;
  initialUrl: string;
  connected: boolean;
  onClose: () => void;
  onConnect: (url: string, token: string) => void;
  onDisconnect: () => void;
}

interface ConnectValues {
  url: string;
  token?: string;
}

const ERROR_ID = 'connect-error';

function ConnectDialog({ open, initialUrl, connected, onClose, onConnect, onDisconnect }: ConnectDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit({ url, token }: ConnectValues) {
    const parsed = parseApiUrl(url ?? '');
    if (!parsed) {
      setError('Informe um endereço http:// ou https:// válido, por exemplo http://localhost:3333.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Reads the survey list before switching, so a wrong address or a blocked origin fails here, in the dialog.
      await createHttpClient(parsed.origin).listSurveys();
      onConnect(parsed.origin, token ?? '');
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
    <AppModal open={open} title="Conectar à API" onClose={onClose} size="sm">
      <AppForm<ConnectValues> name="connect" initialValues={{ url: initialUrl, token: '' }} onSubmit={submit}>
        <AppParagraph tone="muted" small>
          Troque os dados fictícios do navegador por uma API InsightHub sua. O token só é necessário para gerar sínteses
          quando a API exige um, e fica <strong>apenas na memória desta aba</strong>: não é gravado, não vai para a URL e
          some quando você fecha a página.
        </AppParagraph>
        <div style={{ height: 'var(--ih-space-4)' }} />
        <AppFormItem label="Endereço da API" name="url">
          <AppInput inputMode="url" autoComplete="off" error={error !== null} aria-describedby={error ? ERROR_ID : undefined} />
        </AppFormItem>
        <AppFormItem label="Token (opcional)" name="token">
          <AppPasswordInput autoComplete="off" />
        </AppFormItem>
        {error ? (
          <div id={ERROR_ID} style={{ marginBottom: 'var(--ih-space-4)' }}>
            <AppAlert kind="error" live="alert" title={error} />
          </div>
        ) : null}
        <div className="ih-row ih-end ih-gap-2">
          {connected ? (
            <AppButton icon={<DisconnectOutlined />} onClick={onDisconnect}>
              Voltar para a demo
            </AppButton>
          ) : null}
          <AppButton variant="primary" htmlType="submit" icon={<ApiOutlined />} loading={busy}>
            {busy ? 'Conectando…' : 'Conectar'}
          </AppButton>
        </div>
      </AppForm>
    </AppModal>
  );
}
