import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { useToast, type ToastInput } from './app-toast';

function Trigger({ toast, label }: { toast: ToastInput; label: string }) {
  const show = useToast();
  return <AppButton onClick={() => show(toast)}>{label}</AppButton>;
}

const meta = {
  title: 'Feedback/Toast',
  component: Trigger,
  args: { label: 'Mostrar aviso', toast: { message: 'Link do quadro copiado. Quem abrir poderá importar os insights.' } },
} satisfies Meta<typeof Trigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sucesso: Story = {};
export const Informacao: Story = { args: { label: 'Excluir insight', toast: { kind: 'info', message: 'Insight “Suporte pesa na nota” excluído.', action: { label: 'Desfazer', onClick: () => undefined }, durationMs: 8000 } } };
export const Erro: Story = { args: { label: 'Copiar link', toast: { kind: 'error', message: 'Não foi possível copiar o link neste navegador.' } } };
