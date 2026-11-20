import { MAX_SEARCH_LENGTH, THEME_LABELS } from '@insighthub/core';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../lib/format';
import { NPS_SINGULAR, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { hasActiveFilters, type SurveySearch } from '../lib/search';
import { usePatchSearch, useSurveySearch } from '../lib/use-survey-search';
import { FacetPanel, toggled } from './facet-panel';
import { Modal } from './modal';

const SEARCH_DEBOUNCE_MS = 300;

interface ActiveChip {
  key: string;
  text: string;
  remove: Partial<SurveySearch>;
}

function activeChips(search: SurveySearch): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const plan of search.plan ?? []) {
    chips.push({ key: `plan-${plan}`, text: `Plano: ${PLAN_LABELS[plan]}`, remove: { plan: toggled(search.plan, plan) } });
  }
  for (const region of search.region ?? []) {
    chips.push({ key: `region-${region}`, text: `Região: ${REGION_LABELS[region]}`, remove: { region: toggled(search.region, region) } });
  }
  for (const role of search.role ?? []) {
    chips.push({ key: `role-${role}`, text: `Função: ${ROLE_LABELS[role]}`, remove: { role: toggled(search.role, role) } });
  }
  if (search.nps) chips.push({ key: 'nps', text: `NPS: ${NPS_SINGULAR[search.nps]}`, remove: { nps: undefined } });
  if (search.theme) chips.push({ key: 'theme', text: `Tema: ${THEME_LABELS[search.theme]}`, remove: { theme: undefined } });
  if (search.from || search.to) {
    const text =
      search.from && search.to
        ? `${formatDate(search.from)} a ${formatDate(search.to)}`
        : search.from
          ? `desde ${formatDate(search.from)}`
          : `até ${formatDate(search.to as string)}`;
    chips.push({ key: 'period', text: `Período: ${text}`, remove: { from: undefined, to: undefined } });
  }
  if (search.q) chips.push({ key: 'q', text: `Busca: “${search.q}”`, remove: { q: undefined } });
  return chips;
}

const RESET: Partial<SurveySearch> = {
  plan: undefined,
  region: undefined,
  role: undefined,
  nps: undefined,
  q: undefined,
  theme: undefined,
  from: undefined,
  to: undefined,
  page: undefined,
};

export function clearFiltersPatch(): Partial<SurveySearch> {
  return RESET;
}

interface FilterBarProps {
  /** When the facets are already on screen (desktop responses page) the button is not needed. */
  facetsVisible?: boolean;
}

export function FilterBar({ facetsVisible = false }: FilterBarProps) {
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const [open, setOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chips = activeChips(search);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(change: Partial<SurveySearch>) {
    patch({ ...change, page: undefined });
  }

  function clearAll() {
    clearTimeout(timer.current);
    setResetCount((count) => count + 1);
    patch(RESET);
  }

  return (
    <section aria-label="Filtros" className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="busca-global" className="sr-only">
            Buscar nos comentários
          </label>
          <Search
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            key={resetCount}
            id="busca-global"
            type="search"
            className="field w-full pl-10"
            maxLength={MAX_SEARCH_LENGTH}
            defaultValue={search.q ?? ''}
            placeholder="Buscar nos comentários: suporte, lento, preço"
            onChange={(event) => {
              clearTimeout(timer.current);
              const value = event.target.value;
              timer.current = setTimeout(() => apply({ q: value.trim() || undefined }), SEARCH_DEBOUNCE_MS);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                clearTimeout(timer.current);
                apply({ q: event.currentTarget.value.trim() || undefined });
              }
            }}
          />
        </div>
        <button
          type="button"
          className={`btn ${facetsVisible ? 'lg:hidden' : ''}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal aria-hidden="true" size={16} />
          Filtros{chips.length > 0 ? ` (${chips.length})` : ''}
        </button>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Filtros ativos">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  className="badge cursor-pointer bg-primary-soft hover:border-primary"
                  aria-label={`Remover filtro ${chip.text}`}
                  onClick={() => {
                    if (chip.key === 'q') setResetCount((count) => count + 1);
                    apply(chip.remove);
                  }}
                >
                  {chip.text}
                  <X aria-hidden="true" size={13} />
                </button>
              </li>
            ))}
          </ul>
          {hasActiveFilters(search) ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={clearAll}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <Modal title="Filtros" onClose={() => setOpen(false)} variant="sheet">
          <FacetPanel />
          <div className="mt-5 flex gap-2">
            <button type="button" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
              Ver resultados
            </button>
            {hasActiveFilters(search) ? (
              <button type="button" className="btn" onClick={clearAll}>
                Limpar
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
