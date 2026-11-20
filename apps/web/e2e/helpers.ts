import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const SURVEY = '#/s/s-atlas-q3';
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Console errors, uncaught exceptions and 4xx/5xx responses seen by the page. */
export function watchProblems(page: Page): string[] {
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

export async function expectNoViolations(page: Page, label: string, scope?: string) {
  // Colors are only meaningful once every entry animation has finished.
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  // A modal dims the page behind it on purpose, so axe is pointed at the modal itself.
  const results = await (scope ? builder.include(scope) : builder).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  );
  expect(summary, `axe em ${label}`).toEqual([]);
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  // The provider follows <html data-theme> through a MutationObserver; wait for Ant Design to repaint.
  await page.waitForTimeout(400);
}

/** The box of a dialog must sit inside the viewport and have a usable size: axe cannot see this. */
export async function expectInViewport(page: Page, selector: string, label: string, minHeight = 160) {
  const viewport = page.viewportSize();
  expect(viewport, 'viewport').not.toBeNull();
  // Wait for the entry animation to settle: the box must be identical on two reads 120 ms apart.
  let box = await page.locator(selector).first().boundingBox();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(120);
    const again = await page.locator(selector).first().boundingBox();
    const settled = box && again && box.x === again.x && box.y === again.y && box.width === again.width && box.height === again.height;
    box = again;
    if (settled) break;
  }
  expect(box, `${label}: caixa do diálogo`).not.toBeNull();
  const { x, y, width, height } = box as NonNullable<typeof box>;
  const size = viewport as NonNullable<typeof viewport>;
  expect(x, `${label}: borda esquerda`).toBeGreaterThanOrEqual(-1);
  expect(y, `${label}: topo`).toBeGreaterThanOrEqual(-1);
  expect(x + width, `${label}: borda direita`).toBeLessThanOrEqual(size.width + 1);
  expect(y + height, `${label}: base`).toBeLessThanOrEqual(size.height + 1);
  expect(height, `${label}: altura útil`).toBeGreaterThanOrEqual(minHeight);
  expect(width, `${label}: largura útil`).toBeGreaterThanOrEqual(280);
}
