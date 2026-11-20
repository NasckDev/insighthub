import { AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { m } from './motion';

type ToastKind = 'success' | 'info' | 'error';

interface ToastInput {
  message: string;
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const DEFAULT_DURATION_MS = 6000;
const ICONS = { success: CheckCircle2, info: Info, error: TriangleAlert } as const;
const MAX_VISIBLE = 3;

interface ToastViewProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

/**
 * One toast. Its timer is cleaned up on unmount and paused while the pointer or the keyboard focus
 * is on it, so nobody loses the "Desfazer" button while reaching for it (WCAG 2.2.1).
 */
function ToastView({ item, onDismiss }: ToastViewProps) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.durationMs ?? DEFAULT_DURATION_MS);
  const Icon = ICONS[item.kind];

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, item.id, onDismiss]);

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-[var(--shadow-pop)]"
    >
      <Icon aria-hidden="true" size={20} className={item.kind === 'error' ? 'text-detractor' : 'text-promoter'} />
      <span className="min-w-0 flex-1">{item.message}</span>
      {item.action ? (
        <button
          type="button"
          className="btn btn-sm btn-ghost font-bold text-promoter"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="btn btn-sm btn-icon btn-ghost"
        aria-label="Fechar aviso"
        onClick={() => onDismiss(item.id)}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </m.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...input, id, kind: input.kind ?? 'success' }]);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          role="region"
          aria-label="Notificações"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
        >
          <div aria-live="polite" className="contents">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <ToastView key={item.id} item={item} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): (toast: ToastInput) => void {
  const push = useContext(ToastContext);
  if (!push) throw new Error('useToast must be used inside <ToastProvider>');
  return push;
}
