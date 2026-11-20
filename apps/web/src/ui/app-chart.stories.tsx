import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppChart } from './app-chart';
import { FONT_SANS, PALETTES } from './theme';

const p = PALETTES.light;

const BARS = {
  grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
  xAxis: { type: 'category', data: ['Free', 'Pro', 'Enterprise'], axisLabel: { color: p.muted, fontFamily: FONT_SANS } },
  yAxis: { type: 'value', show: false },
  tooltip: { trigger: 'axis' },
  series: [{ type: 'bar', barMaxWidth: 48, data: [12, 31, 46], itemStyle: { color: p.primary, borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top' } }],
};

const meta = {
  title: 'Gráficos/AppChart',
  component: AppChart,
  args: { option: BARS, label: 'NPS por plano: Free +12, Pro +31, Enterprise +46', height: 240 },
  argTypes: { height: { control: { type: 'range', min: 160, max: 480, step: 20 } } },
} satisfies Meta<typeof AppChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Barras: Story = {};
export const Baixo: Story = { args: { height: 160 } };
export const SemDados: Story = {
  args: { option: { xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [] }], graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: 'Sem dados neste recorte', fill: p.muted, fontFamily: FONT_SANS, fontSize: 14 } }] }, label: 'Gráfico sem dados' },
};
