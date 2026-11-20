import type { ReactNode } from 'react';

export interface AppSideNavItem {
  key: string;
  label: ReactNode;
  icon: ReactNode;
}

export interface AppSideNavProps {
  items: readonly AppSideNavItem[];
  selectedKey: string;
  collapsed?: boolean;
  'aria-label': string;
}

/**
 * Navigation list of the fixed sider. It is plain markup themed by the palette: the Ant Design Menu (rc-menu,
 * overflow, trigger) is about a third of the first-load JavaScript and the sider needs none of its features.
 * Each item brings its own link, so the router keeps handling the navigation.
 */
export function AppSideNav({ items, selectedKey, collapsed = false, 'aria-label': ariaLabel }: AppSideNavProps) {
  return (
    <ul className={`ih-sidenav${collapsed ? ' is-collapsed' : ''}`} aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.key} className={item.key === selectedKey ? 'is-selected' : undefined}>
          <span aria-hidden="true" className="ih-sidenav-icon">
            {item.icon}
          </span>
          <span className="ih-sidenav-label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
