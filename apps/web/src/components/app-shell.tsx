import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useFaultMode, type FaultController, type FaultMode } from '../data';
import { useClient } from './app-context';
import { ThemeToggle } from './theme-toggle';

const FAULT_OPTIONS: { value: FaultMode; label: string }[] = [
  { value: 'none', label: 'Tudo normal' },
  { value: 'fail-next', label: 'Falhar a próxima chamada' },
  { value: 'partial', label: 'Respostas parciais' },
];

const SECTION_TITLES: Record<string, string> = {
  'visao-geral': 'Visão geral',
  respostas: 'Respostas',
  comparar: 'Comparar segmentos',
  sintese: 'Síntese',
};

function FaultSimulator({ controller }: { controller: FaultController }) {
  const mode = useFaultMode(controller);
  return (
    <label className="flex items-center gap-2 text-xs">
      <span>Simular</span>
      <select
        className="rounded-md border px-2 py-1 text-xs"
        style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor' }}
        value={mode}
        onChange={(event) => controller.setMode(event.target.value as FaultMode)}
      >
        {FAULT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#151a24' }}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppShell() {
  const client = useClient();
  const mainRef = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const firstRender = useRef(true);
  const faults = 'faults' in client ? (client.faults as FaultController) : null;

  useEffect(() => {
    const section = SECTION_TITLES[pathname.split('/').pop() ?? ''];
    document.title = section ? `${section} · InsightHub` : 'InsightHub';
    // Move focus to the content after a navigation so keyboard and screen reader users land on the new screen.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <>
      <a
        className="skip-link"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      {client.kind === 'demo' ? (
        <div
          role="region"
          aria-label="Aviso de demonstração"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1 text-xs sm:py-1.5"
          style={{ background: 'var(--banner-bg)', color: 'var(--banner-fg)' }}
        >
          <span>
            <strong>Demo com dados fictícios</strong>
            <span className="max-sm:sr-only">
              {' '}
              · produto inventado “Atlas Analytics”, tudo roda no seu navegador
            </span>
          </span>
          {faults ? <FaultSimulator controller={faults} /> : null}
        </div>
      ) : null}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-fg no-underline">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-fg"
            >
              IH
            </span>
            InsightHub
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="conteudo" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-5">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
        Projeto pessoal de portfólio. Todos os dados desta demo são fictícios e gerados de forma
        determinística.
      </footer>
    </>
  );
}
