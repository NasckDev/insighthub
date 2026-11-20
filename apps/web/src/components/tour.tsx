import { tour, useTour } from '../lib/tour-store';
import { AppButton, AppCard, AppIconButton, AppParagraph, AppSteps, AppTitle, ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined, CompassOutlined } from '../ui';

export const TOUR_STEPS = [
  {
    title: 'Comece pelo Painel',
    short: 'Painel',
    body: 'O medidor mostra o NPS, o gráfico mostra a evolução e as falas em destaque dão voz ao número.',
  },
  {
    title: 'Filtre e compartilhe',
    short: 'Filtros',
    body: 'Plano, região, tema e período vão para o endereço da página. Copie o link e quem abrir vê o mesmo recorte.',
  },
  {
    title: 'Pergunte e guarde',
    short: 'Síntese',
    body: 'Na Síntese, escolha uma pergunta, leia o texto com fontes clicáveis e salve o que importa no Quadro.',
  },
] as const;

/** Discreet entry point, shown at the top of the dashboard until the tour has been seen or skipped. */
export function TourChip() {
  const { open, done } = useTour();
  if (open || done) return null;
  return (
    <div>
      <AppButton size="sm" icon={<CompassOutlined />} onClick={tour.start}>
        Fazer o tour (3 passos)
      </AppButton>
    </div>
  );
}

/** The 3-step card. Non-modal and easy to skip; it only exists once someone asked for it. */
export function Tour() {
  const { open, step } = useTour();
  if (!open) return null;
  const current = TOUR_STEPS[step] as (typeof TOUR_STEPS)[number];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <aside aria-label="Tour rápido" className="ih-tour">
      <AppCard styles={{ body: { padding: 'var(--ih-space-4)' } }} style={{ boxShadow: 'var(--ih-shadow-soft)' }}>
        <div className="ih-row ih-between ih-start ih-gap-2 ih-nowrap">
          <div className="ih-fill">
            <p className="ih-eyebrow">
              Passo {step + 1} de {TOUR_STEPS.length}
            </p>
            <AppTitle level={3}>{current.title}</AppTitle>
          </div>
          <AppIconButton label="Pular o tour" icon={<CloseOutlined />} onClick={tour.finish} />
        </div>
        <div style={{ margin: 'var(--ih-space-3) 0' }}>
          <AppParagraph tone="muted" small>
            {current.body}
          </AppParagraph>
        </div>
        <AppSteps current={step} items={TOUR_STEPS.map((item) => ({ title: item.short }))} />
        <div className="ih-row ih-between ih-gap-2" style={{ marginTop: 'var(--ih-space-3)' }}>
          <AppButton size="sm" icon={<ArrowLeftOutlined />} disabled={step === 0} onClick={() => tour.goTo(step - 1)}>
            Voltar
          </AppButton>
          <AppButton size="sm" variant="primary" onClick={() => (isLast ? tour.finish() : tour.goTo(step + 1))}>
            {isLast ? 'Concluir' : 'Próximo'}
            {isLast ? null : <ArrowRightOutlined aria-hidden="true" />}
          </AppButton>
        </div>
      </AppCard>
    </aside>
  );
}
