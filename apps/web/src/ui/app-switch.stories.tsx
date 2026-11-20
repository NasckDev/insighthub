import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppSwitch } from './app-switch';

const meta = {
  title: 'Formulário/AppSwitch',
  component: AppSwitch,
  args: { 'aria-label': 'Receber o resumo semanal', onChange: fn() },
  argTypes: { checked: { control: 'boolean' }, disabled: { control: 'boolean' }, loading: { control: 'boolean' }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof AppSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Ligado: Story = { args: { defaultChecked: true } };
export const Desabilitado: Story = { args: { disabled: true } };
export const Carregando: Story = { args: { loading: true, defaultChecked: true } };
