import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppButton } from './app-button';
import { AppDrawer, type AppDrawerProps } from './app-drawer';

function Demo(args: Omit<AppDrawerProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppButton onClick={() => setOpen(true)}>Abrir painel</AppButton>
      <AppDrawer {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const meta = {
  title: 'Sobreposições/AppDrawer',
  component: AppDrawer,
  render: (args) => <Demo {...args} />,
  args: { title: 'Filtros', open: false, onClose: () => undefined, placement: 'end', children: 'Plano, região, função, tema e período.' },
  argTypes: { placement: { control: 'inline-radio', options: ['end', 'start'] }, width: { control: { type: 'number', min: 320, max: 640, step: 20 } } },
} satisfies Meta<typeof AppDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComRodape: Story = { args: { footer: <AppButton variant="primary" block>Ver resultados</AppButton> } };
export const Esquerda: Story = { args: { placement: 'start', title: 'Mais opções' } };
