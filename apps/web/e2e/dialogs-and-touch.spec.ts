import { expect, test } from '@playwright/test';
import { expectInViewport, expectNoViolations, SURVEY, setTheme, watchProblems } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('insighthub-tour', 'done');
  });
});

for (const size of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'celular', width: 390, height: 844 },
]) {
  test(`geometria: os diálogos abrem dentro da tela (${size.name})`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto(`./${SURVEY}/visao-geral`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor();

    // Filtros: the dialog that used to open off screen (trapped by the blurred bar's containing block).
    await page.getByRole('button', { name: /^Filtros/ }).click();
    const filters = page.getByRole('dialog', { name: 'Filtros' });
    await filters.waitFor();
    await expectInViewport(page, '[role="dialog"]', `Filtros (${size.name})`, 300);
    await expect(filters.getByRole('button', { name: 'Ver resultados' })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.keyboard.press('Control+k');
    await page.getByRole('dialog', { name: 'Paleta de comandos' }).waitFor();
    await expectInViewport(page, '[role="dialog"]', `Paleta (${size.name})`, 120);
    await page.keyboard.press('Escape');

    await page.keyboard.press('?');
    await page.getByRole('dialog', { name: 'Atalhos de teclado' }).waitFor();
    await expectInViewport(page, '[role="dialog"]', `Atalhos (${size.name})`);
    await page.keyboard.press('Escape');

    if (size.width < 1024) {
      await page.getByRole('button', { name: 'Mais' }).click();
      await page.getByRole('dialog', { name: 'Mais opções' }).waitFor();
      await expectInViewport(page, '[role="dialog"]', `Mais (${size.name})`);
      await page.getByRole('button', { name: 'Conectar à API' }).click();
    } else {
      await page.getByRole('button', { name: 'Conectar à API' }).first().click();
    }
    await page.getByRole('dialog', { name: 'Conectar à API' }).waitFor();
    await expectInViewport(page, '[role="dialog"]', `Conectar (${size.name})`);
    await page.keyboard.press('Escape');

    await page.goto(`./${SURVEY}/respostas`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Abrir resposta/ }).first().click();
    await page.getByRole('dialog', { name: /^Resposta / }).waitFor();
    await expectInViewport(page, '[role="dialog"]', `Resposta (${size.name})`, 300);
  });
}

test('busca: "desempenho" encontra respostas pelo tema', async ({ page }) => {
  await page.goto(`./${SURVEY}/respostas`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('searchbox', { name: 'Buscar nos comentários' }).fill('desempenho');
  await expect(page).toHaveURL(/q=desempenho/);
  await expect(page.getByText(/\d+ respostas · página 1/)).toBeVisible();
  await expect(page.getByText('Nenhuma resposta encontrada')).toHaveCount(0);
  const rows = await page.getByRole('table', { name: 'Respostas da pesquisa' }).getByRole('row').count();
  expect(rows).toBeGreaterThan(5);
});

test('tour: não abre sozinho e vira um chip discreto no Painel', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('insighthub-tour');
  });
  await page.goto(`./${SURVEY}/visao-geral`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'Painel' }).waitFor();
  await page.waitForTimeout(4000);
  await expect(page.getByRole('complementary', { name: 'Tour rápido' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Fazer o tour (3 passos)' })).toBeVisible();
});

test('o primeiro Tab vai para "Pular para o conteúdo"', async ({ page }) => {
  await page.goto(`./${SURVEY}/visao-geral`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();
});

const MOBILE_ROUTES = [
  { path: 'visao-geral', theme: 'dark' as const, ready: 'Net Promoter Score' },
  { path: 'respostas', theme: 'light' as const, ready: 'respostas · página' },
  { path: 'temas', theme: 'dark' as const, ready: 'Mapa de temas' },
  { path: 'comparar', theme: 'light' as const, ready: 'Comparar por' },
  { path: 'sintese', theme: 'dark' as const, ready: 'Pergunta' },
  { path: 'quadro', theme: 'light' as const, ready: 'Quadro de insights' },
];

test.describe('celular com toque', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const route of MOBILE_ROUTES) {
    test(`axe e alvos de 44 px: ${route.path} (${route.theme})`, async ({ page }) => {
      const problems = watchProblems(page);
      await page.goto(`./${SURVEY}/${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByText(route.ready, { exact: false }).first().waitFor();
      await page.waitForLoadState('networkidle');
      await setTheme(page, route.theme);
      await expectNoViolations(page, `${route.path} (celular, ${route.theme})`);

      const small = await page.evaluate(() => {
        const MIN = 44;
        const selector =
          'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=radio], [role=checkbox]';
        const found: string[] = [];
        for (const node of document.querySelectorAll<HTMLElement>(selector)) {
          const style = getComputedStyle(node);
          if (style.visibility === 'hidden' || style.display === 'none') continue;
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          // Inline citation chips keep their line height and get an extended hit area (see ui.css).
          if (node.classList.contains('ih-cite')) continue;
          // The skip link only appears on focus.
          if (node.classList.contains('ih-skip-link')) continue;
          // The text input inside a field is covered by the field box, which is the real target.
          if (node instanceof HTMLInputElement) {
            const field = node.closest('.ant-input-affix-wrapper, .ant-input-outlined, .ant-select, .ant-picker, .ih-palette-search')?.getBoundingClientRect();
            if (field && field.height >= MIN - 0.5) continue;
          }
          // A native checkbox is covered by its 44 px label row.
          if (node instanceof HTMLInputElement && node.type === 'checkbox') {
            const label = node.closest('label')?.getBoundingClientRect();
            if (label && label.height >= MIN) continue;
          }
          if (rect.width < MIN - 0.5 || rect.height < MIN - 0.5) {
            const name = (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 30);
            found.push(`${node.tagName.toLowerCase()} ${Math.round(rect.width)}x${Math.round(rect.height)} "${name}"`);
          }
        }
        return found;
      });
      expect(small, 'alvos abaixo de 44x44 px').toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});
