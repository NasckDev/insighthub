import Dropdown from 'antd/es/dropdown';
import Menu from 'antd/es/menu';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

export interface AppMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface AppDropdownProps {
  items: readonly AppMenuItem[];
  children: ReactNode;
  placement?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}

/** Menu that opens from a trigger (avatar, "more" button). */
export function AppDropdown({ items, children, placement = 'bottomRight' }: AppDropdownProps) {
  const menuItems: MenuProps['items'] = items.map(({ onClick: _onClick, ...item }) => item);
  return (
    <Dropdown
      trigger={['click']}
      placement={placement}
      menu={{
        items: menuItems,
        onClick: ({ key }) => items.find((item) => item.key === key)?.onClick?.(),
      }}
    >
      {children}
    </Dropdown>
  );
}

export interface AppNavItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
}

export interface AppMenuProps {
  items: readonly AppNavItem[];
  selectedKey: string;
  collapsed?: boolean;
  'aria-label': string;
}

/** Vertical navigation menu (sider and mobile drawer). Items bring their own links. */
export function AppMenu({ items, selectedKey, collapsed = false, 'aria-label': ariaLabel }: AppMenuProps) {
  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={[selectedKey]}
      items={items.map((item) => ({ ...item }))}
      aria-label={ariaLabel}
      style={{ borderInlineEnd: 0, background: 'transparent' }}
    />
  );
}
