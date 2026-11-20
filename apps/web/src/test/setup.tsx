import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// The rc-* packages behind Ant Design answer `useId()` with the constant "test-id" when NODE_ENV is "test", which
// makes every dialog share one id and breaks aria-labelledby. The suite runs the same development build instead.
process.env.NODE_ENV = 'development';

// The CI and slow machines need more room than the 1s default.
configure({ asyncUtilTimeout: 20000 });

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
});

/**
 * jsdom has no layout engine. Ant Design reads `matchMedia`, `ResizeObserver` and the computed style, so
 * these stand-ins describe a 1440 px desktop window: the sider is fixed and tables stay tables.
 */
Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1440 });

function matches(query: string): boolean {
  const min = /\(min-width:\s*(\d+)px\)/.exec(query);
  const max = /\(max-width:\s*(\d+)px\)/.exec(query);
  if (/pointer:\s*coarse/.test(query) && !min && !max) return false;
  if (/prefers-reduced-motion/.test(query)) return false;
  if (/prefers-color-scheme/.test(query)) return false;
  const width = window.innerWidth;
  if (min && width < Number(min[1])) return false;
  if (max && width > Number(max[1])) return false;
  return Boolean(min || max);
}

window.matchMedia = ((query: string) => {
  // Comma means "or": `(pointer: coarse), (max-width: 767px)`.
  const result = query.split(',').some((part) => matches(part.trim()));
  return {
    matches: result,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList;
}) as typeof window.matchMedia;

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.HTMLElement.prototype.scrollIntoView) window.HTMLElement.prototype.scrollIntoView = () => undefined;

/**
 * ECharts needs a real canvas or SVG layout. The tests check what is handed to the chart (its option) and
 * the text alternatives around it, so the instance itself is replaced by a marker element.
 */
vi.mock('../ui/chart-canvas', () => ({
  default: ({ option }: { option: unknown }) => <div data-testid="echart" data-series={JSON.stringify((option as { series?: { type?: string }[] }).series?.map((item) => item.type) ?? [])} />,
}));
