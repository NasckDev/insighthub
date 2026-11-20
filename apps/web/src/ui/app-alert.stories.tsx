import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppAlert, AppResult } from './app-alert';
import { AppButton } from './app-button';

const meta = {
  title: 'Feedback/AppAlert',
  component: AppAlert,
  args: { kind: 'warning', title: 'Resultado parcial.', description: 'Foram carregadas 10 de 20 linhas desta página.', onClose: fn() },
  argTypes: { kind: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] }, closable: { control: 'boolean' }, showIcon: { control: 'boolean' } },
} satisfies Meta<typeof AppAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aviso: Story = {};
export const Informacao: Story = { args: { kind: 'info', title: 'Amostra pequena (8 respostas): o NPS oscila muito com poucos dados.', description: undefined } };
export const Sucesso: Story = { args: { kind: 'success', title: 'Insight salvo no quadro.', description: undefined } };
export const Erro: Story = { args: { kind: 'error', live: 'alert', title: 'Não foi possível conectar.', description: 'Confira o endereço e tente de novo.' } };
export const ComAcao: Story = { args: { action: <AppButton size="sm">Tentar de novo</AppButton>, closable: true } };

export const ResultadoDeErro: StoryObj<typeof AppResult> = {
  render: () => (
    <AppResult
      status="error"
      illustrated
      title="Não foi possível carregar"
      subTitle="A API não respondeu. Tente de novo; se o problema continuar, volte em instantes."
      extra={<AppButton>Tentar de novo</AppButton>}
    />
  ),
};
export const ResultadoDeSucesso: StoryObj<typeof AppResult> = {
  render: () => <AppResult status="success" title="Quadro exportado" subTitle="O arquivo Markdown foi baixado." />,
};
