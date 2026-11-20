import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppButton } from './app-button';
import { AppDropdown, AppMenu } from './app-dropdown';
import { AppLayout, AppLayoutBody, AppLayoutContent, AppLayoutHeader, AppSider } from './app-layout';
import { ApartmentOutlined, DashboardOutlined, MessageOutlined, SearchOutlined } from './icons';

function Shell({ startCollapsed }: { startCollapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  return (
    <div style={{ height: 420, overflow: 'hidden', border: '1px solid var(--ih-line)' }}>
      <AppLayout hasSider>
        <AppSider collapsed={collapsed} onCollapse={setCollapsed}>
          <div className="ih-sider-inner">
            <strong className="ih-logo-word">{collapsed ? 'IH' : 'InsightHub'}</strong>
            <AppMenu
              aria-label="Seções"
              selectedKey="visao-geral"
              collapsed={collapsed}
              items={[
                { key: 'visao-geral', label: 'Painel', icon: <DashboardOutlined /> },
                { key: 'respostas', label: 'Respostas', icon: <MessageOutlined /> },
                { key: 'temas', label: 'Temas', icon: <ApartmentOutlined /> },
              ]}
            />
            <div className="ih-sider-spacer" />
            <AppButton variant="ghost" onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'Expandir' : 'Recolher menu'}</AppButton>
          </div>
        </AppSider>
        <AppLayoutBody>
          <AppLayoutHeader>
            <AppButton variant="ghost" icon={<SearchOutlined />}>Buscar</AppButton>
            <div className="ih-fill" />
            <AppDropdown items={[{ key: 'a', label: 'Atalhos de teclado' }]}>
              <AppButton variant="ghost">Conta</AppButton>
            </AppDropdown>
          </AppLayoutHeader>
          <AppLayoutContent>Conteúdo da página</AppLayoutContent>
        </AppLayoutBody>
      </AppLayout>
    </div>
  );
}

const meta = {
  title: 'Layout/AppLayout',
  component: Shell,
  args: { startCollapsed: false },
  argTypes: { startCollapsed: { control: 'boolean' } },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const MenuRecolhido: Story = { args: { startCollapsed: true } };
