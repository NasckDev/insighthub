import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/render-app';

type AppRouter = ReturnType<typeof renderApp>['router'];

/** Validated search of the active route (the raw `location.search` is still unvalidated strings). */
function searchOf(router: AppRouter) {
  return router.state.matches[router.state.matches.length - 1]?.search ?? {};
}

const SURVEY = '/s/s-atlas-q3';
const TABLE_NAME = 'Respostas da pesquisa';

function bodyRows() {
  const table = screen.getByRole('table', { name: TABLE_NAME });
  return within(table).getAllByRole('row').slice(1);
}

describe('filters in the URL', () => {
  it('applies validated filters and pagination from the address', async () => {
    const { router } = renderApp(`${SURVEY}/respostas?plan=pro&nps=promoter&page=2&pageSize=10`);
    await screen.findByRole('table', { name: TABLE_NAME });
    const rows = bodyRows();
    expect(rows).toHaveLength(10);
    for (const row of rows) {
      expect(within(row).getByText('Pro')).toBeInTheDocument();
      expect(within(row).getByText(/Promotor/)).toBeInTheDocument();
    }
    expect(screen.getByText(/página 2 de/)).toBeInTheDocument();
    expect(searchOf(router)).toMatchObject({ plan: ['pro'], nps: 'promoter', page: 2 });
  });

  it('ignores invalid values in the address instead of breaking', async () => {
    const { router } = renderApp(`${SURVEY}/respostas?plan=gold&region=sul`);
    await screen.findByRole('table', { name: TABLE_NAME });
    expect(searchOf(router)).toEqual({ region: ['sul'] });
  });

  it('writes a toggled filter to the URL and goes back to page 1', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/respostas?plan=pro&page=2`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    const panel = await screen.findByRole('dialog', { name: 'Filtros' });
    await user.click(within(panel).getByRole('checkbox', { name: /^Enterprise/ }));
    await waitFor(() => expect(searchOf(router)).toEqual({ plan: ['pro', 'enterprise'] }));
    expect(screen.getByRole('button', { name: 'Remover filtro Plano: Enterprise' })).toBeInTheDocument();
  });

  it('puts the debounced comment search in the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/respostas`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.type(screen.getByRole('searchbox', { name: 'Buscar nos comentários' }), 'suporte');
    await waitFor(() => expect(searchOf(router)).toEqual({ q: 'suporte' }));
    await waitFor(() => {
      for (const row of bodyRows()) expect(row.textContent?.toLowerCase()).toContain('suporte');
    });
  });

  it('paginates with the next button', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/respostas`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await waitFor(() => expect(searchOf(router)).toEqual({ page: 2 }));
    expect(await screen.findByText(/página 2 de/)).toBeInTheDocument();
  });
});

describe('screen states', () => {
  it('shows a loading state before the data arrives', async () => {
    renderApp(`${SURVEY}/respostas`, { latencyMs: 30 });
    expect(await screen.findByRole('status')).toHaveTextContent(/Carregando/);
    await screen.findByRole('table', { name: TABLE_NAME });
  });

  it('shows the empty state with a way out', async () => {
    renderApp(`${SURVEY}/respostas?q=zzzzqq`);
    expect(await screen.findByText('Nenhuma resposta encontrada')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' }).length).toBeGreaterThan(0);
  });

  it('shows an error and recovers with "Tentar de novo"', async () => {
    const user = userEvent.setup();
    const { client } = renderApp(`${SURVEY}/comparar`);
    await screen.findByRole('list', { name: /NPS por plano/ });
    // Only the comparison query runs when the dimension changes, so the simulated failure hits it.
    client.faults.setMode('fail-next');
    await user.click(screen.getByRole('button', { name: 'Região' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha simulada');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('list', { name: /NPS por região/ })).toBeInTheDocument();
  });

  it('shows a partial result on the responses table', async () => {
    const { client } = renderApp(`${SURVEY}/respostas`);
    await screen.findByRole('table', { name: TABLE_NAME });
    client.faults.setMode('partial');
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText(/Foram carregadas 10 de 20 linhas/)).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
  });

  it('keeps the indicators when only the timeline fails (partial overview)', async () => {
    const { client } = renderApp(`${SURVEY}/visao-geral`);
    client.faults.setMode('partial');
    expect(await screen.findByText(/os indicadores ao lado carregaram/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Distribuição das 640 notas/ })).toBeInTheDocument();
  });

  it('offers the chart data as a table', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/visao-geral`);
    await screen.findByRole('img', { name: /Distribuição das 640 notas/ });
    const group = screen.getByRole('group', { name: 'Formato de Distribuição das notas' });
    await user.click(within(group).getByRole('button', { name: 'Tabela' }));
    expect(screen.getByRole('table', { name: 'Quantidade de respostas por nota' })).toBeInTheDocument();
  });

  it('warns about small samples when comparing segments', async () => {
    renderApp(`${SURVEY}/comparar?plan=free&role=design&dimension=region`);
    expect(await screen.findByText(/Cuidado com amostras pequenas/)).toBeInTheDocument();
    expect(screen.getAllByText('Amostra pequena').length).toBeGreaterThan(0);
  });
});

describe('synthesis', () => {
  it('streams the text and opens the source response from a citation', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/sintese`);
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    expect(await screen.findByText(/Síntese concluída/)).toBeInTheDocument();
    const article = screen.getByRole('article', { name: 'Texto da síntese' });
    const citation = within(article).getAllByRole('button', {
      name: /Abrir resposta-fonte/,
    })[0] as HTMLElement;
    await user.click(citation);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /^Resposta atla-/ })).toBeInTheDocument();
    expect((searchOf(router) as { r?: string }).r).toMatch(/^atla-/);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((searchOf(router) as { r?: string }).r).toBeUndefined();
  });

  it('cancels the stream and keeps the partial text', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/sintese`, { chunkDelayMs: 15 });
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    await screen.findByRole('article', { name: 'Texto da síntese' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText(/Geração cancelada./)).toBeInTheDocument();
    expect(screen.getByText(/o texto abaixo está incompleto/)).toBeInTheDocument();
    const before = screen.getByRole('article', { name: 'Texto da síntese' }).textContent;
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(screen.getByRole('article', { name: 'Texto da síntese' }).textContent).toBe(before);
    expect(screen.queryByText(/Fontes citadas/)).not.toBeInTheDocument();
  });

  it('shows an interrupted stream as a partial result with retry', async () => {
    const user = userEvent.setup();
    const { client } = renderApp(`${SURVEY}/sintese`);
    client.faults.setMode('partial');
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    expect(await screen.findByText(/A conexão com o provedor foi interrompida/)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Texto da síntese' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tentar de novo' }).length).toBeGreaterThan(0);
  });
});
