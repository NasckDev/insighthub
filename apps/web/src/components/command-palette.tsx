import { THEME_KEYS, THEME_LABELS, type Theme } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Command, CornerDownLeft, FileText, Keyboard, Moon, Compass, Search, Shapes, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { clearFiltersPatch } from './filter-bar';
import { useClient } from './app-context';
import { NAV_ITEMS } from './nav-items';
import { m } from './motion';
import { applyNextTheme } from './theme-toggle';
import { personOf } from '../lib/people';

interface PaletteProps {
  surveyId: string;
  onClose: () => void;
  onShowShortcuts: () => void;
  onStartTour: () => void;
}

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  Icon: LucideIcon;
  run: () => void;
}

const MIN_QUERY_FOR_RESPONSES = 2;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Ctrl/⌘+K palette: sections, surveys, themes, actions and real response search. */
export function CommandPalette({ surveyId, onClose, onShowShortcuts, onStartTour }: PaletteProps) {
  const client = useClient();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  const surveys = useQuery({
    queryKey: ['surveys'],
    queryFn: ({ signal }) => client.listSurveys({ signal }),
  });
  const term = text.trim();
  const responses = useQuery({
    queryKey: ['palette-responses', surveyId, term],
    queryFn: ({ signal }) =>
      client.listResponses(surveyId, { q: term }, { page: 1, pageSize: 5 }, { signal }),
    enabled: term.length >= MIN_QUERY_FOR_RESPONSES,
  });

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const target = opener.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      target?.focus();
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    function go(slug: (typeof NAV_ITEMS)[number]['to'], targetSurvey = surveyId, extra: object = {}) {
      onClose();
      void navigate({ to: slug, params: { surveyId: targetSurvey }, search: extra as never });
    }
    const list: Item[] = NAV_ITEMS.map((nav) => ({
      id: `nav-${nav.slug}`,
      group: 'Ir para',
      label: nav.label,
      hint: `G ${nav.go}`,
      Icon: nav.Icon,
      run: () => go(nav.to),
    }));
    for (const survey of surveys.data ?? []) {
      list.push({
        id: `survey-${survey.id}`,
        group: 'Pesquisas',
        label: survey.title,
        hint: survey.id === surveyId ? 'Atual' : undefined,
        Icon: FileText,
        run: () => go('/s/$surveyId/visao-geral', survey.id),
      });
    }
    for (const theme of THEME_KEYS as readonly Theme[]) {
      list.push({
        id: `theme-${theme}`,
        group: 'Temas',
        label: `Tema: ${THEME_LABELS[theme]}`,
        Icon: Shapes,
        run: () => go('/s/$surveyId/temas', surveyId, { t: theme }),
      });
    }
    list.push(
      { id: 'act-theme', group: 'Ações', label: 'Alternar tema claro e escuro', hint: 'T', Icon: Moon, run: () => { applyNextTheme(); onClose(); } },
      { id: 'act-clear', group: 'Ações', label: 'Limpar todos os filtros', Icon: Search, run: () => { onClose(); void navigate({ to: '.', search: ((prev: object) => ({ ...prev, ...clearFiltersPatch() })) as never }); } },
      { id: 'act-shortcuts', group: 'Ações', label: 'Ver atalhos de teclado', hint: '?', Icon: Keyboard, run: () => { onClose(); onShowShortcuts(); } },
      { id: 'act-tour', group: 'Ações', label: 'Rever o tour de 3 passos', Icon: Compass, run: () => { onClose(); onStartTour(); } },
    );
    return list;
  }, [navigate, onClose, onShowShortcuts, onStartTour, surveyId, surveys.data]);

  const visible = useMemo<Item[]>(() => {
    const needle = normalize(term);
    const matched = needle ? items.filter((item) => normalize(`${item.label} ${item.group}`).includes(needle)) : items;
    const found: Item[] = (responses.data?.items ?? []).map((response) => ({
      id: `resp-${response.id}`,
      group: 'Respostas encontradas',
      label: response.comment,
      hint: `${personOf(response.respondentId).name} · ${response.id}`,
      Icon: Command,
      run: () => {
        onClose();
        void navigate({
          to: '/s/$surveyId/respostas',
          params: { surveyId },
          search: { q: term, r: response.id } as never,
        });
      },
    }));
    return [...matched, ...found];
  }, [items, navigate, onClose, responses.data, surveyId, term]);

  const safeCursor = Math.min(cursor, Math.max(0, visible.length - 1));
  const active = visible[safeCursor];

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((safeCursor + 1) % Math.max(1, visible.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((safeCursor - 1 + visible.length) % Math.max(1, visible.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      active?.run();
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  let lastGroup = '';
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-start justify-center p-3 pt-[10vh]"
      style={{ background: 'rgb(6 12 11 / 0.55)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16 }}
        className="flex max-h-[70dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search aria-hidden="true" size={18} className="text-muted" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
            aria-label="Buscar comandos, temas e respostas"
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
            placeholder="Digite um comando, tema ou trecho de comentário"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setCursor(0);
            }}
          />
          <kbd className="kbd max-sm:hidden">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Resultados" className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-2">
          {visible.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted" role="presentation">
              Nada encontrado para “{term}”.
            </li>
          ) : null}
          {visible.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const isActive = index === safeCursor;
            return (
              <li key={item.id} role="presentation">
                {showGroup ? <p className="eyebrow px-3 pb-1 pt-3">{item.group}</p> : null}
                <div
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? 'bg-primary-soft' : ''}`}
                  onMouseMove={() => setCursor(index)}
                  onClick={item.run}
                  onKeyDown={undefined}
                >
                  <item.Icon aria-hidden="true" size={17} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint ? <span className="shrink-0 text-xs text-muted">{item.hint}</span> : null}
                  {isActive ? <CornerDownLeft aria-hidden="true" size={14} className="shrink-0 text-muted" /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </m.div>
    </div>
  );
}
