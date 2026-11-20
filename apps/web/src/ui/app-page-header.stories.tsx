import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { AppPageHeader } from './app-page-header';
import { AppTag } from './app-tag';

const meta = {
  title: 'Layout/AppPageHeader',
  component: AppPageHeader,
  args: {
    title: 'Painel',
    subtitle: 'Atlas Analytics · pesquisa de satisfação do 3º trimestre',
    breadcrumb: [{ title: 'InsightHub' }, { title: 'Pesquisa de satisfação Q3' }, { title: 'Painel' }],
    eyebrow: (<><AppTag tone="primary">Ativa</AppTag><span>640 respostas · NPS geral +24</span></>),
    extra: <AppButton variant="primary">Nova síntese</AppButton>,
  },
  decorators: [(Story) => <div style={{ padding: 'var(--ih-space-4)' }}><Story /></div>],
} satisfies Meta<typeof AppPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const SemMigalhas: Story = { args: { breadcrumb: undefined } };
export const Simples: Story = { args: { breadcrumb: undefined, eyebrow: undefined, extra: undefined, subtitle: undefined } };
