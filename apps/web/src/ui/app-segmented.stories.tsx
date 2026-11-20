import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppSegmented } from './app-segmented';
import { BarChartOutlined, TableOutlined } from './icons';

type View = 'chart' | 'table';

function Demo({ size }: { size?: 'sm' | 'md' }) {
  const [view, setView] = useState<View>('chart');
  return (
    <AppSegmented<View>
      aria-label="Formato do gráfico"
      size={size}
      value={view}
      onChange={setView}
      options={[
        { value: 'chart', label: <><BarChartOutlined /> Gráfico</> },
        { value: 'table', label: <><TableOutlined /> Tabela</> },
      ]}
    />
  );
}

const meta = {
  title: 'Navegação/AppSegmented',
  component: AppSegmented<View>,
  render: (args) => <Demo size={args.size} />,
  args: { 'aria-label': 'Formato do gráfico', value: 'chart', onChange: () => undefined, options: [], size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof AppSegmented<View>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Pequeno: Story = { args: { size: 'sm' } };
