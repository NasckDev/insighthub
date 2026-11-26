import Tag from 'antd/es/tag';
import type { TagProps } from 'antd';
import type { ReactNode } from 'react';
import { FrownOutlined, MehOutlined, SmileOutlined } from './icons';

export type TagTone = 'neutral' | 'primary' | 'promoter' | 'passive' | 'detractor' | 'info';

export interface AppTagProps extends Omit<TagProps, 'color' | 'variant' | 'icon'> {
  tone?: TagTone;
  icon?: ReactNode;
}

/** Small label. Every tone has a soft background and a text color checked for AA contrast in both themes. */
export function AppTag({ tone = 'neutral', icon, className, children, ...rest }: AppTagProps) {
  return (
    <Tag className={`ih-tag ih-tag--${tone} ${className ?? ''}`} variant="filled" {...rest}>
      {icon}
      {children}
    </Tag>
  );
}

export type StatusKind = 'promoter' | 'passive' | 'detractor';

const STATUS_ICON: Record<StatusKind, ReactNode> = {
  promoter: <SmileOutlined aria-hidden="true" />,
  passive: <MehOutlined aria-hidden="true" />,
  detractor: <FrownOutlined aria-hidden="true" />,
};

export interface AppStatusProps {
  status: StatusKind;
  /** Word shown next to the icon, so the status never relies on color alone. */
  label: string;
  /** Extra detail before the label, such as the score. */
  value?: ReactNode;
}

/** NPS band as icon, optional value and a word. */
export function AppStatus({ status, label, value }: AppStatusProps) {
  return (
    <AppTag tone={status} icon={STATUS_ICON[status]}>
      {value !== undefined ? <span className="ih-tabular">{value}</span> : null}
      {label}
    </AppTag>
  );
}

export interface AppPillProps {
  children: ReactNode;
  /** Status dot before the text. The text always carries the meaning; the dot is decoration. */
  dot?: 'success' | 'muted';
}

/** White pill with a thin line, used for the survey status next to the page title. */
export function AppPill({ children, dot }: AppPillProps) {
  return (
    <span className="ih-pill">
      {dot ? <span aria-hidden="true" className={`ih-pill-dot ih-pill-dot--${dot}`} /> : null}
      {children}
    </span>
  );
}
