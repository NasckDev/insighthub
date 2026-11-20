import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppList, AppTable, type AppColumn } from './app-table';
import { AppEmpty } from './app-empty';
import { AppStatus } from './app-tag';

interface Row {
  id: string;
  name: string;
  score: number;
  plan: string;
  comment: string;
}

const ROWS: Row[] = [
  { id: 'atla-0001', name: 'Camila Barbosa', score: 10, plan: 'Pro', comment: 'O painel me poupa duas horas de planilha toda segunda.' },
  { id: 'atla-0002', name: 'Diego Cardoso', score: 6, plan: 'Free', comment: 'O suporte demora para responder e o preço subiu sem aviso.' },
  { id: 'atla-0003', name: 'Elisa Dias', score: 8, plan: 'Enterprise', comment: 'Bom, mas a exportação ainda é limitada.' },
];

const COLUMNS: AppColumn<Row>[] = [
  { key: 'name', title: 'Respondente', render: (row) => row.name },
  { key: 'score', title: 'Nota', nowrap: true, render: (row) => <AppStatus status={row.score >= 9 ? 'promoter' : row.score >= 7 ? 'passive' : 'detractor'} value={row.score} label={row.score >= 9 ? 'Promotor' : row.score >= 7 ? 'Neutro' : 'Detrator'} /> },
  { key: 'plan', title: 'Plano', render: (row) => row.plan },
  { key: 'comment', title: 'Comentário', render: (row) => row.comment },
];

const meta = {
  title: 'Dados/AppTable',
  component: AppTable<Row>,
  args: { columns: COLUMNS, rows: ROWS, rowKey: (row) => row.id, label: 'Respostas da pesquisa' },
  argTypes: { loading: { control: 'boolean' }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof AppTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Compacta: Story = { args: { size: 'sm' } };
export const Carregando: Story = { args: { loading: true } };
export const Vazia: Story = { args: { rows: [], empty: <AppEmpty framed={false} illustration="search" title="Nenhuma resposta encontrada" description="Tente outro termo ou remova um filtro." /> } };

export const ListaDeCartoes: Story = {
  name: 'Lista de cartões (celular)',
  render: () => (
    <AppList<Row>
      items={ROWS}
      itemKey={(row) => row.id}
      label="Respostas da pesquisa"
      render={(row) => (
        <div className="ih-stack ih-gap-2">
          <strong>{row.name}</strong>
          <span>{row.comment}</span>
          <span className="ih-muted">{row.plan}</span>
        </div>
      )}
    />
  ),
};
