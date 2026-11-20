import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { m } from './motion';

const STORAGE_KEY = 'insighthub-tour';
const SHOW_DELAY_MS = 2500;

const STEPS = [
  {
    title: 'Comece pelo Painel',
    body: 'O medidor mostra o NPS, o gráfico mostra a evolução e as falas em destaque dão voz ao número.',
  },
  {
    title: 'Filtre e compartilhe',
    body: 'Plano, região, tema e período vão para o endereço da página. Copie o link e quem abrir vê o mesmo recorte.',
  },
  {
    title: 'Pergunte e guarde',
    body: 'Na Síntese, escolha uma pergunta, leia o texto com fontes clicáveis e salve o que importa no Quadro.',
  },
] as const;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    // Blocked storage: the tour will simply show again next visit.
  }
}

interface TourProps {
  /** Incremented to reopen the tour on demand (palette or menu). */
  openSignal: number;
}

/** Optional 3-step tour: a small card, never blocking, easy to skip. */
export function Tour({ openSignal }: TourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (wasDismissed()) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Reopen on demand: adjusting state while rendering is the supported way to react to a changed prop.
  const [seenSignal, setSeenSignal] = useState(openSignal);
  if (openSignal !== seenSignal) {
    setSeenSignal(openSignal);
    setStep(0);
    setVisible(true);
  }

  if (!visible) return null;
  const current = STEPS[step] as (typeof STEPS)[number];
  const isLast = step === STEPS.length - 1;

  function close() {
    remember();
    setVisible(false);
  }

  return (
    <m.aside
      aria-label="Tour rápido"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)] sm:left-auto sm:right-6 sm:w-80 lg:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-promoter">
          <Compass aria-hidden="true" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Passo {step + 1} de {STEPS.length}
          </p>
          <h2 className="display m-0 text-lg">{current.title}</h2>
          <p className="m-0 mt-1 text-sm text-muted">{current.body}</p>
        </div>
        <button type="button" className="btn btn-sm btn-icon btn-ghost" aria-label="Pular o tour" onClick={close}>
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className="btn btn-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft aria-hidden="true" size={14} />
          Voltar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => (isLast ? close() : setStep(step + 1))}
        >
          {isLast ? 'Concluir' : 'Próximo'}
          {isLast ? null : <ArrowRight aria-hidden="true" size={14} />}
        </button>
      </div>
    </m.aside>
  );
}
