import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppRadioCards, type AppRadioCardsProps } from './app-radio';

function Demo(args: AppRadioCardsProps<string>) {
  const [value, setValue] = useState(args.value);
  return <AppRadioCards {...args} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Formulário/AppRadioCards',
  component: AppRadioCards<string>,
  render: (args) => <Demo {...args} />,
  args: {
    'aria-label': 'Pergunta',
    value: 'summary',
    onChange: () => undefined,
    options: [
      { value: 'summary', label: 'Resumo executivo', description: 'O que as pessoas dizem, em poucas linhas.' },
      { value: 'detractors', label: 'Por que há detratores?', description: 'Lê só quem deu notas de 0 a 6.' },
      { value: 'promoters', label: 'O que os promotores valorizam', description: 'Lê só quem deu 9 ou 10.' },
    ],
  },
} satisfies Meta<typeof AppRadioCards<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const SegundaOpcao: Story = { args: { value: 'detractors' } };
