import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppStatistic } from './app-statistic';

const meta = {
  title: 'Dados/AppStatistic',
  component: AppStatistic,
  args: { title: 'Promotores', value: 312, hint: '49% · notas 9 e 10', tone: 'promoter', animate: true },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'promoter', 'passive', 'detractor'] }, animate: { control: 'boolean' }, loading: { control: 'boolean' } },
  decorators: [(Story) => <div style={{ maxWidth: 260 }}><Story /></div>],
} satisfies Meta<typeof AppStatistic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { args: { tone: 'default', title: 'Respostas', value: 640, hint: 'no recorte atual' } };
export const Promotores: Story = {};
export const Neutros: Story = { args: { title: 'Neutros', tone: 'passive', value: 188, hint: '29% · notas 7 e 8' } };
export const Detratores: Story = { args: { title: 'Detratores', tone: 'detractor', value: 140, hint: '22% · notas de 0 a 6' } };
export const Carregando: Story = { args: { loading: true } };
export const Texto: Story = { args: { title: 'Pesquisa', value: 'Encerrada', tone: 'default', hint: undefined } };
