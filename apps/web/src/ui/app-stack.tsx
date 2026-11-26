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

const HEADING = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' } as const;

/** Heading in the display serif. Pick the level for the outline, not for the size (`ih-title-N` sets the size). */
export function AppTitle({ level = 2, children, id, className }: AppTitleProps) {
  const Tag = HEADING[level];
  return (
    <Tag id={id} className={`ih-display ih-title ih-title-${level} ${className ?? ''}`}>
      {children}
    </Tag>
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

function textClasses({ tone = 'default', strong, small, block, tabular, className }: AppTextProps): string {
  return ['ih-text', `ih-tone-${tone}`, strong ? 'ih-strong' : '', small ? 'ih-small' : '', block ? 'ih-block' : '', tabular ? 'ih-tabular' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}

export function AppText(props: AppTextProps) {
  return <span className={textClasses(props)}>{props.children}</span>;
}

export function AppParagraph(props: Omit<AppTextProps, 'block' | 'strong' | 'tabular'>) {
  return <p className={`${textClasses(props)} ih-paragraph`}>{props.children}</p>;
}

/** Stacked bar that shows how a total splits in parts (detractors, passives, promoters). */
export interface AppBandPart {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface AppBandProps {
  parts: readonly AppBandPart[];
  label: string;
  /** Hide the swatch legend when the numbers are already written next to the band. */
  legend?: boolean;
}

/** Segments keep 3 px apart, so mist and coral read as separate parts even side by side. */
export function AppBand({ parts, label, legend = true }: AppBandProps) {
  const visible = parts.filter((part) => part.value > 0);
  return (
    <div className="ih-stack ih-gap-2" style={{ width: '100%' }}>
      <div className="ih-band" role="img" aria-label={label}>
        {visible.map((part) => (
          <span key={part.key} style={{ flexGrow: part.value, background: part.color }} />
        ))}
      </div>
      {legend ? (
        <ul className="ih-legend" style={{ justifyContent: 'space-between' }}>
          {parts.map((part) => (
            <li key={part.key}>
              <i aria-hidden="true" style={{ background: part.color }} />
              {part.label}
            </li>
          ))}
        </ul>
      ) : null}
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
