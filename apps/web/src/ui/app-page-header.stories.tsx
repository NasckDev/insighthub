import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { AppPageHeader } from './app-page-header';
import { AppPill } from './app-tag';
import { LinkOutlined, ThunderboltOutlined } from './icons';

const meta = {
  title: 'Layout/AppPageHeader',
  component: AppPageHeader,
  args: {
    title: 'Painel',
    breadcrumb: [{ title: 'InsightHub' }, { title: 'Satisfação trimestral' }],
    badge: <AppPill dot="success">Ativa, 640 respostas</AppPill>,
    extra: (
      <>
        <AppButton icon={<LinkOutlined />}>Copiar link</AppButton>
        <AppButton variant="primary" icon={<ThunderboltOutlined />}>Gerar síntese</AppButton>
      </>
    ),
  },
  decorators: [(Story) => <div style={{ padding: 'var(--ih-space-4)' }}><Story /></div>],
} satisfies Meta<typeof AppPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComSubtitulo: Story = { args: { subtitle: 'Pulso trimestral com clientes ativos do produto fictício Atlas Analytics.' } };
export const SemMigalhas: Story = { args: { breadcrumb: undefined } };
export const Simples: Story = { args: { breadcrumb: undefined, badge: undefined, extra: undefined } };
