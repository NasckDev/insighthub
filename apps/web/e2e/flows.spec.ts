import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const SURVEY = '#/s/s-atlas-q3';
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  // The optional tour is dismissed so it never covers the screen under test.
  await page.addInitScript(() => {
    localStorage.setItem('insighthub-tour', 'done');
  });
});

function watchProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
  });
  return problems;
}

async function expectNoViolations(page: Page, label: string, scope?: string) {
  // Colors are only meaningful once every entry animation has finished.
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  // A modal dims the page behind it on purpose, so axe is pointed at the modal itself.
  const results = await (scope ? builder.include(scope) : builder).analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  );
  expect(summary, `axe em ${label}`).toEqual([]);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
}

const ROUTES = [
  { path: 'visao-geral', ready: 'Net Promoter Score' },
  { path: 'respostas', ready: 'respostas · página' },
  { path: 'temas', ready: 'Mapa de temas' },
  { path: 'comparar', ready: 'Comparar por' },
  { path: 'sintese', ready: 'Pergunta' },
  { path: 'quadro', ready: 'Quadro de insights' },
];

for (const route of ROUTES) {
  for (const theme of ['light', 'dark'] as const) {
    test(`a11y: ${route.path} no tema ${theme} não tem violações do axe`, async ({ page }) => {
      const problems = watchProblems(page);
      await page.goto(`./${SURVEY}/${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByText(route.ready, { exact: false }).first().waitFor();
      await page.waitForLoadState('networkidle');
      await setTheme(page, theme);
      await expectNoViolations(page, `${route.path} (${theme})`);
      expect(problems).toEqual([]);
    });
  }
}

test('painel: abre com dados, mostra medidor, evolução e falas em destaque', async ({ page }) => {
  await page.goto(`./${SURVEY}/visao-geral`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Painel' })).toBeVisible();
  await expect(page.getByRole('img', { name: /^NPS .* escala de menos 100/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Evolução semanal do NPS de/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Falas em destaque' }).getByRole('figure')).toHaveCount(4);
});

test('filtrar: o plano vai para a URL e o total de respostas diminui', async ({ page }) => {
  await page.goto(`./${SURVEY}/respostas`, { waitUntil: 'domcontentloaded' });
  const count = page.getByText(/respostas · página 1 de/);
  await expect(count).toBeVisible();
  const before = await count.textContent();
  // On desktop the facets are already on screen next to the table.
  await page.getByRole('complementary', { name: 'Facetas' }).getByRole('checkbox', { name: /^Enterprise/ }).check();
  await expect(page).toHaveURL(/plan=enterprise/);
  await expect(page.getByRole('button', { name: 'Remover filtro Plano: Enterprise' })).toBeVisible();
  await expect(count).not.toHaveText(before ?? '');
});

test('abrir resposta: o painel de detalhe abre, é acessível e o Esc devolve o foco', async ({ page }) => {
  await page.goto(`./${SURVEY}/respostas`, { waitUntil: 'domcontentloaded' });
  const first = page.getByRole('button', { name: /^Abrir resposta/ }).first();
  await first.waitFor();
  await first.click();
  const dialog = page.getByRole('dialog', { name: /^Resposta / });
  await expect(dialog).toBeVisible();
  await expectNoViolations(page, 'detalhe da resposta', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
});

test('sintese: gerar, abrir a citação e salvar no quadro', async ({ page }) => {
  const problems = watchProblems(page);
  await page.goto(`./${SURVEY}/sintese`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Gerar síntese' }).click();
  await expect(page.getByText('Síntese concluída.')).toBeVisible({ timeout: 40_000 });
  const article = page.getByRole('article', { name: 'Texto da síntese' });
  await article.getByRole('button', { name: /^Abrir resposta-fonte/ }).first().click();
  await expect(page.getByRole('dialog', { name: /^Resposta / })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Salvar no quadro' }).click();
  const save = page.getByRole('dialog', { name: 'Salvar no quadro' });
  await save.getByLabel('Título do insight').fill('Suporte lento puxa a nota para baixo');
  await save.getByLabel(/Sua nota/).fill('Levar ao comitê de produto.');
  await save.getByRole('button', { name: 'Salvar insight' }).click();
  await expect(page.getByText('Salvo no quadro', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Ver quadro' }).click();
  const card = page.getByRole('article', { name: 'Suporte lento puxa a nota para baixo' });
  await expect(card).toBeVisible();
  await expect(card.getByText('Levar ao comitê de produto.')).toBeVisible();
  await expectNoViolations(page, 'quadro com insight');
  expect(problems).toEqual([]);
});

test('recarregar numa rota interna continua funcionando', async ({ page }) => {
  const problems = watchProblems(page);
  await page.goto(`./${SURVEY}/comparar?dimension=region`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Comparar segmentos' })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Comparar segmentos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Região' })).toHaveAttribute('aria-pressed', 'true');
  expect(problems).toEqual([]);
});

test('paleta de comandos abre com Ctrl+K e é acessível', async ({ page }) => {
  await page.goto(`./${SURVEY}/visao-geral`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Paleta de comandos' });
  await expect(palette).toBeVisible();
  await expectNoViolations(page, 'paleta de comandos', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();
});

test('celular: a barra inferior navega e a tabela vira cartões sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`./${SURVEY}/respostas`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('navigation', { name: 'Navegação móvel' }).waitFor();
  await page.getByRole('button', { name: /^Abrir resposta/ }).first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('link', { name: 'Temas' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mapa de temas' })).toBeVisible();
});
