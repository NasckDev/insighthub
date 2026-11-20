import { describe, expect, it } from 'vitest';
import { PALETTES, resolveTokens, type Palette, type ThemeMode } from '../ui';
import { contrastRatio } from './contrast';

/** [foreground, background, minimum ratio]: 4.5 for text, 3 for graphics and controls (WCAG 2.2 AA). */
const PAIRS: [keyof Palette, keyof Palette, number][] = [
  ['fg', 'bg', 4.5],
  ['fg', 'surface', 4.5],
  ['fg', 'surface2', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'surface2', 4.5],
  ['primary', 'bg', 4.5],
  ['primaryFg', 'primary', 4.5],
  ['promoter', 'primarySoft', 4.5],
  ['passive', 'amberSoft', 4.5],
  ['detractor', 'accentSoft', 4.5],
  ['plum', 'plumSoft', 4.5],
  ['promoter', 'surface', 4.5],
  ['passive', 'surface', 4.5],
  ['detractor', 'surface', 4.5],
  ['accentText', 'bg', 4.5],
  ['dangerFg', 'dangerBg', 4.5],
  ['warnFg', 'warnBg', 4.5],
  ['bannerFg', 'bannerBg', 4.5],
  ['plum', 'surface', 4.5],
  ['controlLine', 'bg', 3],
  ['controlLine', 'surface', 3],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['accent', 'surface', 3],
  ['amber', 'surface', 3],
  ['primary', 'surface', 3],
  ['promoterBar', 'surface', 3],
  ['passiveBar', 'surface', 3],
  ['detractorBar', 'surface', 3],
];

const MODES: ThemeMode[] = ['light', 'dark'];

describe('palette contrast (WCAG AA), computed from the central theme', () => {
  for (const mode of MODES) {
    it.each(PAIRS)(`tema ${mode}: %s sobre %s >= %s`, (fg, bg, min) => {
      const palette = PALETTES[mode];
      expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(min);
    });
  }

  it('matches the documented brand colors in the light theme', () => {
    expect(PALETTES.light).toMatchObject({ bg: '#fbf8f3', fg: '#1b1b3a', primary: '#0f766e', accent: '#e8604c' });
    expect(PALETTES.dark.bg).toBe('#0e1514');
  });
});

/** Tokens that Ant Design derives itself (hover states, secondary text) must also hold AA. */
describe('Ant Design tokens after the theme is applied', () => {
  for (const mode of MODES) {
    const resolved = resolveTokens(mode);
    const text = ['colorText', 'colorTextSecondary', 'colorTextTertiary', 'colorTextDescription', 'colorTextHeading'] as const;
    const backgrounds = ['colorBgContainer', 'colorBgLayout', 'colorBgElevated'] as const;
    for (const foreground of text) {
      for (const background of backgrounds) {
        it(`tema ${mode}: ${foreground} sobre ${background} >= 4.5`, () => {
          expect(contrastRatio(String(resolved[foreground]), String(resolved[background]))).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`tema ${mode}: texto do botão primário sobre a cor primária >= 4.5`, () => {
      expect(contrastRatio(PALETTES[mode].primaryFg, String(resolved.colorPrimary))).toBeGreaterThanOrEqual(4.5);
    });
    it(`tema ${mode}: borda de campo sobre o container >= 3`, () => {
      expect(contrastRatio(String(resolved.colorBorder), String(resolved.colorBgContainer))).toBeGreaterThanOrEqual(3);
    });
  }
});
