import Modal from 'antd/es/modal';
import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

const WIDTH: Record<ModalSize, number> = { sm: 440, md: 600, lg: 840 };

export interface AppModalProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons pinned under the content. Pass `null` for none. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Hides the title bar and the close button (command palette); the title stays as the name for screen readers. */
  bare?: boolean;
  top?: number;
  afterOpen?: () => void;
}

/** Dialog: focus trap, Esc to close and focus return come from the library; size and look from the theme. */
export function AppModal({ open, title, onClose, children, footer = null, size = 'md', bare = false, top, afterOpen }: AppModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={footer}
      width={WIDTH[size]}
      centered={top === undefined}
      style={top === undefined ? undefined : { top }}
      destroyOnHidden
      closable={!bare}
      keyboard
      afterOpenChange={(visible) => {
        if (visible) afterOpen?.();
      }}
      classNames={bare ? { header: 'ih-sr-only' } : undefined}
      styles={bare ? { container: { padding: 0, overflow: 'hidden' } } : undefined}
    >
      {children}
    </Modal>
  );
}
