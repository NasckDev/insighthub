import { expect, test, type Page } from '@playwright/test';
import { SURVEY, setTheme } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('insighthub-tour', 'done');
  });
});

const ROUTES = [
  { path: 'visao-geral', ready: 'Net Promoter Score' },
  { path: 'respostas', ready: 'respostas · página' },
  { path: 'temas', ready: 'Mapa de temas' },
  { path: 'comparar', ready: 'Comparar por' },
  { path: 'sintese', ready: 'Pergunta' },
  { path: 'quadro', ready: 'Quadro de insights' },
];

const WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440, 1920];

/** The page itself never scrolls sideways: wide content (tables, charts) scrolls inside its own box. */
async function expectNoHorizontalScroll(page: Page, label: string) {
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `${label}: largura rolável ${scrollWidth} > visível ${clientWidth}`).toBeLessThanOrEqual(clientWidth);
}

for (const width of WIDTHS) {
  test(`layout: nenhuma tela rola na horizontal em ${width} px, nos dois temas`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: width < 768 ? 760 : 900 });
    for (const route of ROUTES) {
      await page.goto(`./${SURVEY}/${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByText(route.ready, { exact: false }).first().waitFor();
      await page.waitForLoadState('networkidle');
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme);
        await expectNoHorizontalScroll(page, `${route.path} em ${width} px (${theme})`);
      }
    }
  });
}
