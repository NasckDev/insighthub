import Drawer from 'antd/es/drawer';
import type { ReactNode } from 'react';
import { useIsPhone } from './theme';

export interface AppDrawerProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Pinned under the scrolling content, so the main action is never below the fold. */
  footer?: ReactNode;
  /** `end` is a right panel on desktop and becomes a bottom sheet on phones. `start` stays on the left. */
  placement?: 'end' | 'start';
  /** Width of the panel on desktop. */
  width?: number;
}

const DEFAULT_WIDTH = 440;
const SHEET_HEIGHT = '88dvh';

/** Side panel on desktop, bottom sheet on phones. */
export function AppDrawer({ open, title, onClose, children, footer, placement = 'end', width = DEFAULT_WIDTH }: AppDrawerProps) {
  const phone = useIsPhone();
  const asSheet = phone && placement === 'end';
  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      footer={footer}
      placement={asSheet ? 'bottom' : placement === 'end' ? 'right' : 'left'}
      size={asSheet ? SHEET_HEIGHT : width}
      destroyOnHidden
      keyboard
      styles={{ body: { paddingBlock: 'var(--ih-space-4)' } }}
    >
      {children}
    </Drawer>
  );
}
