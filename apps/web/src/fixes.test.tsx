import { generateSeed, type Insight } from '@insighthub/core';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { basisText, providerLabel } from './routes/synthesis-page';
import { getBoardStore } from './lib/board-store';
import { tour } from './lib/tour-store';
import { renderApp } from './test/render-app';

const SURVEY = '/s/s-atlas-q3';
const TABLE_NAME = 'Respostas da pesquisa';

type AppRouter = ReturnType<typeof renderApp>['router'];
function searchOf(router: AppRouter) {
  return router.state.matches[router.state.matches.length - 1]?.search ?? {};
}

function insight(id: string, bodyLength = 10): Insight {
  return {
    id,
    title: `Insight ${id}`,
    note: '',
    body: 'x'.repeat(bodyLength),
    citations: [],
    surveyId: 's-atlas-q3',
    surveyTitle: 'Pesquisa',
    question: 'Resumo',
    scope: 'Todas as respostas',
    createdAt: '2026-10-01T12:00:00.000Z',
  };
}

// Warm the lazily loaded chunks once, so a slow first transform never eats a test's time budget.
beforeAll(async () => {
  await Promise.all([import('./components/command-palette'), import('./components/shortcuts-modal')]);
}, 120_000);

beforeEach(() => {
  const store = getBoardStore();
  for (const item of store.get()) store.remove(item.id);
  tour.reset();
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
});

describe('dialogs render in a portal', () => {
  it('puts the filters panel in a portal under <body>, outside the blurred filter bar', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/visao-geral`);
    await user.click(await screen.findByRole('button', { name: /^Filtros/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Filtros' });
    expect(dialog.closest('.ih-filterbar')).toBeNull();
    expect(document.body.contains(dialog)).toBe(true);
    expect(document.querySelector('#root, [data-testid]')?.contains(dialog) ?? false).toBe(false);
  });

  it('closes the filters panel on Escape', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/visao-geral`);
    await user.click(await screen.findByRole('button', { name: /^Filtros/ }));
    await screen.findByRole('dialog', { name: 'Filtros' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtros' })).not.toBeInTheDocument());
  });

  it('closes only the topmost layer on Escape', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/respostas`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.click(screen.getAllByRole('button', { name: /^Abrir resposta/ })[0] as HTMLElement);
    await screen.findByRole('dialog', { name: /^Resposta / });
    await user.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog', { name: 'Paleta de comandos' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Paleta de comandos' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: /^Resposta / })).toBeInTheDocument();
  });
});

describe('search', () => {
  it('finds the theme named in the search even when the word is not in the comments', async () => {
    renderApp(`${SURVEY}/respostas?q=desempenho`);
    const table = await screen.findByRole('table', { name: TABLE_NAME });
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(5);
  });

  it('is accent-insensitive', async () => {
    renderApp(`${SURVEY}/respostas?q=preco`);
    const table = await screen.findByRole('table', { name: TABLE_NAME });
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(5);
  });

  it('keeps the box in sync with the URL when a chip is removed', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/respostas?q=suporte`);
    const box = await screen.findByRole('searchbox', { name: 'Buscar nos comentários' });
    expect(box).toHaveValue('suporte');
    await user.click(screen.getByRole('button', { name: /^Remover filtro Busca/ }));
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('has its own clear button', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(`${SURVEY}/respostas?q=suporte`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.click(screen.getByRole('button', { name: 'Limpar a busca' }));
    await waitFor(() => expect((searchOf(router) as { q?: string }).q).toBeUndefined());
    expect(screen.getByRole('searchbox', { name: 'Buscar nos comentários' })).toHaveFocus();
  });

  it('suggests themes when nothing matches', async () => {
    renderApp(`${SURVEY}/respostas?q=zzzzqq`);
    expect(await screen.findByText('Nenhuma resposta encontrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver tema Desempenho' })).toBeInTheDocument();
  });
});

describe('period in the URL', () => {
  it('survives an impossible date instead of crashing', async () => {
    const { router } = renderApp(`${SURVEY}/respostas?from=2026-99-99`);
    await screen.findByRole('table', { name: TABLE_NAME });
    expect((searchOf(router) as { from?: string }).from).toBeUndefined();
  });

  it('warns about an inverted period and ignores it', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/respostas?from=2026-09-01&to=2026-08-01`);
    await screen.findByRole('table', { name: TABLE_NAME });
    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Filtros' });
    expect(within(dialog).getByRole('alert')).toHaveTextContent('data inicial é depois da final');
  });
});

describe('the tour', () => {
  it('never opens by itself; it is a chip on the dashboard', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/visao-geral`);
    await screen.findByText('Net Promoter Score');
    expect(screen.queryByRole('complementary', { name: 'Tour rápido' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fazer o tour (3 passos)' }));
    expect(await screen.findByRole('complementary', { name: 'Tour rápido' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pular o tour' }));
    expect(screen.queryByRole('complementary', { name: 'Tour rápido' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fazer o tour (3 passos)' })).not.toBeInTheDocument();
    expect(localStorage.getItem('insighthub-tour')).toBe('done');
  });
});

describe('themes and small samples', () => {
  it('flags themes with few mentions', async () => {
    renderApp(`${SURVEY}/temas?plan=enterprise&region=sul`);
    await screen.findByRole('group', { name: 'Escolher um tema' });
    // The map is drawn by ECharts, so the small-sample flag is checked where it is written: the chart option.
    const { treemapOption } = await import('./components/charts/treemap-chart');
    const { generateSeed, analyzeThemes } = await import('@insighthub/core');
    const { responses } = generateSeed();
    const small = analyzeThemes(responses.filter((response) => response.plan === 'enterprise' && response.region === 'sul'));
    expect(small.some((stat) => stat.lowSample)).toBe(true);
    const option = treemapOption(small, undefined, (await import('./ui')).PALETTES.light) as { series: { data: { label: { formatter: string } }[] }[] };
    expect(option.series[0]?.data.some((item) => item.label.formatter.includes('amostra pequena'))).toBe(true);
  });
});

describe('compare', () => {
  it('states the small-sample threshold on screen and keeps a heading for the cards', async () => {
    renderApp(`${SURVEY}/comparar`);
    expect(await screen.findByText(/menos de 10 respostas recebem aviso de amostra pequena/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Segmentos lado a lado' })).toBeInTheDocument();
  });

  it('shows the small-sample warning with the demo seed alone (by region)', async () => {
    renderApp(`${SURVEY}/comparar?dimension=region`);
    expect(await screen.findByText(/Cuidado com amostras pequenas/)).toBeInTheDocument();
  });
});

describe('synthesis wording', () => {
  it('describes the provider in plain words and the real basis of the text', async () => {
    expect(providerLabel('local-extractive')).toBe('gerada no seu navegador');
    expect(providerLabel('claude:claude-sonnet-5-5')).toBe('gerada pelo modelo claude-sonnet-5-5');
    expect(basisText({ sourceCount: 80, totalCount: 640, provider: 'claude:x' })).toContain('Baseada em 80 de 640 respostas');
    expect(basisText({ sourceCount: 640, totalCount: 640, provider: 'local-extractive' })).toContain('Baseada em 640 respostas');
    expect(basisText({ sourceCount: 5000, totalCount: 5000, truncated: true, provider: 'x' })).toContain('cortou a seleção');
    expect(basisText({})).toBe('');
  });

  it('does not show internal names or a tautological NPS for a detractors-only slice', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/sintese?tpl=detractors`);
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    await screen.findByText(/Síntese concluída/);
    expect(screen.queryByText(/local-extractive/)).not.toBeInTheDocument();
    expect(screen.getByText(/gerada no seu navegador/)).toBeInTheDocument();
    const article = screen.getByRole('article', { name: 'Texto da síntese' });
    expect(article.textContent).not.toMatch(/NPS [−-]100/);
    expect(article.textContent).toMatch(/Todas são de detratores \(\d+% das 640 respostas da pesquisa\)/);
  });

  it('keeps a single retry button after a failure', async () => {
    const user = userEvent.setup();
    const { client } = renderApp(`${SURVEY}/sintese`);
    client.faults.setMode('partial');
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    await screen.findByText(/A conexão com o provedor foi interrompida/);
    expect(screen.getAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Gerar de novo' })).not.toBeInTheDocument();
  });
});

describe('insights board polish', () => {
  async function generateAndSave(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Gerar síntese' }));
    await screen.findByText(/Síntese concluída/);
    await user.click(screen.getByRole('button', { name: 'Salvar no quadro' }));
    const dialog = await screen.findByRole('dialog', { name: 'Salvar no quadro' });
    await user.click(within(dialog).getByRole('button', { name: 'Salvar insight' }));
  }

  it('moves focus to the title when editing and back to the Edit button afterwards', async () => {
    const user = userEvent.setup();
    getBoardStore().add(insight('a'));
    renderApp(`${SURVEY}/quadro`);
    const card = await screen.findByRole('article', { name: 'Insight a' });
    const edit = within(card).getByRole('button', { name: /^Editar/ });
    await user.click(edit);
    expect(within(card).getByLabelText('Título')).toHaveFocus();
    await user.keyboard('t');
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(within(card).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(within(card).getByRole('button', { name: /^Editar/ })).toHaveFocus());
  });

  it('shows the whole shared preview and hides the empty state', async () => {
    const { encodeShare } = await import('@insighthub/core');
    renderApp(`${SURVEY}/quadro?share=${encodeShare([insight('s1'), insight('s2')])}`);
    expect(await screen.findByText(/Quadro compartilhado com você: 2 insights/)).toBeInTheDocument();
    const preview = screen.getByRole('group', { name: 'Prévia do quadro compartilhado' });
    expect(within(preview).getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'Quadro vazio' })).not.toBeInTheDocument();
  });

  it('uses the right plural when importing one insight', async () => {
    const { encodeShare } = await import('@insighthub/core');
    const user = userEvent.setup();
    renderApp(`${SURVEY}/quadro?share=${encodeShare([insight('only')])}`);
    await user.click(await screen.findByRole('button', { name: 'Importar para o meu quadro' }));
    expect(await screen.findByText('1 insight importado para o seu quadro.')).toBeInTheDocument();
  });

  it('warns instead of failing silently when the link would be too large', async () => {
    const user = userEvent.setup();
    const store = getBoardStore();
    const { responses } = generateSeed();
    for (let index = 0; index < 40; index += 1) {
      store.add({
        ...insight(`big-${index}`, 2000),
        body: responses[index]!.comment.repeat(20).slice(0, 2000) + String(index).repeat(100),
        note: 'n'.repeat(900),
      });
    }
    renderApp(`${SURVEY}/quadro`);
    await screen.findByRole('article', { name: 'Insight big-0' });
    await user.click(screen.getByRole('button', { name: 'Copiar link compartilhável' }));
    expect(await screen.findByText(/grande demais para caber num link/)).toBeInTheDocument();
    const toasts = document.querySelector('.ant-notification') as HTMLElement;
    expect(within(toasts).getByRole('button', { name: 'Exportar Markdown' })).toBeInTheDocument();
  });

  it('saves a synthesis and shows it on the board with a valid id', async () => {
    const user = userEvent.setup();
    renderApp(`${SURVEY}/sintese`);
    await generateAndSave(user);
    expect(getBoardStore().get()).toHaveLength(1);
    expect(getBoardStore().get()[0]?.id).toMatch(/^ins-/);
  });
});

describe('toasts', () => {
  it('disappear on their own and pause while the pointer is on them', async () => {
    const user = userEvent.setup();
    getBoardStore().add(insight('t1'));
    renderApp(`${SURVEY}/quadro`);
    const card = await screen.findByRole('article', { name: 'Insight t1' });
    await user.click(within(card).getByRole('button', { name: /^Excluir/ }));
    const toast = await screen.findByText(/Insight “Insight t1” excluído/);
    await user.hover(toast);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(screen.getByText(/Insight “Insight t1” excluído/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeInTheDocument();
  });
});
