import antdTheme from 'antd/es/theme';
import type { ThemeConfig } from 'antd';
import { useSyncExternalStore } from 'react';

/**
 * Central theme of InsightHub ("editorial de pesquisa"). Every color, radius, font and control size in
 * the app comes from here: `buildTheme` turns it into Ant Design tokens, and `paletteCss` turns the same
 * palette into CSS custom properties (`--ih-*`) for the rules that live in plain CSS and for ECharts.
 */
export type ThemeMode = 'light' | 'dark';

export interface Palette {
  /** Page ground (`--ih-ground` in the design package). */
  bg: string;
  surface: string;
  /** Wells inside a card: segmented track, table header, hovered rows. */
  surface2: string;
  line: string;
  /** Field borders: 3:1 against the ground and the surface. */
  controlLine: string;
  fg: string;
  muted: string;
  /** Indigo: main action, promoters, positive. */
  primary: string;
  primaryHover: string;
  primaryFg: string;
  primarySoft: string;
  /** Coral: detractors and negative, only in charts and marks, never as a text color. */
  accent: string;
  /** Negative text (the coral darkened to AA). */
  accentText: string;
  accentSoft: string;
  /** Mist: neutrals and quiet control borders. */
  neutral: string;
  neutralSoft: string;
  /** Status dot only, never text. */
  success: string;
  /** Warnings (small sample, search marks), kept apart from the brand trio on purpose. */
  amber: string;
  amberText: string;
  amberSoft: string;
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
  /** Dark "Síntese assistida" panel and active filter pills. */
  panelBg: string;
  panelFg: string;
  panelMuted: string;
  panelLine: string;
  panelLink: string;
  glass: string;
}

/** Values from `tokens.css` of the identity; the extra shades were added and checked for AA in both modes. */
export const PALETTES: Record<ThemeMode, Palette> = {
  light: {
    bg: '#f6f7fb',
    surface: '#ffffff',
    surface2: '#f0f1f6',
    line: '#e3e5ee',
    controlLine: '#80869e',
    fg: '#121528',
    muted: '#5b6075',
    primary: '#3d3df5',
    primaryHover: '#2626c9',
    primaryFg: '#ffffff',
    primarySoft: '#ededfe',
    accent: '#f2643d',
    accentText: '#b8401e',
    accentSoft: '#fdebe5',
    neutral: '#d7d9e4',
    neutralSoft: '#eceef4',
    success: '#1f9d63',
    amber: '#a86a00',
    amberText: '#6b4400',
    amberSoft: '#fff3dc',
    focus: '#3d3df5',
    promoter: '#2626c9',
    passive: '#454a61',
    detractor: '#b8401e',
    promoterBar: '#3d3df5',
    passiveBar: '#d7d9e4',
    detractorBar: '#f2643d',
    dangerBg: '#fdebe5',
    dangerFg: '#8f2e12',
    warnBg: '#fff3dc',
    warnFg: '#6b4400',
    warnLine: '#e2b65a',
    panelBg: '#121528',
    panelFg: '#f3f4fa',
    panelMuted: '#b9bcd3',
    panelLine: '#343857',
    panelLink: '#9c9cff',
    glass: 'rgb(255 255 255 / 0.92)',
  },
  dark: {
    bg: '#0f1220',
    surface: '#171b2e',
    surface2: '#1f2439',
    line: '#2a2f4a',
    controlLine: '#6e7493',
    fg: '#f3f4fa',
    muted: '#b9bcd3',
    primary: '#9c9cff',
    primaryHover: '#c3c3ff',
    primaryFg: '#121528',
    primarySoft: '#23264a',
    accent: '#f2643d',
    accentText: '#ff9b7d',
    accentSoft: '#3b2222',
    neutral: '#3a3f5c',
    neutralSoft: '#262b43',
    success: '#3ccf8e',
    amber: '#e0a63a',
    amberText: '#f0c46a',
    amberSoft: '#33280f',
    focus: '#9c9cff',
    promoter: '#b4b4ff',
    passive: '#d2d4e3',
    detractor: '#ff9b7d',
    promoterBar: '#9c9cff',
    passiveBar: '#4a5070',
    detractorBar: '#f2643d',
    dangerBg: '#3b2222',
    dangerFg: '#ffb6a1',
    warnBg: '#33280f',
    warnFg: '#f3d68a',
    warnLine: '#8a6b1c',
    panelBg: '#23264a',
    panelFg: '#f3f4fa',
    panelMuted: '#c8cae0',
    panelLine: '#3b4070',
    panelLink: '#c3c3ff',
    glass: 'rgb(23 27 46 / 0.92)',
  },
};

export const FONT_SANS = "'Instrument Sans Variable', 'Instrument Sans', Arial, sans-serif";
/** Only for what respondents said (24 to 30 px). Never in titles, buttons or labels. */
export const FONT_QUOTE = "'Instrument Serif', Georgia, serif";
export const FONT_MONO = "ui-monospace, 'Cascadia Mono', 'SF Mono', Consolas, monospace";

/** Radii of the identity: 12 px on controls, 20 px on cards. */
export const RADIUS = { sm: 8, md: 12, lg: 20 } as const;
/** Control heights: touch devices and phones get 44 px targets (WCAG 2.2 and platform guidelines). */
export const CONTROL_HEIGHT = { desktop: 40, desktopSmall: 32, touch: 44, large: 48 } as const;

export const COMPACT_QUERY = '(pointer: coarse), (max-width: 767px)';

/** `surface2` becomes `surface-2`, the name every rule uses (digits were glued to the word before). */
const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/(\d+)/g, '-$1');

function declarations(palette: Palette): string {
  return Object.entries(palette)
    .map(([key, value]) => `--ih-${kebab(key)}:${value};`)
    .join('');
}

/** CSS text with the palette of both modes as `--ih-*` custom properties. */
export function paletteCss(): string {
  return (
    `:root{color-scheme:light;${declarations(PALETTES.light)}--ih-font-sans:${FONT_SANS};--ih-font-quote:${FONT_QUOTE};--ih-font-mono:${FONT_MONO};` +
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
      // The derived hover is a lighter indigo that drops white text below AA; the identity darkens instead.
      colorPrimaryHover: p.primaryHover,
      colorPrimaryActive: p.primaryHover,
      colorSuccess: p.success,
      colorWarning: p.amber,
      colorError: p.detractor,
      colorInfo: p.primary,
      colorLink: p.primaryHover,
      colorLinkHover: p.primary,
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
      colorBgMask: mode === 'dark' ? 'rgb(0 0 0 / 0.62)' : 'rgb(18 21 40 / 0.5)',
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
        mode === 'dark' ? '0 18px 40px -12px rgb(0 0 0 / 0.7)' : '0 18px 40px -12px rgb(18 21 40 / 0.22)',
    },
    components: {
      Layout: {
        bodyBg: p.bg,
        headerBg: p.surface,
        siderBg: p.surface,
        triggerBg: p.surface2,
        triggerColor: p.fg,
        headerPadding: '0 16px',
        headerHeight: 64,
      },
      Menu: {
        itemBg: 'transparent',
        itemColor: p.muted,
        itemHoverBg: p.surface2,
        itemHoverColor: p.fg,
        itemSelectedBg: p.primarySoft,
        itemSelectedColor: p.primaryHover,
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
      Statistic: { titleFontSize: 13, contentFontSize: 30 },
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 600,
        primaryColor: p.primaryFg,
        // The dark algorithm dims the seed indigo; buttons keep the exact token of the identity.
        colorPrimary: p.primary,
        colorPrimaryHover: p.primaryHover,
        colorPrimaryActive: p.primaryHover,
        defaultBorderColor: p.neutral,
        defaultColor: p.fg,
        defaultBg: p.surface,
        borderRadiusLG: RADIUS.md,
      },
      Tabs: { itemColor: p.muted, itemSelectedColor: p.fg, itemHoverColor: p.fg, inkBarColor: p.primary },
      Segmented: {
        itemSelectedBg: p.surface,
        itemSelectedColor: p.fg,
        trackBg: p.surface2,
        itemColor: p.muted,
        itemHoverColor: p.fg,
        trackPadding: 4,
      },
      Tag: { defaultBg: p.surface2, defaultColor: p.fg },
      Result: { titleFontSize: 22 },
      Modal: { titleFontSize: 20 },
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
