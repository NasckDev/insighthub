import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBoardStore } from './lib/board-store';
import { renderApp } from './test/render-app';

const SURVEY = '/s/s-atlas-q3';

type AppRouter = ReturnType<typeof renderApp>['router'];
function searchOf(router: AppRouter) {
  return router.state.matches[router.state.matches.length - 1]?.search ?? {};
}

beforeEach(() => {
  const store = getBoardStore();
  for (const insight of store.get()) store.remove(insight.id);
  document.documentElement.dataset.theme = 'light';
  localStorage.clear();
});

async function generateAndSave(user: ReturnType<typeof userEvent.setup>, title: string, note?: string) {
  await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
  await screen.findByText(/Síntese concluída/);
  await user.click(screen.getByRole('button', { name: 'Salvar no quadro' }));
  const dialog = await screen.findByRole('dialog', { name: 'Salvar no quadro' });
  const field = within(dialog).getByLabelText('Título do insight');
  await user.clear(field);
  await user.type(field, title);
  if (note) await user.type(within(dialog).getByLabelText(/Sua nota/), note);
  await user.click(within(dialog).getByRole('button', { name: 'Salvar insight' }));
}

describe('overview', () => {
  it('shows the NPS meter, themes with sentiment and highlighted quotes', async () => {
    renderApp(`${SURVEY}/visao-geral`);
    expect(await screen.findByRole('img', { name: /^NPS .* escala de menos 100 a mais 100/ })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Temas principais' })).toBeInTheDocument();
    const quotes = await screen.findByRole('region', { name: 'Falas em destaque' });
    expect(within(quotes).getAllByRole('figure')).toHaveLength(4);
  });
});

describe('themes', () => {
  it('drills down from a tile to the quotes and lets you go to the table', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/temas`);
    const map = await screen.findByRole('group', { name: 'Mapa de temas' });
    const tile = within(map).getAllByRole('button')[0] as HTMLElement;
    await user.click(tile);
    await waitFor(() => expect((searchOf(router) as { t?: string }).t).toBeDefined());
    const detail = await screen.findByRole('region', { name: /^Detalhe do tema/ });
    expect(await within(detail).findAllByRole('button', { name: /^Abrir resposta/ })).not.toHaveLength(0);
    expect(within(detail).getByRole('link', { name: /na tabela/ })).toBeInTheDocument();
  });

  it('selects the theme from the address', async () => {
    renderApp(`${SURVEY}/temas?t=suporte`);
    expect(await screen.findByRole('region', { name: 'Detalhe do tema Suporte' })).toBeInTheDocument();
  });
});

describe('filters', () => {
  it('shows facet counts and writes the theme and period to the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/respostas`);
    await screen.findByRole('table', { name: 'Respostas da pesquisa' });
    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Filtros' });
    await user.click(await within(dialog).findByRole('checkbox', { name: /^Preço/ }));
    await waitFor(() => expect((searchOf(router) as { theme?: string }).theme).toBe('preço'));
    fireDate(within(dialog).getByLabelText('De'), '2026-08-10');
    await waitFor(() => expect((searchOf(router) as { from?: string }).from).toBe('2026-08-10'));
    expect(screen.getByRole('button', { name: 'Remover filtro Tema: Preço' })).toBeInTheDocument();
  });

  it('filters the responses by theme', async () => {
    renderApp(`${SURVEY}/respostas?theme=suporte`);
    const table = await screen.findByRole('table', { name: 'Respostas da pesquisa' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.textContent?.toLowerCase()).toMatch(/suporte|atendimento|chamado|resposta do time/);
  });
});

function fireDate(input: HTMLElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('synthesis question templates', () => {
  it('reads only detractors for the "Por que há detratores?" question', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/sintese`);
    await user.click(await screen.findByRole('radio', { name: /Por que há detratores/ }));
    await waitFor(() => expect((searchOf(router) as { tpl?: string }).tpl).toBe('detractors'));
    await user.click(screen.getByRole('button', { name: 'Gerar síntese' }));
    expect(await screen.findByText(/Síntese concluída/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Principais motivos de insatisfação' })).toBeInTheDocument();
  });
});

describe('insights board', () => {
  it('saves a synthesis, edits it, deletes it and undoes the deletion', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/sintese`);
    await generateAndSave(user, 'Suporte pesa na nota', 'Levar ao comitê');
    expect(await screen.findByText('Salvo no quadro')).toBeInTheDocument();
    expect(getBoardStore().get()).toHaveLength(1);

    await user.click(screen.getByRole('link', { name: 'Ver quadro' }));
    const card = await screen.findByRole('article', { name: 'Suporte pesa na nota' });
    expect(within(card).getByText('Levar ao comitê')).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: /^Editar/ }));
    const title = within(card).getByLabelText('Título');
    await user.clear(title);
    await user.type(title, 'Novo título');
    await user.click(within(card).getByRole('button', { name: 'Salvar alterações' }));
    const renamed = await screen.findByRole('article', { name: 'Novo título' });

    await user.click(within(renamed).getByRole('button', { name: /^Excluir/ }));
    expect(await screen.findByRole('region', { name: 'Quadro vazio' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByRole('article', { name: 'Novo título' })).toBeInTheDocument();
  });

  it('blocks an empty title', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/sintese`);
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    await screen.findByText(/Síntese concluída/);
    await user.click(screen.getByRole('button', { name: 'Salvar no quadro' }));
    const dialog = await screen.findByRole('dialog', { name: 'Salvar no quadro' });
    await user.clear(within(dialog).getByLabelText('Título do insight'));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Dê um título');
    expect(within(dialog).getByRole('button', { name: 'Salvar insight' })).toBeDisabled();
  });

  it('shows the empty board with a way to the synthesis', async () => {
    renderApp(`${SURVEY}/quadro`);
    const region = await screen.findByRole('region', { name: 'Quadro vazio' });
    expect(within(region).getByRole('link', { name: /Ir para a Síntese/ })).toBeInTheDocument();
  });

  it('offers to import a shared board and rejects a broken link', async () => {
    const { encodeShare } = await import('@insighthub/core');
    const insight = {
      id: 'ins-shared',
      title: 'Insight compartilhado',
      note: '',
      body: 'texto',
      citations: [],
      surveyId: 's-atlas-q3',
      surveyTitle: 'Pesquisa',
      question: 'Resumo',
      scope: 'Todas as respostas',
      createdAt: '2026-10-01T12:00:00.000Z',
    };
    const user = userEvent.setup();
    const first = renderApp(`${SURVEY}/quadro?share=${encodeShare([insight])}`);
    await user.click(await screen.findByRole('button', { name: 'Importar para o meu quadro' }));
    expect(await screen.findByRole('article', { name: 'Insight compartilhado' })).toBeInTheDocument();
    first.unmount();
    renderApp(`${SURVEY}/quadro?share=abc_def`);
    expect(await screen.findByText('Link de quadro inválido')).toBeInTheDocument();
  });
});

describe('command palette and shortcuts', () => {
  it('opens with Ctrl+K, searches real comments and opens the response', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/visao-geral`);
    await screen.findByText('Net Promoter Score');
    await user.keyboard('{Control>}k{/Control}');
    const palette = await screen.findByRole('dialog', { name: 'Paleta de comandos' });
    const box = within(palette).getByRole('combobox');
    expect(box).toHaveFocus();
    await user.type(box, 'chamado');
    const options = await within(palette).findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Paleta de comandos' })).not.toBeInTheDocument());
    await waitFor(() => expect((searchOf(router) as { r?: string }).r).toBeDefined());
  });

  it('navigates to a section from the palette and closes with Esc', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/visao-geral`);
    await screen.findByText('Net Promoter Score');
    await user.keyboard('{Control>}k{/Control}');
    const palette = await screen.findByRole('dialog', { name: 'Paleta de comandos' });
    await user.type(within(palette).getByRole('combobox'), 'comparar');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe(`${SURVEY}/comparar`));
    await user.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog', { name: 'Paleta de comandos' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the shortcuts with "?" and navigates with G then a letter', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/visao-geral`);
    await screen.findByText('Net Promoter Score');
    await user.keyboard('?');
    expect(await screen.findByRole('dialog', { name: 'Atalhos de teclado' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.keyboard('gt');
    await waitFor(() => expect(router.state.location.pathname).toBe(`${SURVEY}/temas`));
  });

  it('toggles and remembers the theme with the T shortcut', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/visao-geral`);
    await screen.findByText('Net Promoter Score');
    await user.keyboard('t');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('insighthub-theme')).toBe('dark');
  });
});
