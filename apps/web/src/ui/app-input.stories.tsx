import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppInput, AppPasswordInput, AppSearchInput, AppTextArea } from './app-input';

const meta = {
  title: 'Formulário/AppInput',
  component: AppInput,
  args: { placeholder: 'Endereço da API', 'aria-label': 'Endereço da API', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' }, error: { control: 'boolean' } },
} satisfies Meta<typeof AppInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Preenchido: Story = { args: { defaultValue: 'http://localhost:3333' } };
export const Erro: Story = { args: { error: true, defaultValue: 'localhost:3333' } };
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'Somente leitura' } };

function SearchDemo() {
  const [value, setValue] = useState('suporte');
  return <AppSearchInput aria-label="Buscar nos comentários" placeholder="Buscar nos comentários" value={value} onChange={setValue} />;
}
export const Busca: Story = { render: () => <SearchDemo /> };

export const Senha: Story = { render: () => <AppPasswordInput aria-label="Token" placeholder="Token (opcional)" /> };
export const AreaDeTexto: Story = { render: () => <AppTextArea aria-label="Sua nota" rows={3} placeholder="O que isso significa para o time?" /> };
