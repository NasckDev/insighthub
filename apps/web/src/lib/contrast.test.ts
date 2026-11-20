import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const css = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf8');

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const THEMES = { claro: tokens(':root {'), escuro: tokens(":root[data-theme='dark']") };

/** [foreground token, background token, minimum ratio]: 4.5 for text, 3 for graphics and controls. */
const PAIRS: [string, string, number][] = [
  ['fg', 'bg', 4.5],
  ['fg', 'surface', 4.5],
  ['fg', 'surface-2', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'surface-2', 4.5],
  ['primary', 'bg', 4.5],
  ['primary-fg', 'primary', 4.5],
  ['promoter', 'primary-soft', 4.5],
  ['passive', 'amber-soft', 4.5],
  ['detractor', 'accent-soft', 4.5],
  ['promoter', 'surface', 4.5],
  ['passive', 'surface', 4.5],
  ['detractor', 'surface', 4.5],
  ['accent-text', 'bg', 4.5],
  ['danger-fg', 'danger-bg', 4.5],
  ['warn-fg', 'warn-bg', 4.5],
  ['banner-fg', 'banner-bg', 4.5],
  ['plum', 'surface', 4.5],
  ['control-line', 'bg', 3],
  ['control-line', 'surface', 3],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['accent', 'surface', 3],
  ['amber', 'surface', 3],
  ['primary', 'surface', 3],
  ['promoter-bar', 'surface', 3],
  ['passive-bar', 'surface', 3],
  ['detractor-bar', 'surface', 3],
];

describe('palette contrast (WCAG AA)', () => {
  for (const [theme, values] of Object.entries(THEMES)) {
    it.each(PAIRS)(`tema ${theme}: %s sobre %s >= %s`, (fg, bg, min) => {
      expect(contrastRatio(values[fg]!, values[bg]!)).toBeGreaterThanOrEqual(min);
    });
  }

  it('matches the documented brand colors in the light theme', () => {
    expect(THEMES.claro).toMatchObject({ bg: '#fbf8f3', fg: '#1b1b3a', primary: '#0f766e', accent: '#e8604c' });
    expect(THEMES.escuro.bg).toBe('#0e1514');
  });
});
