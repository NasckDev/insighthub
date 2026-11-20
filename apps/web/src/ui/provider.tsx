import ConfigProvider from 'antd/es/config-provider';
import ptBR from 'antd/locale/pt_BR';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { buildTheme, useCompactControls, useThemeMode, type ThemeMode } from './theme';
import './ui.css';

// Message and notification holders: loaded after the first paint, see `useToast`.
const ToastHost = lazy(() => import('./toast-host'));

interface AppProviderProps {
  children: ReactNode;
  /** Forces a mode (Storybook, tests). By default it follows `<html data-theme>`. */
  mode?: ThemeMode;
  /** Forces 44 px controls (Storybook). By default it follows the device. */
  compact?: boolean;
}

/**
 * Theme and locale for everything below it.
 * Mounted once in `main.tsx` and in the Storybook preview, so stories look exactly like the app.
 */
export function AppProvider({ children, mode, compact }: AppProviderProps) {
  const currentMode = useThemeMode();
  const deviceCompact = useCompactControls();
  const resolvedMode = mode ?? currentMode;
  const resolvedCompact = compact ?? deviceCompact;
  const theme = useMemo(() => buildTheme(resolvedMode, { compact: resolvedCompact }), [resolvedMode, resolvedCompact]);
  return (
    <ConfigProvider theme={theme} locale={ptBR} componentSize="middle">
      {children}
      <Suspense fallback={null}>
        <ToastHost />
      </Suspense>
    </ConfigProvider>
  );
}
