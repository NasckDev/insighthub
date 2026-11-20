import { Breadcrumb } from 'antd';
import type { ReactNode } from 'react';

export interface AppBreadcrumbItem {
  title: ReactNode;
  /** Items with a link render it themselves, so the router keeps handling the navigation. */
}

export function AppBreadcrumb({ items, 'aria-label': ariaLabel = 'Você está em' }: { items: readonly AppBreadcrumbItem[]; 'aria-label'?: string }) {
  return <Breadcrumb aria-label={ariaLabel} items={items.map((item) => ({ title: item.title }))} />;
}

export interface AppPageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  breadcrumb?: readonly AppBreadcrumbItem[];
  /** Small line above the title (status and totals). */
  eyebrow?: ReactNode;
  /** Right side: selectors and buttons. */
  extra?: ReactNode;
}

/** Page title with breadcrumb, eyebrow and actions. The only `h1` of each screen. */
export function AppPageHeader({ title, subtitle, breadcrumb, eyebrow, extra }: AppPageHeaderProps) {
  return (
    <header className="ih-stack" style={{ gap: 'var(--ih-space-2)', marginBottom: 'var(--ih-space-4)' }}>
      {breadcrumb ? <AppBreadcrumb items={breadcrumb} /> : null}
      <div className="ih-page-header" style={{ marginBottom: 0 }}>
        <div className="ih-fill" style={{ flexBasis: '20rem' }}>
          {eyebrow ? <div className="ih-eyebrow ih-row ih-gap-2">{eyebrow}</div> : null}
          <h1 className="ih-display">{title}</h1>
          {subtitle ? <p className="ih-muted">{subtitle}</p> : null}
        </div>
        {extra ? <div className="ih-page-header-extra">{extra}</div> : null}
      </div>
    </header>
  );
}
