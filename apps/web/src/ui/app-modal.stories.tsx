import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppButton } from './app-button';
import { AppModal, type AppModalProps } from './app-modal';

function Demo(args: Omit<AppModalProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppButton variant="primary" onClick={() => setOpen(true)}>Abrir diálogo</AppButton>
      <AppModal {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const meta = {
  title: 'Sobreposições/AppModal',
  component: AppModal,
  render: (args) => <Demo {...args} />,
  args: { title: 'Salvar no quadro', open: false, onClose: () => undefined, size: 'md', children: 'Dê um título ao insight e, se quiser, deixe uma nota para o time.' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof AppModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Pequeno: Story = { args: { size: 'sm', title: 'Conectar à API' } };
export const ComRodape: Story = { args: { footer: <AppButton variant="primary">Salvar insight</AppButton> } };
export const Largo: Story = { args: { size: 'lg', title: 'Atalhos de teclado' } };
