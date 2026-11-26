import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { paletteCss } from './theme';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function sources(): string[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    .filter((file) => /\.(tsx?|css)$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file))
    .map((file) => readFileSync(join(SRC, file), 'utf8'));
}

function declared(css: string): Set<string> {
  return new Set([...css.matchAll(/(--ih-[a-z0-9-]+)\s*:/g)].map((match) => match[1] as string));
}

describe('palette custom properties', () => {
  it('writes keys with digits the way the rules read them (surface2 -> --ih-surface-2)', () => {
    expect(paletteCss()).toContain('--ih-surface-2:#f0f1f6;');
    expect(paletteCss()).not.toContain('--ih-surface2:');
  });

  it('defines every --ih-* variable that the styles and components read', () => {
    const files = sources();
    const defined = declared(paletteCss() + files.join('\n'));
    const used = new Set(files.flatMap((text) => [...text.matchAll(/var\((--ih-[a-z0-9-]+)\s*\)/g)].map((match) => match[1] as string)));
    const missing = [...used].filter((name) => !defined.has(name)).sort();
    expect(missing).toEqual([]);
  });
});
