import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoClient } from '../data/demo-client';
import { ClientHost, parseApiUrl, useConnection } from './connection';
import { AppProvider } from '../ui';
import { useClient } from './app-context';

const TOKEN = 'token-secreto-de-teste-0123456789';

function Probe() {
  const client = useClient();
  const connection = useConnection();
  const [seen, setSeen] = useState('');
  return (
    <div>
      <p data-testid="kind">{client.kind}</p>
      <p data-testid="has-token">{String(connection.hasToken)}</p>
      <button type="button" onClick={connection.openDialog}>
        abrir conexão
      </button>
      <button
        type="button"
        onClick={() => {
          void (async () => {
            const iterator = client.streamSynthesis('s-atlas-q3', {}, new AbortController().signal);
            await iterator.next().catch(() => undefined);
            setSeen('chamou');
          })();
        }}
      >
        pedir síntese
      </button>
      <p data-testid="seen">{seen}</p>
    </div>
  );
}

function renderHost() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <ClientHost demoClient={createDemoClient({ latencyMs: 0, chunkDelayMs: 0 })}>
          <Probe />
        </ClientHost>
      </QueryClientProvider>
    </AppProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

function envelope(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data, error: null, meta: null }), { status: 200 });
}

describe('parseApiUrl', () => {
  it('accepts only http and https', () => {
    expect(parseApiUrl('http://localhost:3333')?.origin).toBe('http://localhost:3333');
    expect(parseApiUrl(' https://api.exemplo.com/x ')?.origin).toBe('https://api.exemplo.com');
    expect(parseApiUrl('javascript:alert(1)')).toBeNull();
    expect(parseApiUrl('file:///etc/passwd')).toBeNull();
    expect(parseApiUrl('localhost:3333')).toBeNull();
    expect(parseApiUrl('')).toBeNull();
  });
});

describe('Conectar à API', () => {
  it('switches to the HTTP adapter, keeps the token only in memory and sends it only to the synthesis call', async () => {
    const calls: { url: string; auth: string | null }[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), auth: new Headers(init?.headers).get('authorization') });
      if (String(input).endsWith('/synthesis')) return new Response('data: {"type":"done"}\n\n', { status: 200 });
      return envelope([]);
    });
    const user = userEvent.setup();
    renderHost();
    expect(screen.getByTestId('kind')).toHaveTextContent('demo');
    await user.click(screen.getByRole('button', { name: 'abrir conexão' }));
    const dialog = await screen.findByRole('dialog', { name: 'Conectar à API' });
    await user.clear(within(dialog).getByLabelText('Endereço da API'));
    await user.type(within(dialog).getByLabelText('Endereço da API'), 'http://localhost:3333');
    await user.type(within(dialog).getByLabelText('Token (opcional)'), TOKEN);
    expect(within(dialog).getByLabelText('Token (opcional)')).toHaveAttribute('type', 'password');
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByTestId('kind')).toHaveTextContent('http'));
    expect(screen.getByTestId('has-token')).toHaveTextContent('true');

    // the verification probe carries no token
    expect(calls[0]).toEqual({ url: 'http://localhost:3333/api/surveys', auth: null });

    await user.click(screen.getByRole('button', { name: 'pedir síntese' }));
    await waitFor(() => expect(screen.getByTestId('seen')).toHaveTextContent('chamou'));
    expect(calls.at(-1)).toEqual({ url: 'http://localhost:3333/api/surveys/s-atlas-q3/synthesis', auth: `Bearer ${TOKEN}` });

    // never persisted anywhere
    const everything = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie;
    expect(everything).not.toContain(TOKEN);
  });

  it('refuses a URL that is not http(s) without making any request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('button', { name: 'abrir conexão' }));
    const dialog = await screen.findByRole('dialog', { name: 'Conectar à API' });
    await user.clear(within(dialog).getByLabelText('Endereço da API'));
    await user.type(within(dialog).getByLabelText('Endereço da API'), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('http:// ou https://');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('kind')).toHaveTextContent('demo');
  });

  it('explains an unreachable API in the dialog and stays on the demo', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('button', { name: 'abrir conexão' }));
    const dialog = await screen.findByRole('dialog', { name: 'Conectar à API' });
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }));
    expect(await within(dialog).findByRole('alert', {}, { timeout: 10_000 })).toHaveTextContent('CORS_ORIGINS');
    expect(screen.getByTestId('kind')).toHaveTextContent('demo');
  });

  it('goes back to the demo and forgets the token', async () => {
    vi.stubGlobal('fetch', async () => envelope([]));
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('button', { name: 'abrir conexão' }));
    let dialog = await screen.findByRole('dialog', { name: 'Conectar à API' });
    await user.type(within(dialog).getByLabelText('Token (opcional)'), TOKEN);
    await user.click(within(dialog).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByTestId('kind')).toHaveTextContent('http'));
    await user.click(screen.getByRole('button', { name: 'abrir conexão' }));
    dialog = await screen.findByRole('dialog', { name: 'Conectar à API' });
    await user.click(within(dialog).getByRole('button', { name: 'Voltar para a demo' }));
    await waitFor(() => expect(screen.getByTestId('kind')).toHaveTextContent('demo'));
    expect(screen.getByTestId('has-token')).toHaveTextContent('false');
  });
});
