import Tabs from 'antd/es/tabs';
import type { ReactNode } from 'react';

export interface AppTabItem {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

export interface AppTabsProps {
  items: readonly AppTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  'aria-label'?: string;
  /** Hide the panels when the content lives elsewhere and the tabs only choose it. */
  tabsOnly?: boolean;
}

/** Tabs. With `tabsOnly` they behave as a selector for content rendered by the screen. */
export function AppTabs({ items, activeKey, onChange, tabsOnly = false, 'aria-label': ariaLabel }: AppTabsProps) {
  return (
    <Tabs
      activeKey={activeKey}
      onChange={onChange}
      aria-label={ariaLabel}
      items={items.map((item) => ({ ...item, children: tabsOnly ? undefined : item.children }))}
      size="large"
      renderTabBar={undefined}
      tabBarGutter={24}
    />
  );
}
