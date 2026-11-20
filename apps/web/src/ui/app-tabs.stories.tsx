import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppTabs, type AppTabsProps } from './app-tabs';

function Demo(args: AppTabsProps) {
  const [active, setActive] = useState(args.activeKey);
  return <AppTabs {...args} activeKey={active} onChange={setActive} />;
}

const meta = {
  title: 'Navegação/AppTabs',
  component: AppTabs,
  render: (args) => <Demo {...args} />,
  args: {
    'aria-label': 'Comparar por',
    activeKey: 'plan',
    onChange: () => undefined,
    items: [
      { key: 'plan', label: 'Plano', children: 'NPS por plano' },
      { key: 'region', label: 'Região', children: 'NPS por região' },
      { key: 'role', label: 'Função', children: 'NPS por função' },
    ],
  },
  argTypes: { tabsOnly: { control: 'boolean' } },
} satisfies Meta<typeof AppTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const SoSeletor: Story = { args: { tabsOnly: true } };
export const ComItemDesabilitado: Story = {
  args: { items: [{ key: 'plan', label: 'Plano', children: 'NPS por plano' }, { key: 'region', label: 'Região', children: 'NPS por região', disabled: true }] },
};
