import { Link, Outlet, useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import { Command, Compass, Ellipsis, Keyboard, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SURVEY_ID } from '../lib/constants';
import { GO_TARGETS, isTypingTarget, type GoKey } from '../lib/shortcuts';
import { useFaultMode, type FaultController, type FaultMode } from '../data';
import { useClient } from './app-context';
import { CommandPalette } from './command-palette';
import { Logo, LogoMark } from './logo';
import { Modal } from './modal';
import { PageTransition } from './motion';
import { NAV_ITEMS, PAGE_TITLES, type NavItem } from './nav-items';
import { ShortcutsModal } from './shortcuts-modal';
import { applyNextTheme, ThemeToggle } from './theme-toggle';
import { Tour } from './tour';

const FAULT_OPTIONS: { value: FaultMode; label: string }[] = [
  { value: 'none', label: 'Tudo normal' },
  { value: 'fail-next', label: 'Falhar a próxima chamada' },
  { value: 'partial', label: 'Respostas parciais' },
];

const CHORD_WINDOW_MS = 1200;
const MOBILE_PRIMARY: readonly NavItem['slug'][] = ['visao-geral', 'respostas', 'temas', 'sintese'];

function FaultSimulator({ controller }: { controller: FaultController }) {
  const mode = useFaultMode(controller);
  return (
    <label className="flex items-center gap-2 text-xs">
      <span>Simular</span>
      <select
        className="rounded-md border px-2 py-0.5 text-xs"
        style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor' }}
        value={mode}
        onChange={(event) => controller.setMode(event.target.value as FaultMode)}
      >
        {FAULT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#1b1b3a' }}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Keeps filters when moving between sections, but drops section-specific state. */
function carryFilters(previous: object): never {
  return { ...previous, page: undefined, r: undefined, t: undefined, tpl: undefined, share: undefined } as never;
}

export function AppShell() {
  const client = useClient();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const params = useParams({ strict: false }) as { surveyId?: string };
  const surveyId = params.surveyId ?? DEFAULT_SURVEY_ID;
  const firstRender = useRef(true);
  const faults = 'faults' in client ? (client.faults as FaultController) : null;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tourSignal, setTourSignal] = useState(0);
  const chord = useRef<{ key: string; at: number } | null>(null);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const showShortcuts = useCallback(() => setHelpOpen(true), []);
  const startTour = useCallback(() => setTourSignal((value) => value + 1), []);
  const section = pathname.split('/').pop() ?? '';

  useEffect(() => {
    const title = PAGE_TITLES[section as NavItem['slug']];
    document.title = title ? `${title} · InsightHub` : 'InsightHub';
    // Move focus to the content after a navigation so keyboard and screen reader users land on the new screen.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname, section]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = event.key.toLowerCase();
      const pending = chord.current;
      chord.current = null;
      if (pending && Date.now() - pending.at < CHORD_WINDOW_MS && key in GO_TARGETS) {
        event.preventDefault();
        const slug = GO_TARGETS[key as GoKey];
        const target = NAV_ITEMS.find((item) => item.slug === slug);
        if (target) void navigate({ to: target.to, params: { surveyId }, search: carryFilters });
        return;
      }
      if (key === 'g') chord.current = { key, at: Date.now() };
      else if (event.key === '?') {
        event.preventDefault();
        setHelpOpen(true);
      } else if (key === '/') {
        const field = document.getElementById('busca-global');
        if (field) {
          event.preventDefault();
          field.focus();
        }
      } else if (key === 't') applyNextTheme();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate, surveyId]);

  const navLink = (item: NavItem, className: string, activeClass: string, children: React.ReactNode) => (
    <Link
      key={item.slug}
      to={item.to}
      params={{ surveyId }}
      search={carryFilters}
      className={className}
      activeProps={{ className: activeClass }}
      onClick={() => setMoreOpen(false)}
    >
      {children}
    </Link>
  );

  const secondary = NAV_ITEMS.filter((item) => !MOBILE_PRIMARY.includes(item.slug));

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
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1 text-xs lg:pl-[272px]"
          style={{ background: 'var(--banner-bg)', color: 'var(--banner-fg)' }}
        >
          <span>
            <strong>Demo com dados fictícios</strong>
            <span className="max-sm:sr-only"> · produto inventado “Atlas Analytics”, tudo roda no seu navegador</span>
          </span>
          {faults ? <FaultSimulator controller={faults} /> : null}
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-5 lg:flex" style={{ top: client.kind === 'demo' ? 28 : 0 }}>
        <Link to="/" className="mb-6 px-2 no-underline" aria-label="InsightHub, início">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) =>
            navLink(
              item,
              'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted no-underline transition-colors hover:bg-surface-2 hover:text-fg',
              'bg-primary-soft text-fg!',
              <>
                <item.Icon aria-hidden="true" size={19} />
                <span className="flex-1">{item.label}</span>
                <kbd className="kbd opacity-70">G {item.go}</kbd>
              </>,
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button type="button" className="btn justify-between text-muted" onClick={() => setPaletteOpen(true)}>
            <span className="flex items-center gap-2">
              <Search aria-hidden="true" size={16} />
              Buscar
            </span>
            <kbd className="kbd">Ctrl K</kbd>
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn btn-sm flex-1" onClick={() => setHelpOpen(true)}>
              <Keyboard aria-hidden="true" size={15} />
              Atalhos
            </button>
            <ThemeToggle showLabel={false} />
            <button type="button" className="btn btn-sm btn-icon" aria-label="Rever o tour" onClick={startTour}>
              <Compass aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line px-4 py-2 lg:hidden">
          <Link to="/" className="flex items-center gap-2 no-underline" aria-label="InsightHub, início">
            <LogoMark size={30} />
            <span className="display text-lg text-fg">InsightHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-sm btn-icon" aria-label="Buscar comandos" onClick={() => setPaletteOpen(true)}>
              <Search aria-hidden="true" size={17} />
            </button>
            <ThemeToggle showLabel={false} />
          </div>
        </header>
        <main
          id="conteudo"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8"
        >
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
          <footer className="mt-10 border-t border-line pt-4 text-xs text-muted">
            Projeto pessoal de portfólio. Todos os dados desta demo são fictícios e gerados de forma determinística.
          </footer>
        </main>
      </div>

      <nav
        aria-label="Navegação móvel"
        className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"
      >
        <ul className="m-0 grid list-none grid-cols-5 p-0">
          {NAV_ITEMS.filter((item) => MOBILE_PRIMARY.includes(item.slug)).map((item) => (
            <li key={item.slug}>
              {navLink(
                item,
                'flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold text-muted no-underline',
                'text-fg! [&_svg]:text-promoter',
                <>
                  <item.Icon aria-hidden="true" size={22} />
                  {item.label}
                </>,
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              className="flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 border-0 bg-transparent text-[11.5px] font-semibold text-muted"
              onClick={() => setMoreOpen(true)}
            >
              <Ellipsis aria-hidden="true" size={22} />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <Modal title="Mais opções" onClose={() => setMoreOpen(false)}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {secondary.map((item) => (
              <li key={item.slug}>
                {navLink(
                  item,
                  'flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold no-underline hover:bg-surface-2',
                  'bg-primary-soft',
                  <>
                    <item.Icon aria-hidden="true" size={20} />
                    {item.label}
                  </>,
                )}
              </li>
            ))}
            <li>
              <button type="button" className="btn btn-ghost w-full justify-start gap-3" onClick={() => { setMoreOpen(false); setHelpOpen(true); }}>
                <Keyboard aria-hidden="true" size={20} />
                Atalhos de teclado
              </button>
            </li>
            <li>
              <button type="button" className="btn btn-ghost w-full justify-start gap-3" onClick={() => { setMoreOpen(false); startTour(); }}>
                <Compass aria-hidden="true" size={20} />
                Rever o tour
              </button>
            </li>
            <li>
              <button type="button" className="btn btn-ghost w-full justify-start gap-3" onClick={() => { setMoreOpen(false); setPaletteOpen(true); }}>
                <Command aria-hidden="true" size={20} />
                Paleta de comandos
              </button>
            </li>
          </ul>
        </Modal>
      ) : null}

      {paletteOpen ? (
        <CommandPalette surveyId={surveyId} onClose={closePalette} onShowShortcuts={showShortcuts} onStartTour={startTour} />
      ) : null}
      {helpOpen ? <ShortcutsModal onClose={() => setHelpOpen(false)} /> : null}
      <Tour openSignal={tourSignal} />
    </>
  );
}
