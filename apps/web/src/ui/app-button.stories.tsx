import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppButton } from './app-button';
import { AppIconButton } from './app-icon-button';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from './icons';

const meta = {
  title: 'Ações/AppButton',
  component: AppButton,
  args: { children: 'Gerar síntese', variant: 'secondary', size: 'md', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    danger: { control: 'boolean' },
  },
} satisfies Meta<typeof AppButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Primario: Story = { args: { variant: 'primary' } };
export const Fantasma: Story = { args: { variant: 'ghost', children: 'Limpar filtros' } };
export const Link: Story = { args: { variant: 'link', children: 'Ver todas as respostas' } };
export const ComIcone: Story = { args: { variant: 'primary', icon: <ReloadOutlined />, children: 'Tentar de novo' } };
export const Desabilitado: Story = { args: { disabled: true } };
export const Carregando: Story = { args: { variant: 'primary', loading: true, children: 'Conectando…' } };
export const Perigo: Story = { args: { danger: true, icon: <DeleteOutlined />, children: 'Excluir insight' } };
export const Tamanhos: Story = {
  render: (args) => (
    <div className="ih-row ih-gap-3">
      <AppButton {...args} size="sm">Pequeno</AppButton>
      <AppButton {...args} size="md">Médio</AppButton>
      <AppButton {...args} size="lg">Grande</AppButton>
    </div>
  ),
};
export const SoIcone: Story = {
  render: () => (
    <div className="ih-row ih-gap-3">
      <AppIconButton label="Editar insight" icon={<EditOutlined />} />
      <AppIconButton label="Excluir insight" icon={<DeleteOutlined />} danger />
      <AppIconButton label="Atualizar" icon={<ReloadOutlined />} disabled />
    </div>
  ),
};
