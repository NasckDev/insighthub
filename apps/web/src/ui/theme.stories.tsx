import type { Meta, StoryObj } from '@storybook/react-vite';
import { contrastRatio } from '../lib/contrast';
import { AppTag } from './app-tag';
import { PALETTES, type Palette } from './theme';
import { useThemeMode } from './theme';

const PAIRS: [keyof Palette, keyof Palette][] = [
  ['fg', 'surface'],
  ['muted', 'surface'],
  ['primary', 'surface'],
  ['promoter', 'primarySoft'],
  ['passive', 'neutralSoft'],
  ['primaryHover', 'primarySoft'],
  ['panelFg', 'panelBg'],
  ['detractor', 'accentSoft'],
  ['controlLine', 'surface'],
];

function Swatches() {
  const mode = useThemeMode();
  const palette = PALETTES[mode];
  return (
    <div style={{ display: 'grid', gap: 'var(--ih-space-4)' }}>
      <div className="ih-row ih-gap-3">
        {(Object.keys(palette) as (keyof Palette)[]).filter((key) => palette[key].startsWith('#')).map((key) => (
          <div key={key} style={{ width: 96 }}>
            <div style={{ height: 48, borderRadius: 'var(--ih-radius-md)', background: palette[key], border: '1px solid var(--ih-line)' }} />
            <div style={{ fontSize: 12, marginTop: 4 }}>{key}</div>
            <code style={{ fontSize: 11 }}>{palette[key]}</code>
          </div>
        ))}
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 14 }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 8 }}>Contraste calculado ({mode === 'dark' ? 'tema escuro' : 'tema claro'})</caption>
        <thead>
          <tr><th scope="col" style={{ textAlign: 'left' }}>Texto</th><th scope="col" style={{ textAlign: 'left' }}>Fundo</th><th scope="col" style={{ textAlign: 'right' }}>Razão</th><th scope="col" /></tr>
        </thead>
        <tbody>
          {PAIRS.map(([fg, bg]) => {
            const ratio = contrastRatio(palette[fg], palette[bg]);
            const need = fg === 'controlLine' ? 3 : 4.5;
            return (
              <tr key={`${fg}-${bg}`}>
                <td style={{ paddingRight: 16 }}>{fg}</td>
                <td style={{ paddingRight: 16 }}>{bg}</td>
                <td style={{ textAlign: 'right', paddingRight: 16 }}>{ratio.toFixed(2)}:1</td>
                <td><AppTag tone={ratio >= need ? 'promoter' : 'detractor'}>{ratio >= need ? `AA (≥ ${need})` : 'abaixo do mínimo'}</AppTag></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const meta = { title: 'Fundamentos/Tema', component: Swatches, parameters: { layout: 'padded' } } satisfies Meta<typeof Swatches>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaletaEContraste: Story = {};
