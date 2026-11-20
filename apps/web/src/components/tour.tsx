import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { tour, useTour } from '../lib/tour-store';
import { m } from './motion';

export const TOUR_STEPS = [
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

/** Discreet entry point, shown at the top of the dashboard until the tour has been seen or skipped. */
export function TourChip() {
  const { open, done } = useTour();
  if (open || done) return null;
  return (
    <button type="button" className="btn btn-sm self-start" onClick={tour.start}>
      <Compass aria-hidden="true" size={15} />
      Fazer o tour (3 passos)
    </button>
  );
}

/** The 3-step card. Non-modal and easy to skip; it only exists once someone asked for it. */
export function Tour() {
  const { open, step } = useTour();
  if (!open) return null;
  const current = TOUR_STEPS[step] as (typeof TOUR_STEPS)[number];
  const isLast = step === TOUR_STEPS.length - 1;

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
            Passo {step + 1} de {TOUR_STEPS.length}
          </p>
          <h2 className="display m-0 text-lg">{current.title}</h2>
          <p className="m-0 mt-1 text-sm text-muted">{current.body}</p>
        </div>
        <button type="button" className="btn btn-sm btn-icon btn-ghost" aria-label="Pular o tour" onClick={tour.finish}>
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className="btn btn-sm" disabled={step === 0} onClick={() => tour.goTo(step - 1)}>
          <ArrowLeft aria-hidden="true" size={14} />
          Voltar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => (isLast ? tour.finish() : tour.goTo(step + 1))}
        >
          {isLast ? 'Concluir' : 'Próximo'}
          {isLast ? null : <ArrowRight aria-hidden="true" size={14} />}
        </button>
      </div>
    </m.aside>
  );
}
