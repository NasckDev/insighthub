import { THEME_KEYS, THEME_LABELS, type Theme } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { personOf } from '../lib/people';
import {
  ApiOutlined,
  AppKbd,
  AppModal,
  AppText,
  ApartmentOutlined,
  CompassOutlined,
  FileMarkdownOutlined,
  MessageOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  applyNextTheme,
} from '../ui';
import { useClient } from './app-context';
import { useConnection } from './connection';
import { clearFiltersPatch } from './filter-bar';
import { NAV_ITEMS } from './nav-items';

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
  icon: ReactNode;
  run: () => void;
}

const MIN_QUERY_FOR_RESPONSES = 2;
const PALETTE_TOP = 96;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Ctrl/⌘+K palette: sections, surveys, themes, actions and real response search. */
export function CommandPalette({ surveyId, onClose, onShowShortcuts, onStartTour }: PaletteProps) {
  const client = useClient();
  const navigate = useNavigate();
  const connection = useConnection();
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const surveys = useQuery({
    queryKey: ['surveys'],
    queryFn: ({ signal }) => client.listSurveys({ signal }),
  });
  const term = text.trim();
  const responses = useQuery({
    queryKey: ['palette-responses', surveyId, term],
    queryFn: ({ signal }) => client.listResponses(surveyId, { q: term }, { page: 1, pageSize: 5 }, { signal }),
    enabled: term.length >= MIN_QUERY_FOR_RESPONSES,
  });

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
      icon: nav.icon,
      run: () => go(nav.to),
    }));
    for (const survey of surveys.data ?? []) {
      list.push({
        id: `survey-${survey.id}`,
        group: 'Pesquisas',
        label: survey.title,
        hint: survey.id === surveyId ? 'Atual' : undefined,
        icon: <FileMarkdownOutlined />,
        run: () => go('/s/$surveyId/visao-geral', survey.id),
      });
    }
    for (const theme of THEME_KEYS as readonly Theme[]) {
      list.push({
        id: `theme-${theme}`,
        group: 'Temas',
        label: `Tema: ${THEME_LABELS[theme]}`,
        icon: <ApartmentOutlined />,
        run: () => go('/s/$surveyId/temas', surveyId, { t: theme }),
      });
    }
    list.push(
      { id: 'act-theme', group: 'Ações', label: 'Alternar tema claro e escuro', hint: 'T', icon: <MoonOutlined />, run: () => { applyNextTheme(); onClose(); } },
      {
        id: 'act-clear',
        group: 'Ações',
        label: 'Limpar todos os filtros',
        icon: <SearchOutlined />,
        run: () => {
          onClose();
          void navigate({ to: '.', search: ((prev: object) => ({ ...prev, ...clearFiltersPatch() })) as never });
        },
      },
      { id: 'act-shortcuts', group: 'Ações', label: 'Ver atalhos de teclado', hint: '?', icon: <QuestionCircleOutlined />, run: () => { onClose(); onShowShortcuts(); } },
      { id: 'act-connect', group: 'Ações', label: connection.mode === 'http' ? 'Gerenciar a conexão com a API' : 'Conectar à API', icon: <ApiOutlined />, run: () => { onClose(); connection.openDialog(); } },
      { id: 'act-tour', group: 'Ações', label: 'Rever o tour de 3 passos', icon: <CompassOutlined />, run: () => { onClose(); onStartTour(); } },
    );
    return list;
  }, [connection, navigate, onClose, onShowShortcuts, onStartTour, surveyId, surveys.data]);

  const visible = useMemo<Item[]>(() => {
    const needle = normalize(term);
    const matched = needle ? items.filter((item) => normalize(`${item.label} ${item.group}`).includes(needle)) : items;
    const found: Item[] = (responses.data?.items ?? []).map((response) => ({
      id: `resp-${response.id}`,
      group: 'Respostas encontradas',
      label: response.comment,
      hint: `${personOf(response.respondentId).name} · ${response.id}`,
      icon: <MessageOutlined />,
      run: () => {
        onClose();
        void navigate({ to: '/s/$surveyId/respostas', params: { surveyId }, search: { q: term, r: response.id } as never });
      },
    }));
    return [...matched, ...found];
  }, [items, navigate, onClose, responses.data, surveyId, term]);

  const safeCursor = Math.min(cursor, Math.max(0, visible.length - 1));
  const active = visible[safeCursor];

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
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
    <AppModal open title="Paleta de comandos" onClose={onClose} bare top={PALETTE_TOP} afterOpen={() => inputRef.current?.focus()}>
      {/* The dialog owns the arrow/Enter keys of its combobox, so the handler lives on this wrapper. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div onKeyDown={onKeyDown} className="ih-palette">
        <div className="ih-palette-search">
          <SearchOutlined aria-hidden="true" />
          <input
            ref={(node) => {
              inputRef.current = node;
              node?.focus();
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
            aria-label="Buscar comandos, temas e respostas"
            placeholder="Digite um comando, tema ou trecho de comentário"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setCursor(0);
            }}
          />
          <AppKbd>Esc</AppKbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Resultados" className="ih-palette-list">
          {visible.length === 0 ? (
            <li role="presentation" className="ih-palette-empty">
              Nada encontrado para “{term}”.
            </li>
          ) : null}
          {visible.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const isActive = index === safeCursor;
            return (
              <li key={item.id} role="presentation">
                {showGroup ? <p className="ih-eyebrow ih-palette-group">{item.group}</p> : null}
                <div
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  className={`ih-palette-option${isActive ? ' is-active' : ''}`}
                  onMouseMove={() => setCursor(index)}
                  onClick={item.run}
                  onKeyDown={undefined}
                >
                  <span aria-hidden="true" className="ih-muted">
                    {item.icon}
                  </span>
                  <span className="ih-palette-label">{item.label}</span>
                  {item.hint ? <AppText tone="muted" small>{item.hint}</AppText> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppModal>
  );
}
