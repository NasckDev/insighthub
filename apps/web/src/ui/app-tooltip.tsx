import Tooltip from 'antd/es/tooltip';
import type { ReactElement, ReactNode } from 'react';

export interface AppTooltipProps {
  title: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/** Hint on hover and keyboard focus. Never the only place for essential information. */
export function AppTooltip({ title, children, placement = 'top' }: AppTooltipProps) {
  return (
    <Tooltip title={title} placement={placement}>
      {children}
    </Tooltip>
  );
}
