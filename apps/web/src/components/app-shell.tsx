import { Link, Outlet, useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFaultMode, type FaultController, type FaultMode } from '../data';
import { DEFAULT_SURVEY_ID } from '../lib/constants';
import { GO_TARGETS, isTypingTarget, type GoKey } from '../lib/shortcuts';
import { tour } from '../lib/tour-store';
import { useOnDemand } from '../lib/use-on-demand';
import {
  ApiOutlined,
  AppButton,
  AppIconButton,
  AppKbd,
  AppLayout,
  AppLayoutBody,
  AppLayoutContent,
  AppLayoutHeader,
  AppSideNav,
  AppSelect,
  AppSider,
  AppStack,
  CompassOutlined,
  MenuOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SunOutlined,
  applyNextTheme,
  useIsDesktop,
  useThemeMode,
} from '../ui';
import { useClient } from './app-context';
import { useConnection } from './connection';
import { AccountButton } from './account-button';
import { Logo, LogoMark } from './logo';
import { NAV_ITEMS, PAGE_TITLES, type NavItem } from './nav-items';

// Opened on demand, so they stay out of the first-paint bundle.
const loadPalette = () => import('./command-palette');
const loadShortcuts = () => import('./shortcuts-modal');
const loadTour = () => import('./tour');
const loadMobileMenu = () => import('./mobile-menu');
// The account menu (Dropdown) loads right after the first paint; a plain button holds its place.
const loadAccountMenu = () => import('./account-menu');

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
    <span className="ih-row ih-gap-2 ih-nowrap">
      <span id="simular-label">Simular</span>
      <AppSelect<FaultMode> size="sm" aria-labelledby="simular-label" value={mode} options={FAULT_OPTIONS} onChange={(value) => controller.setMode(value)} popupMatchSelectWidth={false} />
    </span>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const connection = useConnection();
  const desktop = useIsDesktop();
  const mode = useThemeMode();
  const chord = useRef<{ key: string; at: number } | null>(null);

  const palette = useOnDemand(loadPalette, paletteOpen);
  const shortcuts = useOnDemand(loadShortcuts, helpOpen);
  const tourModule = useOnDemand(loadTour, true);
  const mobileMenu = useOnDemand(loadMobileMenu, menuOpen && !desktop);
  const accountMenu = useOnDemand(loadAccountMenu, true);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const showShortcuts = useCallback(() => setHelpOpen(true), []);
  const startTour = useCallback(() => tour.start(), []);
  const section = (pathname.split('/').pop() ?? '') as NavItem['slug'];

  useEffect(() => {
    const title = PAGE_TITLES[section];
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
      if (document.querySelector('[role="dialog"]') || document.querySelector('[data-editing="true"]')) return;
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

  const navLabel = (item: NavItem, withKey: boolean): ReactNode => (
    <Link to={item.to} params={{ surveyId }} search={carryFilters} onClick={() => setMenuOpen(false)} aria-current={section === item.slug ? 'page' : undefined}>
      {item.label}
      {withKey ? (
        <span aria-hidden="true" className="ih-menu-key">
          G {item.go}
        </span>
      ) : null}
    </Link>
  );
  const menuItems = (withKey: boolean) => NAV_ITEMS.map((item) => ({ key: item.slug, icon: item.icon, label: navLabel(item, withKey) }));

  const connectLabel = connection.mode === 'http' ? 'API conectada' : 'Conectar à API';
  const accountItems = [
    { key: 'connect', label: connectLabel, icon: <ApiOutlined />, onClick: connection.openDialog },
    { key: 'shortcuts', label: 'Atalhos de teclado', icon: <QuestionCircleOutlined />, onClick: () => setHelpOpen(true) },
    { key: 'tour', label: 'Rever o tour', icon: <CompassOutlined />, onClick: startTour },
  ];

  return (
    <AppLayout hasSider={desktop}>
      <a
        className="ih-skip-link"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>

      {desktop ? (
        <AppSider collapsed={collapsed} onCollapse={setCollapsed}>
          <div className="ih-sider-inner">
            <Link to="/" aria-label="InsightHub, início" style={{ padding: 'var(--ih-space-2)' }}>
              <Logo collapsed={collapsed} />
            </Link>
            <nav aria-label="Principal">
              <AppSideNav aria-label="Seções" items={menuItems(true)} selectedKey={section} collapsed={collapsed} />
            </nav>
            <div className="ih-sider-spacer" />
            <AppStack gap={1}>
              <AppButton variant="ghost" block icon={<ApiOutlined />} onClick={connection.openDialog} aria-label={collapsed ? connectLabel : undefined}>
                {collapsed ? null : connectLabel}
              </AppButton>
              <AppButton variant="ghost" block icon={<MenuOutlined />} onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expandir o menu' : undefined}>
                {collapsed ? null : 'Recolher menu'}
              </AppButton>
            </AppStack>
          </div>
        </AppSider>
      ) : null}

      <AppLayoutBody>
        {client.kind === 'demo' ? (
          <div role="region" aria-label="Aviso de demonstração" className="ih-banner">
            <span>
              <strong>Demo com dados fictícios</strong>
              <span className="ih-hide-phone"> · produto inventado “Atlas Analytics”, tudo roda no seu navegador</span>
            </span>
            {faults ? (
              <span className="ih-hide-phone">
                <FaultSimulator controller={faults} />
              </span>
            ) : null}
          </div>
        ) : null}

        <AppLayoutHeader>
          {desktop ? null : (
            <>
              <AppIconButton label="Abrir o menu" icon={<MenuOutlined />} onClick={() => setMenuOpen(true)} />
              <Link to="/" aria-label="InsightHub, início" className="ih-logo">
                <LogoMark size={30} />
              </Link>
            </>
          )}
          <AppButton variant="ghost" className="ih-header-search" icon={<SearchOutlined />} onClick={() => setPaletteOpen(true)}>
            <span className="ih-phone-sr-only">Buscar</span>
            <span className="ih-hide-phone ih-menu-key">
              <AppKbd>Ctrl K</AppKbd>
            </span>
          </AppButton>
          <div className="ih-fill" />
          <AppIconButton
            label={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            aria-pressed={mode === 'dark'}
            icon={mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}
            onClick={() => applyNextTheme()}
          />
          {accountMenu ? <accountMenu.default items={accountItems} /> : <AccountButton />}
        </AppLayoutHeader>

        <AppLayoutContent id="conteudo" contentRef={mainRef}>
          <Outlet />
          <footer className="ih-footer-note">
            Projeto pessoal de portfólio. Todos os dados desta demo são fictícios e gerados de forma determinística.
          </footer>
        </AppLayoutContent>
      </AppLayoutBody>

      {desktop ? null : (
        <nav aria-label="Navegação móvel" className="ih-bottom-bar">
          <ul>
            {NAV_ITEMS.filter((item) => MOBILE_PRIMARY.includes(item.slug)).map((item) => (
              <li key={item.slug}>
                <Link to={item.to} params={{ surveyId }} search={carryFilters} aria-current={section === item.slug ? 'page' : undefined}>
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
                <MenuOutlined aria-hidden="true" />
                Mais
              </button>
            </li>
          </ul>
        </nav>
      )}

      {menuOpen && !desktop && mobileMenu ? (
        <mobileMenu.default
          items={menuItems(false)}
          section={section}
          connectLabel={connectLabel}
          onClose={() => setMenuOpen(false)}
          onShortcuts={() => setHelpOpen(true)}
          onTour={startTour}
          onPalette={() => setPaletteOpen(true)}
          onConnect={connection.openDialog}
        />
      ) : null}

      {paletteOpen && palette ? (
        <palette.CommandPalette surveyId={surveyId} onClose={closePalette} onShowShortcuts={showShortcuts} onStartTour={startTour} />
      ) : null}
      {helpOpen && shortcuts ? <shortcuts.ShortcutsModal onClose={() => setHelpOpen(false)} /> : null}
      {tourModule ? <tourModule.Tour /> : null}
    </AppLayout>
  );
}
