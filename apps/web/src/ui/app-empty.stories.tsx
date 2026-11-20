import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { AppEmpty } from './app-empty';

const meta = {
  title: 'Feedback/AppEmpty',
  component: AppEmpty,
  args: {
    title: 'Nenhuma resposta com esses filtros',
    description: 'Remova algum filtro para voltar a ver os indicadores.',
    illustration: 'chart',
    framed: true,
    action: <AppButton>Limpar filtros</AppButton>,
  },
  argTypes: { illustration: { control: 'select', options: ['search', 'board', 'error', 'chart', 'themes', 'spark'] }, framed: { control: 'boolean' } },
} satisfies Meta<typeof AppEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Busca: Story = { args: { illustration: 'search', title: 'Nenhuma resposta encontrada', description: 'Tente outro termo, remova um filtro ou comece por um tema.' } };
export const Quadro: Story = { args: { illustration: 'board', title: 'Seu quadro está vazio', description: 'Gere uma síntese e salve o que merece virar decisão.', action: <AppButton variant="primary">Ir para a Síntese</AppButton> } };
export const SemMoldura: Story = { args: { framed: false } };
