import Card from 'antd/es/card';
import type { CardProps } from 'antd';
import type { ReactNode } from 'react';

export interface AppCardProps extends Omit<CardProps, 'variant' | 'size' | 'bordered'> {
  /** `flat` drops the border (cards inside a card, list rows). */
  appearance?: 'outlined' | 'flat';
  fullHeight?: boolean;
  children?: ReactNode;
  role?: string;
  'aria-label'?: string;
  'data-editing'?: string;
}

/** Card with thin lines and no heavy shadow, the editorial look of InsightHub. */
export function AppCard({ appearance = 'outlined', fullHeight = false, className, ...rest }: AppCardProps) {
  const classes = ['ih-card-flat', fullHeight ? 'ih-fill-height' : '', className ?? ''].filter(Boolean).join(' ');
  return <Card variant={appearance === 'flat' ? 'borderless' : 'outlined'} className={classes} {...rest} />;
}
