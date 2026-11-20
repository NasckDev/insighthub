import type { SegmentDelta, ThemeStat } from '@insighthub/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { DistributionBin } from '../../lib/overview';
import type { TimelinePoint } from '../../lib/overview';
import { ChartCard } from './chart-card';
import { DistributionChart, NpsLegend } from './distribution-chart';
import { DivergingChart } from './diverging-chart';
import { DistributionTable, SegmentTable, ThemeTable, TimelineTable } from './chart-tables';
import { NpsGauge } from './nps-gauge';
import { TimelineChart } from './timeline-chart';
import { TreemapChart } from './treemap-chart';

const BINS: DistributionBin[] = [3, 2, 4, 6, 8, 12, 20, 38, 61, 74, 52].map((count, score) => ({
  score,
  count,
  category: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor',
}));

const WEEKS: TimelinePoint[] = [12, 18, 15, 22, 9, 24, 31, 28, 35, 33].map((nps, index) => ({
  weekStart: new Date(Date.UTC(2026, 7, 3 + index * 7)).toISOString().slice(0, 10),
  count: index === 4 ? 6 : 40 + index * 3,
  nps,
}));

function stat(theme: ThemeStat['theme'], label: string, mentions: number, sentiment: number, lowSample = false): ThemeStat {
  return { theme, label, mentions, share: Math.round(mentions / 3), sentiment, promoters: 1, passives: 1, detractors: 1, lowSample } as ThemeStat;
}

const THEMES: ThemeStat[] = [
  stat('suporte', 'Suporte', 96, -32),
  stat('preço', 'Preço', 74, -4),
  stat('desempenho', 'Desempenho', 58, 18),
  stat('usabilidade', 'Usabilidade', 44, 41),
  stat('integrações', 'Integrações', 9, 22, true),
];

function seg(segment: string, nps: number, count: number, delta: number, lowSample = false): SegmentDelta {
  return { segment, nps, count, delta, lowSample, promoters: 50, passives: 25, detractors: 25, averageScore: 8.1 } as SegmentDelta;
}

const SEGMENTS: SegmentDelta[] = [seg('free', 6, 180, -18), seg('pro', 28, 300, 4), seg('enterprise', 52, 160, 28), seg('trial', 10, 7, -14, true)];

const meta = { title: 'Gráficos/Gráficos do InsightHub', parameters: { layout: 'padded' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MedidorDeNps: Story = { render: () => <NpsGauge value={24} total={640} /> };
export const MedidorEmZonaCritica: Story = { render: () => <NpsGauge value={-18} total={120} /> };
export const EvolucaoSemanal: Story = { render: () => <TimelineChart points={WEEKS} /> };
export const DistribuicaoDasNotas: Story = { render: () => <><DistributionChart bins={BINS} /><NpsLegend /></> };
export const BarrasDivergentes: Story = { render: () => <DivergingChart stats={SEGMENTS} dimension="plan" overallNps={24} /> };
export const MapaDeTemas: Story = { render: () => <TreemapChart themes={THEMES} selected="suporte" onSelect={fn()} /> };

export const CartaoComAlternativaEmTabela: Story = {
  render: () => (
    <ChartCard
      title="Distribuição das notas"
      description="Quantas respostas recebeu cada nota de 0 a 10."
      chart={<DistributionChart bins={BINS} />}
      legend={<NpsLegend />}
      table={<DistributionTable bins={BINS} />}
    />
  ),
};
export const TabelasAlternativas: Story = {
  render: () => (
    <>
      <TimelineTable points={WEEKS} />
      <SegmentTable stats={SEGMENTS} dimension="plan" />
      <ThemeTable themes={THEMES} />
    </>
  ),
};
