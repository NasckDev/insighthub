import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { AppProvider, injectPaletteCss, type ThemeMode } from '../src/ui';

injectPaletteCss();

function ThemeFrame({ mode, children }: { mode: ThemeMode; children: React.ReactNode }) {
  // The palette is keyed on <html data-theme>, exactly like in the app.
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  return (
    <AppProvider mode={mode}>
      <div style={{ background: 'var(--ih-bg)', color: 'var(--ih-fg)', padding: 'var(--ih-space-4)', minHeight: '6rem' }}>{children}</div>
    </AppProvider>
  );
}

const withTheme: Decorator = (Story, context) => (
  <ThemeFrame mode={context.globals.theme === 'dark' ? 'dark' : 'light'}>
    <Story />
  </ThemeFrame>
);

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: 'Tema do InsightHub',
      toolbar: {
        title: 'Tema',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Escuro' },
        ],
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    docs: { toc: true },
  },
  tags: ['autodocs'],
};

export default preview;
