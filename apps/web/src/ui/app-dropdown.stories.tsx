import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppButton } from './app-button';
import { AppDropdown, AppMenu } from './app-dropdown';
import { ApiOutlined, CompassOutlined, DashboardOutlined, MessageOutlined, QuestionCircleOutlined } from './icons';

const meta = {
  title: 'Navegação/AppDropdown',
  component: AppDropdown,
  args: {
    placement: 'bottomLeft',
    children: <AppButton>Menu da conta</AppButton>,
    items: [
      { key: 'connect', label: 'Conectar à API', icon: <ApiOutlined />, onClick: fn() },
      { key: 'shortcuts', label: 'Atalhos de teclado', icon: <QuestionCircleOutlined />, onClick: fn() },
      { key: 'tour', label: 'Rever o tour', icon: <CompassOutlined />, onClick: fn() },
      { key: 'off', label: 'Indisponível', disabled: true },
    ],
  },
  argTypes: { placement: { control: 'inline-radio', options: ['bottomRight', 'bottomLeft', 'topRight', 'topLeft'] } },
  decorators: [(Story) => <div style={{ minHeight: 220 }}><Story /></div>],
} satisfies Meta<typeof AppDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const MenuLateral: StoryObj<typeof AppMenu> = {
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <AppMenu
        aria-label="Seções"
        selectedKey="respostas"
        items={[
          { key: 'visao-geral', label: 'Painel', icon: <DashboardOutlined /> },
          { key: 'respostas', label: 'Respostas', icon: <MessageOutlined /> },
        ]}
      />
    </div>
  ),
};
export const MenuRecolhido: StoryObj<typeof AppMenu> = {
  render: () => (
    <div style={{ maxWidth: 80 }}>
      <AppMenu
        aria-label="Seções"
        selectedKey="visao-geral"
        collapsed
        items={[
          { key: 'visao-geral', label: 'Painel', icon: <DashboardOutlined /> },
          { key: 'respostas', label: 'Respostas', icon: <MessageOutlined /> },
        ]}
      />
    </div>
  ),
};
