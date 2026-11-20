import { Layout } from 'antd';
import type { CSSProperties, ReactNode, Ref } from 'react';

export function AppLayout({ children, hasSider = false }: { children: ReactNode; hasSider?: boolean }) {
  return <Layout hasSider={hasSider} style={{ minHeight: '100vh' }}>{children}</Layout>;
}

export interface AppSiderProps {
  children: ReactNode;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  /** Distance from the top of the page, when a banner sits above (kept in the CSS box model). */
  offsetTop?: number;
  'aria-label'?: string;
}

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

/** Collapsible side navigation (desktop). Below 1200 px the screen renders a drawer instead. */
export function AppSider({ children, collapsed, onCollapse, offsetTop = 0, ...rest }: AppSiderProps) {
  const style: CSSProperties = {
    position: 'sticky',
    top: offsetTop,
    height: `calc(100vh - ${offsetTop}px)`,
    alignSelf: 'flex-start',
    overflow: 'auto',
    borderRight: '1px solid var(--ih-line)',
  };
  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={EXPANDED_WIDTH}
      collapsedWidth={COLLAPSED_WIDTH}
      trigger={null}
      style={style}
      {...rest}
    >
      {children}
    </Layout.Sider>
  );
}

export function AppLayoutHeader({ children }: { children: ReactNode }) {
  return <Layout.Header className="ih-header">{children}</Layout.Header>;
}

export function AppLayoutContent({ children, id, contentRef }: { children: ReactNode; id?: string; contentRef?: Ref<HTMLElement> }) {
  return (
    <Layout.Content id={id} ref={contentRef} tabIndex={-1} className="ih-main">
      {children}
    </Layout.Content>
  );
}

/** Wrapper for the area beside the sider (header and content stack in a column). */
export function AppLayoutBody({ children }: { children: ReactNode }) {
  return <Layout style={{ minWidth: 0 }}>{children}</Layout>;
}
