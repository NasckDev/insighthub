import {
  NPS_CATEGORIES,
  PLANS,
  REGIONS,
  ROLES,
  MAX_SEARCH_LENGTH,
  type NpsCategory,
  type Plan,
  type Region,
  type Role,
} from '@insighthub/core';
import { useEffect, useId, useRef, useState } from 'react';
import { NPS_LABELS, NPS_SINGULAR, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { hasActiveFilters, type SurveySearch } from '../lib/search';
import { usePatchSearch, useSurveySearch } from '../lib/use-survey-search';

const SEARCH_DEBOUNCE_MS = 300;
function toggled<T extends string>(list: readonly T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return next.length > 0 ? next : undefined;
}

interface CheckGroupProps<T extends string> {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: readonly T[] | undefined;
  onToggle: (value: T) => void;
}

function CheckGroup<T extends string>({ legend, options, labels, selected, onToggle }: CheckGroupProps<T>) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map((option) => (
          <label key={option} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected?.includes(option) ?? false}
              onChange={() => onToggle(option)}
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ActiveChip {
  key: string;
  text: string;
  remove: Partial<SurveySearch>;
}

function activeChips(search: SurveySearch): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const plan of search.plan ?? []) {
    chips.push({
      key: `plan-${plan}`,
      text: `Plano: ${PLAN_LABELS[plan]}`,
      remove: { plan: toggled(search.plan, plan) },
    });
  }
  for (const region of search.region ?? []) {
    chips.push({
      key: `region-${region}`,
      text: `Região: ${REGION_LABELS[region]}`,
      remove: { region: toggled(search.region, region) },
    });
  }
  for (const role of search.role ?? []) {
    chips.push({
      key: `role-${role}`,
      text: `Função: ${ROLE_LABELS[role]}`,
      remove: { role: toggled(search.role, role) },
    });
  }
  if (search.nps)
    chips.push({ key: 'nps', text: `NPS: ${NPS_SINGULAR[search.nps]}`, remove: { nps: undefined } });
  if (search.q) chips.push({ key: 'q', text: `Busca: “${search.q}”`, remove: { q: undefined } });
  return chips;
}

const RESET: Partial<SurveySearch> = {
  plan: undefined,
  region: undefined,
  role: undefined,
  nps: undefined,
  q: undefined,
  page: undefined,
};

export function FilterBar() {
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const [open, setOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelId = useId();
  const searchId = useId();
  const chips = activeChips(search);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(change: Partial<SurveySearch>) {
    patch({ ...change, page: undefined });
  }

  function handleSearchInput(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ q: value.trim() || undefined }), SEARCH_DEBOUNCE_MS);
  }

  function clearAll() {
    clearTimeout(timer.current);
    setResetCount((count) => count + 1);
    patch(RESET);
  }

  return (
    <section aria-label="Filtros" className="card flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={searchId} className="label">
            Buscar nos comentários
          </label>
          <input
            key={resetCount}
            id={searchId}
            type="search"
            className="field w-full"
            maxLength={MAX_SEARCH_LENGTH}
            defaultValue={search.q ?? ''}
            placeholder="ex.: suporte, lento, preço"
            onChange={(event) => handleSearchInput(event.target.value)}
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
          className="btn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          Filtros{chips.length > 0 ? ` (${chips.length})` : ''}
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="grid gap-4 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <CheckGroup<Plan>
          legend="Plano"
          options={PLANS}
          labels={PLAN_LABELS}
          selected={search.plan}
          onToggle={(value) => apply({ plan: toggled(search.plan, value) })}
        />
        <CheckGroup<Region>
          legend="Região"
          options={REGIONS}
          labels={REGION_LABELS}
          selected={search.region}
          onToggle={(value) => apply({ region: toggled(search.region, value) })}
        />
        <CheckGroup<Role>
          legend="Função"
          options={ROLES}
          labels={ROLE_LABELS}
          selected={search.role}
          onToggle={(value) => apply({ role: toggled(search.role, value) })}
        />
        <div>
          <label htmlFor={`${panelId}-nps`} className="label">
            Categoria NPS
          </label>
          <select
            id={`${panelId}-nps`}
            className="field w-full"
            value={search.nps ?? ''}
            onChange={(event) => apply({ nps: (event.target.value || undefined) as NpsCategory | undefined })}
          >
            <option value="">Todas</option>
            {NPS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {NPS_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Filtros ativos">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  className="badge cursor-pointer"
                  aria-label={`Remover filtro ${chip.text}`}
                  onClick={() => {
                    if (chip.key === 'q') setResetCount((count) => count + 1);
                    apply(chip.remove);
                  }}
                >
                  {chip.text}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
          {hasActiveFilters(search) ? (
            <button type="button" className="btn btn-sm" onClick={clearAll}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
