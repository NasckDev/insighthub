import type { Meta, StoryObj } from '@storybook/react-vite';
import { NpsCard } from './nps-card';

/**
 * Cards of the dashboard that are not ECharts: the hero NPS (number, zone, three groups and the band).
 * The synthesis panel and the quote cards need the router, so they are covered by the app tests.
 */
const meta = {
  title: 'Painel/Cartão do NPS',
  component: NpsCard,
  parameters: { layout: 'padded' },
  args: { summary: { total: 640, promoters: 319, passives: 192, detractors: 129, nps: 30 } },
} satisfies Meta<typeof NpsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZonaDeAperfeicoamento: Story = {};
export const ZonaCritica: Story = { args: { summary: { total: 120, promoters: 24, passives: 30, detractors: 66, nps: -35 } } };
export const ZonaDeExcelencia: Story = { args: { summary: { total: 80, promoters: 66, passives: 12, detractors: 2, nps: 80 } } };
