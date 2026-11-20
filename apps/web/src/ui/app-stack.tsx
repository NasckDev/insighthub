import { Typography } from 'antd';
import type { CSSProperties, ElementType, ReactNode } from 'react';

type Gap = 1 | 2 | 3 | 4 | 5;

interface FlowProps {
  children: ReactNode;
  gap?: Gap;
  className?: string;
  as?: ElementType;
  'aria-label'?: string;
  role?: string;
  /** Spacing, alignment and line breaks are all set by CSS classes that read the spacing scale. */
  align?: 'start' | 'center';
  justify?: 'between' | 'end' | 'center';
  nowrap?: boolean;
  fill?: boolean;
}

function classes(base: string, { gap = 3, className, align, justify, nowrap, fill }: Omit<FlowProps, 'children'>): string {
  return [
    base,
    `ih-gap-${gap}`,
    align === 'start' ? 'ih-start' : '',
    justify === 'between' ? 'ih-between' : justify === 'end' ? 'ih-end' : justify === 'center' ? 'ih-center' : '',
    nowrap ? 'ih-nowrap' : '',
    fill ? 'ih-fill' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Vertical flow with a gap from the spacing scale. */
export function AppStack({ children, as: Tag = 'div', ...props }: FlowProps) {
  return (
    <Tag className={classes('ih-stack', props)} aria-label={props['aria-label']} role={props.role}>
      {children}
    </Tag>
  );
}

/** Horizontal flow that wraps. */
export function AppRow({ children, as: Tag = 'div', ...props }: FlowProps) {
  return (
    <Tag className={classes('ih-row', props)} aria-label={props['aria-label']} role={props.role}>
      {children}
    </Tag>
  );
}

export interface AppGridProps {
  children: ReactNode;
  /** Columns per breakpoint; each one inherits from the smaller. */
  columns: { base?: number; sm?: number; md?: number; lg?: number };
  tight?: boolean;
  /** 12-column mode, with `AppGridItem span` at the desktop breakpoint. */
  twelve?: boolean;
  role?: string;
  'aria-label'?: string;
}

/** Responsive grid. Column counts, not pixel widths, so every screen follows the same breakpoints. */
export function AppGrid({ children, columns, tight, twelve, role, 'aria-label': ariaLabel }: AppGridProps) {
  const style = {
    '--cols-base': columns.base ?? 1,
    '--cols-sm': columns.sm,
    '--cols-md': columns.md,
    '--cols-lg': columns.lg,
  } as CSSProperties;
  return (
    <div className={['ih-grid', tight ? 'ih-grid--tight' : '', twelve ? 'ih-grid--12' : ''].filter(Boolean).join(' ')} style={style} role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function AppGridItem({ children, span, index }: { children: ReactNode; span?: 5 | 7; index?: number }) {
  return (
    <div className={[span ? `ih-span-lg-${span}` : '', index !== undefined ? 'ih-reveal' : ''].filter(Boolean).join(' ')} style={index !== undefined ? ({ '--i': Math.min(index, 10) } as CSSProperties) : { minWidth: 0 }}>
      {children}
    </div>
  );
}

/** Entry animation (rise and fade, staggered); it is off with `prefers-reduced-motion`. */
export function AppReveal({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <div className={`ih-reveal ${className ?? ''}`} style={{ '--i': Math.min(index, 10), minWidth: 0 } as CSSProperties}>
      {children}
    </div>
  );
}

export function AppEyebrow({ children }: { children: ReactNode }) {
  return <p className="ih-eyebrow">{children}</p>;
}

type TitleLevel = 1 | 2 | 3 | 4;

export interface AppTitleProps {
  level?: TitleLevel;
  children: ReactNode;
  id?: string;
  className?: string;
}

const TITLE_SIZE: Record<TitleLevel, string> = { 1: '2.5rem', 2: '1.4rem', 3: '1.15rem', 4: '1rem' };

/** Heading in the display serif. Pick the level for the outline, not for the size. */
export function AppTitle({ level = 2, children, id, className }: AppTitleProps) {
  return (
    <Typography.Title level={level} id={id} className={`ih-display ${className ?? ''}`} style={{ margin: 0, fontSize: TITLE_SIZE[level] }}>
      {children}
    </Typography.Title>
  );
}

export interface AppTextProps {
  children: ReactNode;
  tone?: 'default' | 'muted' | 'promoter' | 'passive' | 'detractor';
  strong?: boolean;
  small?: boolean;
  block?: boolean;
  tabular?: boolean;
  className?: string;
}

const TONE_COLOR: Record<NonNullable<AppTextProps['tone']>, string | undefined> = {
  default: undefined,
  muted: 'var(--ih-muted)',
  promoter: 'var(--ih-promoter)',
  passive: 'var(--ih-passive)',
  detractor: 'var(--ih-detractor)',
};

export function AppText({ children, tone = 'default', strong, small, block, tabular, className }: AppTextProps) {
  const style: CSSProperties = { color: TONE_COLOR[tone], fontSize: small ? '0.8125rem' : undefined, display: block ? 'block' : undefined };
  return (
    <Typography.Text strong={strong} className={tabular ? `ih-tabular ${className ?? ''}` : className} style={style}>
      {children}
    </Typography.Text>
  );
}

export function AppParagraph({ children, tone = 'default', small, className }: Omit<AppTextProps, 'block' | 'strong' | 'tabular'>) {
  return (
    <Typography.Paragraph className={className} style={{ margin: 0, color: TONE_COLOR[tone], fontSize: small ? '0.8125rem' : undefined }}>
      {children}
    </Typography.Paragraph>
  );
}

/** Stacked bar that shows how a total splits in parts (detractors, passives, promoters). */
export interface AppBandPart {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function AppBand({ parts, label }: { parts: readonly AppBandPart[]; label: string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div className="ih-stack ih-gap-2" style={{ width: '100%' }}>
      <div className="ih-band" role="img" aria-label={label}>
        {parts.map((part) => (
          <span key={part.key} style={{ width: `${(part.value / total) * 100}%`, background: part.color }} />
        ))}
      </div>
      <ul className="ih-legend" style={{ justifyContent: 'space-between' }}>
        {parts.map((part) => (
          <li key={part.key}>
            <i aria-hidden="true" style={{ background: part.color }} />
            {part.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Colored swatch legend for charts. */
export function AppLegend({ items, label }: { items: readonly { key: string; label: string; color: string; pattern?: string }[]; label: string }) {
  return (
    <ul className="ih-legend" aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <i aria-hidden="true" style={{ background: item.pattern ?? item.color, borderTop: item.pattern ? `3px solid ${item.color}` : undefined }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function AppKbd({ children }: { children: ReactNode }) {
  return <kbd className="ih-kbd">{children}</kbd>;
}
