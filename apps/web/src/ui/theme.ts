import { theme as antdTheme, type ThemeConfig } from 'antd';
import { useSyncExternalStore } from 'react';

/**
 * Central theme of InsightHub. Every color, radius, font and control size in the app comes from here:
 * `buildTheme` turns it into Ant Design tokens, and `paletteCss` turns the same palette into CSS custom
 * properties (`--ih-*`) for the few rules that live in plain CSS and for the ECharts options.
 */
export type ThemeMode = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  controlLine: string;
  fg: string;
  muted: string;
  primary: string;
  primaryFg: string;
  primarySoft: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  amber: string;
  amberText: string;
  amberSoft: string;
  plum: string;
  plumSoft: string;
  focus: string;
  promoter: string;
  passive: string;
  detractor: string;
  promoterBar: string;
  passiveBar: string;
  detractorBar: string;
  dangerBg: string;
  dangerFg: string;
  warnBg: string;
  warnFg: string;
  warnLine: string;
  bannerBg: string;
  bannerFg: string;
  glass: string;
}

export const PALETTES: Record<ThemeMode, Palette> = {
  light: {
    bg: '#fbf8f3',
    surface: '#ffffff',
    surface2: '#f4efe6',
    line: '#e6dfd2',
    controlLine: '#857f72',
    fg: '#1b1b3a',
    muted: '#5a5a72',
    primary: '#0f766e',
    primaryFg: '#ffffff',
    primarySoft: '#dcefeb',
    accent: '#e8604c',
    accentText: '#b23a27',
    accentSoft: '#fbe6e1',
    amber: '#b57c0c',
    amberText: '#7d5200',
    amberSoft: '#fbf0d6',
    plum: '#7a4e8c',
    plumSoft: '#efe5f3',
    focus: '#0f766e',
    promoter: '#0b6b63',
    passive: '#7d5200',
    detractor: '#b23a27',
    promoterBar: '#0f766e',
    passiveBar: '#b57c0c',
    detractorBar: '#e8604c',
    dangerBg: '#fbe6e1',
    dangerFg: '#8f2a1a',
    warnBg: '#fbf0d6',
    warnFg: '#6a4400',
    warnLine: '#d9b45c',
    bannerBg: '#1b1b3a',
    bannerFg: '#f1ecff',
    glass: 'rgb(251 248 243 / 0.86)',
  },
  dark: {
    bg: '#0e1514',
    surface: '#131c1b',
    surface2: '#1a2625',
    line: '#2a3836',
    controlLine: '#6f8481',
    fg: '#eeeae2',
    muted: '#a2b2af',
    primary: '#3cc4b6',
    primaryFg: '#06231f',
    primarySoft: '#12302d',
    accent: '#ff7c68',
    accentText: '#ff9c8b',
    accentSoft: '#3a1f1b',
    amber: '#f0b645',
    amberText: '#f0b645',
    amberSoft: '#352a0e',
    plum: '#c79bdb',
    plumSoft: '#2c1f35',
    focus: '#7ee8da',
    promoter: '#52d6c7',
    passive: '#f0b645',
    detractor: '#ff9c8b',
    promoterBar: '#2fb3a5',
    passiveBar: '#e3a92f',
    detractorBar: '#f26f5b',
    dangerBg: '#3a1f1b',
    dangerFg: '#ffb4a6',
    warnBg: '#352a0e',
    warnFg: '#f3d68a',
    warnLine: '#8a6b1c',
    bannerBg: '#0a100f',
    bannerFg: '#cfe7e3',
    glass: 'rgb(14 21 20 / 0.86)',
  },
};

export const FONT_SANS = "'Inter Variable', ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif";
export const FONT_DISPLAY = "'Fraunces Variable', 'Iowan Old Style', Georgia, serif";
export const FONT_MONO = "ui-monospace, 'Cascadia Mono', 'SF Mono', Consolas, monospace";

/** Radii of the editorial identity (medium corners, thin lines). */
export const RADIUS = { sm: 8, md: 12, lg: 14 } as const;
/** Control heights: touch devices and phones get 44 px targets (WCAG 2.2 and platform guidelines). */
export const CONTROL_HEIGHT = { desktop: 40, desktopSmall: 32, touch: 44, large: 48 } as const;

export const COMPACT_QUERY = '(pointer: coarse), (max-width: 767px)';

const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function declarations(palette: Palette): string {
  return Object.entries(palette)
    .map(([key, value]) => `--ih-${kebab(key)}:${value};`)
    .join('');
}

/** CSS text with the palette of both modes as `--ih-*` custom properties. */
export function paletteCss(): string {
  return (
    `:root{color-scheme:light;${declarations(PALETTES.light)}--ih-font-sans:${FONT_SANS};--ih-font-display:${FONT_DISPLAY};--ih-font-mono:${FONT_MONO};` +
    `--ih-radius-sm:${RADIUS.sm}px;--ih-radius-md:${RADIUS.md}px;--ih-radius-lg:${RADIUS.lg}px;}` +
    `:root[data-theme='dark']{color-scheme:dark;${declarations(PALETTES.dark)}}`
  );
}

/** Writes the palette once, before React renders, so the first paint already has the right colors. */
export function injectPaletteCss(): void {
  if (typeof document === 'undefined' || document.getElementById('ih-palette')) return;
  const style = document.createElement('style');
  style.id = 'ih-palette';
  style.textContent = paletteCss();
  document.head.prepend(style);
}

export interface ThemeOptions {
  /** Phones and touch screens: every control reaches 44 px. */
  compact?: boolean;
}

export function buildTheme(mode: ThemeMode, { compact = false }: ThemeOptions = {}): ThemeConfig {
  const p = PALETTES[mode];
  const control = compact ? CONTROL_HEIGHT.touch : CONTROL_HEIGHT.desktop;
  const controlSmall = compact ? CONTROL_HEIGHT.touch : CONTROL_HEIGHT.desktopSmall;
  return {
    cssVar: { key: 'ih' },
    hashed: false,
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorSuccess: p.promoter,
      colorWarning: p.amber,
      colorError: p.detractor,
      colorInfo: p.primary,
      colorLink: p.primary,
      colorBgLayout: p.bg,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorText: p.fg,
      colorTextSecondary: p.muted,
      colorTextTertiary: p.muted,
      colorTextDescription: p.muted,
      colorTextPlaceholder: p.muted,
      colorTextHeading: p.fg,
      colorBorder: p.controlLine,
      colorBorderSecondary: p.line,
      colorSplit: p.line,
      colorFillSecondary: p.surface2,
      colorFillTertiary: p.surface2,
      colorFillQuaternary: p.surface2,
      colorBgContainerDisabled: p.surface2,
      colorBgMask: mode === 'dark' ? 'rgb(0 0 0 / 0.62)' : 'rgb(6 12 11 / 0.55)',
      controlOutline: 'transparent',
      colorPrimaryBg: p.primarySoft,
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 15,
      borderRadius: RADIUS.md,
      borderRadiusLG: RADIUS.lg,
      borderRadiusSM: RADIUS.sm,
      borderRadiusXS: 6,
      controlHeight: control,
      controlHeightSM: controlSmall,
      controlHeightLG: CONTROL_HEIGHT.large,
      lineWidth: 1,
      boxShadow: 'none',
      boxShadowSecondary:
        mode === 'dark' ? '0 18px 40px -12px rgb(0 0 0 / 0.7)' : '0 18px 40px -12px rgb(27 27 58 / 0.28)',
    },
    components: {
      Layout: {
        bodyBg: p.bg,
        headerBg: p.surface,
        siderBg: p.surface,
        triggerBg: p.surface2,
        triggerColor: p.fg,
        headerPadding: '0 24px',
        headerHeight: 64,
      },
      Menu: {
        itemBg: 'transparent',
        itemColor: p.muted,
        itemHoverBg: p.surface2,
        itemHoverColor: p.fg,
        itemSelectedBg: p.primarySoft,
        itemSelectedColor: p.fg,
        itemHeight: 44,
        itemBorderRadius: RADIUS.md,
        activeBarBorderWidth: 0,
        iconSize: 18,
      },
      Table: {
        headerBg: p.surface2,
        headerColor: p.fg,
        headerSplitColor: 'transparent',
        rowHoverBg: p.surface2,
        borderColor: p.line,
        cellPaddingBlock: 14,
        headerBorderRadius: RADIUS.md,
      },
      Card: { headerFontSize: 18, boxShadowTertiary: 'none' },
      Statistic: { titleFontSize: 14, contentFontSize: 38 },
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 600,
        primaryColor: p.primaryFg,
      },
      Tabs: { itemColor: p.muted, itemSelectedColor: p.fg, itemHoverColor: p.fg, inkBarColor: p.accent },
      Segmented: { itemSelectedBg: p.primary, itemSelectedColor: p.primaryFg, trackBg: p.surface2, itemColor: p.fg },
      Tag: { defaultBg: p.surface2, defaultColor: p.fg },
      Result: { titleFontSize: 22 },
    },
  };
}

/** Reads the current mode from `<html data-theme>`, which the inline script in index.html sets before paint. */
export function readThemeMode(): ThemeMode {
  return typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribeThemeMode(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** Design tokens after Ant Design derived everything from the seed (hover states, secondary text...). Used by the contrast tests. */
export function resolveTokens(mode: ThemeMode): Record<string, unknown> {
  const config = buildTheme(mode);
  return { ...antdTheme.getDesignToken({ algorithm: config.algorithm, token: config.token }) };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeThemeMode, readThemeMode, () => 'light');
}

const THEME_STORAGE_KEY = 'insighthub-theme';

/** Flips and remembers the theme. Used by the toggle, the command palette and the `T` shortcut. */
export function applyNextTheme(): ThemeMode {
  const next: ThemeMode = readThemeMode() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this visit only.
  }
  return next;
}

function subscribeCompact(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const compactNow = () => (typeof window.matchMedia === 'function' ? window.matchMedia(COMPACT_QUERY).matches : false);

/** True on phones and touch screens: controls grow to 44 px and tables become card lists. */
export function useCompactControls(): boolean {
  return useSyncExternalStore(subscribeCompact, compactNow, () => false);
}

export const PHONE_QUERY = '(max-width: 767px)';

function subscribePhone(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const phoneNow = () => (typeof window.matchMedia === 'function' ? window.matchMedia(PHONE_QUERY).matches : false);

/** True below 768 px: tables become card lists and side panels become bottom sheets. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribePhone, phoneNow, () => false);
}

export const DESKTOP_QUERY = '(min-width: 1200px)';

function subscribeDesktop(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const desktopNow = () => (typeof window.matchMedia === 'function' ? window.matchMedia(DESKTOP_QUERY).matches : true);

/** True from 1200 px: the sider is fixed; below it the menu lives in a drawer and a bottom bar. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, desktopNow, () => true);
}
