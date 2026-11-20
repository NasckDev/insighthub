import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { AppCard } from './app-card';

const meta = {
  title: 'Dados/AppCard',
  component: AppCard,
  args: { title: 'Do que as pessoas falam', children: 'Temas mais citados e o sentimento de quem os cita.', appearance: 'outlined' },
  argTypes: { appearance: { control: 'inline-radio', options: ['outlined', 'flat'] }, loading: { control: 'boolean' } },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
} satisfies Meta<typeof AppCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComAcao: Story = { args: { extra: <AppButton size="sm">Mapa de temas</AppButton> } };
export const SemTitulo: Story = { args: { title: undefined } };
export const Plano: Story = { args: { appearance: 'flat' } };
export const Carregando: Story = { args: { loading: true } };
