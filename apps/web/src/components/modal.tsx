import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { m } from './motion';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** `sheet` is a right drawer on desktop and a bottom sheet on phones; `dialog` is centered. */
  variant?: 'dialog' | 'sheet';
  /** Visually hides the title when the content already has its own heading. */
  hideTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' } as const;

/** Accessible modal: focus moves in, Tab is trapped, Esc closes, focus returns to the opener. */
export function Modal({ title, onClose, children, variant = 'dialog', hideTitle, size = 'md' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
    target?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  const isSheet = variant === 'sheet';
  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-50 flex justify-center ${
        isSheet ? 'items-end sm:items-stretch sm:justify-end' : 'items-end sm:items-center sm:p-6'
      }`}
      style={{ background: 'rgb(6 12 11 / 0.55)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={isSheet ? { opacity: 0, x: 40 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`safe-bottom flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-pop)] outline-none ${
          isSheet
            ? 'rounded-t-3xl sm:max-h-none sm:max-w-lg sm:rounded-none sm:rounded-l-3xl'
            : `rounded-t-3xl sm:rounded-3xl ${SIZES[size]}`
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className={`display m-0 text-xl ${hideTitle ? 'sr-only' : ''}`}>
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-icon ml-auto"
            onClick={onClose}
            data-autofocus
            aria-label="Fechar"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </m.div>
    </div>
  );
}
