import { defineConfig } from '@playwright/test';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/projetos/insighthub/`;

/**
 * E2E runs against the portable build served under a subpath (the same way the portfolio serves it).
 * Locally it uses the installed Chrome; in CI it uses the Chromium installed by `playwright install`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE,
    channel: process.env.CI ? undefined : 'chrome',
    reducedMotion: 'reduce',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
