import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppCollapse } from './app-collapse';

const meta = {
  title: 'Dados/AppCollapse',
  component: AppCollapse,
  args: { label: 'Ler a síntese completa', defaultOpen: false, children: 'O suporte é o tema que mais puxa a nota para baixo: 38 menções, quase todas de detratores.' },
  argTypes: { defaultOpen: { control: 'boolean' } },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
} satisfies Meta<typeof AppCollapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fechado: Story = {};
export const Aberto: Story = { args: { defaultOpen: true } };
