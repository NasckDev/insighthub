import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook of the UI layer: every wrapper in `src/ui` has its stories next to it, and the chart
 * stories live beside the chart components. The a11y addon checks each story with axe.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
};

export default config;
