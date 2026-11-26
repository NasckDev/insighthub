import Breadcrumb from 'antd/es/breadcrumb';
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
  /** Small line above the title. */
  eyebrow?: ReactNode;
  /** Status pill right after the title ("Ativa, 640 respostas"). */
  badge?: ReactNode;
  /** Right side: page actions. */
  extra?: ReactNode;
}

/** Page title (44 px) with trail, status pill and actions. The only `h1` of each screen. */
export function AppPageHeader({ title, subtitle, breadcrumb, eyebrow, badge, extra }: AppPageHeaderProps) {
  return (
    <header className="ih-page-header">
      <div className="ih-page-header-main">
        {breadcrumb ? <AppBreadcrumb items={breadcrumb} /> : null}
        {eyebrow ? <div className="ih-eyebrow ih-row ih-gap-2">{eyebrow}</div> : null}
        <div className="ih-page-header-title">
          <h1>{title}</h1>
          {badge}
        </div>
        {subtitle ? <p className="ih-muted">{subtitle}</p> : null}
      </div>
      {extra ? <div className="ih-page-header-extra">{extra}</div> : null}
    </header>
  );
}
