import { AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
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

const DEFAULT_DURATION_MS = 5000;
const ICONS = { success: CheckCircle2, info: Info, error: TriangleAlert } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { ...input, id, kind: input.kind ?? 'success' }]);
      setTimeout(() => dismiss(id), input.durationMs ?? DEFAULT_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        <div aria-live="polite" className="contents">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Icon = ICONS[item.kind];
              return (
                <m.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-[var(--shadow-pop)]"
                >
                  <Icon
                    aria-hidden="true"
                    size={20}
                    className={item.kind === 'error' ? 'text-detractor' : 'text-promoter'}
                  />
                  <span className="min-w-0 flex-1">{item.message}</span>
                  {item.action ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost font-bold text-promoter"
                      onClick={() => {
                        item.action?.onClick();
                        dismiss(item.id);
                      }}
                    >
                      {item.action.label}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-ghost"
                    aria-label="Fechar aviso"
                    onClick={() => dismiss(item.id)}
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (toast: ToastInput) => void {
  const push = useContext(ToastContext);
  if (!push) throw new Error('useToast must be used inside <ToastProvider>');
  return push;
}
