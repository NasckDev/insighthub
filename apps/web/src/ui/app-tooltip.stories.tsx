import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './app-button';
import { AppTooltip } from './app-tooltip';

const meta = {
  title: 'Feedback/AppTooltip',
  component: AppTooltip,
  args: { title: 'Alternar entre tema claro e escuro (T)', placement: 'top', children: <AppButton>Passe o mouse ou use o teclado</AppButton> },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  decorators: [(Story) => <div style={{ padding: '3rem' }}><Story /></div>],
} satisfies Meta<typeof AppTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Abaixo: Story = { args: { placement: 'bottom' } };
export const Desabilitado: Story = { args: { children: <span><AppButton disabled>Ação indisponível</AppButton></span>, title: 'Gere uma síntese antes de salvar' } };
