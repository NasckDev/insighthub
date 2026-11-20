import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppSelect } from './app-select';

const OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
  { value: 'score-desc', label: 'Maior nota' },
  { value: 'score-asc', label: 'Menor nota' },
];

const meta = {
  title: 'Formulário/AppSelect',
  component: AppSelect,
  args: { options: OPTIONS, defaultValue: 'recent', 'aria-label': 'Ordenar por', onChange: fn(), style: { width: 220 } },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' }, error: { control: 'boolean' }, loading: { control: 'boolean' } },
} satisfies Meta<typeof AppSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Desabilitado: Story = { args: { disabled: true } };
export const Erro: Story = { args: { error: true } };
export const Carregando: Story = { args: { loading: true } };
export const SemValor: Story = { args: { defaultValue: undefined, placeholder: 'Escolha a ordem' } };
