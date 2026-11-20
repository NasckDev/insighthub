import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSteps } from './app-steps';

const meta = {
  title: 'Navegação/AppSteps',
  component: AppSteps,
  args: { current: 1, size: 'sm', items: [{ title: 'Painel' }, { title: 'Filtros' }, { title: 'Síntese' }] },
  argTypes: { current: { control: { type: 'range', min: 0, max: 2, step: 1 } }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
} satisfies Meta<typeof AppSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Primeiro: Story = { args: { current: 0 } };
export const Ultimo: Story = { args: { current: 2 } };
export const ComDescricao: Story = { args: { size: 'md', items: [{ title: 'Painel', description: 'Leia o NPS' }, { title: 'Filtros', description: 'Recorte' }, { title: 'Síntese', description: 'Pergunte' }] } };
