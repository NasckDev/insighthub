import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppCheckbox } from './app-checkbox';

const meta = {
  title: 'Formulário/AppCheckbox',
  component: AppCheckbox,
  args: { children: 'Enterprise', onChange: fn() },
  argTypes: { checked: { control: 'boolean' }, disabled: { control: 'boolean' } },
  decorators: [(Story) => <div style={{ maxWidth: 280 }}><Story /></div>],
} satisfies Meta<typeof AppCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Marcado: Story = { args: { checked: true } };
export const ComContagem: Story = { args: { extra: '128' } };
export const Desabilitado: Story = { args: { disabled: true, extra: '0' } };
