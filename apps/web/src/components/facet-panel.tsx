import {
  NPS_CATEGORIES,
  PLANS,
  REGIONS,
  ROLES,
  THEME_KEYS,
  THEME_LABELS,
  type NpsCategory,
  type Plan,
  type Region,
  type Role,
  type Theme,
} from '@insighthub/core';
import { isInvertedRange } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { formatNumber } from '../lib/format';
import { NPS_LABELS, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { filtersOf, type SurveySearch } from '../lib/search';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import { useClient } from './app-context';

export function toggled<T extends string>(list: readonly T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return next.length > 0 ? next : undefined;
}

interface GroupProps<T extends string> {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  counts: Record<T, number> | undefined;
  selected: readonly T[] | undefined;
  onToggle: (value: T) => void;
}

function CheckGroup<T extends string>({ legend, options, labels, counts, selected, onToggle }: GroupProps<T>) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="eyebrow mb-1.5 p-0">{legend}</legend>
      <div className="flex flex-col">
        {options.map((option) => {
          const count = counts?.[option];
          const checked = selected?.includes(option) ?? false;
          return (
            <label
              key={option}
              className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 text-sm hover:bg-surface-2 pointer-coarse:min-h-11"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={checked}
                onChange={() => onToggle(option)}
              />
              <span className="flex-1">{labels[option]}</span>
              {count !== undefined ? (
                <span
                  className={`text-xs tabular-nums ${count === 0 && !checked ? 'text-muted opacity-70' : 'text-muted'}`}
                >
                  {formatNumber(count)}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const THEME_LABELS_MAP = THEME_LABELS as Record<Theme, string>;

/** Facets with live counts; every change goes to the URL and resets the page. */
export function FacetPanel({ className = '' }: { className?: string }) {
  const client = useClient();
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const filters = filtersOf(search);
  const facets = useQuery({
    queryKey: ['facets', surveyId, filters],
    queryFn: ({ signal }) => client.getFacets(surveyId, filters, { signal }),
    placeholderData: (previous) => previous,
  });
  const apply = (change: Partial<SurveySearch>) => patch({ ...change, page: undefined });
  // Unique ids: the panel can be on screen twice (facet column and filter dialog).
  const uid = useId();
  const fromId = `${uid}-from`;
  const toId = `${uid}-to`;

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <CheckGroup<NpsCategory>
        legend="Categoria NPS"
        options={NPS_CATEGORIES}
        labels={NPS_LABELS}
        counts={facets.data?.nps}
        selected={search.nps ? [search.nps] : undefined}
        onToggle={(value) => apply({ nps: search.nps === value ? undefined : value })}
      />
      <CheckGroup<Plan>
        legend="Plano"
        options={PLANS}
        labels={PLAN_LABELS}
        counts={facets.data?.plan}
        selected={search.plan}
        onToggle={(value) => apply({ plan: toggled(search.plan, value) })}
      />
      <CheckGroup<Region>
        legend="Região"
        options={REGIONS}
        labels={REGION_LABELS}
        counts={facets.data?.region}
        selected={search.region}
        onToggle={(value) => apply({ region: toggled(search.region, value) })}
      />
      <CheckGroup<Role>
        legend="Função"
        options={ROLES}
        labels={ROLE_LABELS}
        counts={facets.data?.role}
        selected={search.role}
        onToggle={(value) => apply({ role: toggled(search.role, value) })}
      />
      <CheckGroup<Theme>
        legend="Tema citado"
        options={THEME_KEYS}
        labels={THEME_LABELS_MAP}
        counts={facets.data?.theme}
        selected={search.theme ? [search.theme] : undefined}
        onToggle={(value) => apply({ theme: search.theme === value ? undefined : value })}
      />
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="eyebrow mb-1.5 p-0">Período de envio</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={fromId} className="label">
              De
            </label>
            <input
              id={fromId}
              type="date"
              className="field w-full"
              value={search.from ?? ''}
              max={search.to}
              onChange={(event) => apply({ from: event.target.value || undefined })}
            />
          </div>
          <div>
            <label htmlFor={toId} className="label">
              Até
            </label>
            <input
              id={toId}
              type="date"
              className="field w-full"
              value={search.to ?? ''}
              min={search.from}
              onChange={(event) => apply({ to: event.target.value || undefined })}
            />
          </div>
        </div>
        {isInvertedRange(search) ? (
          <p role="alert" className="m-0 mt-2 text-sm" style={{ color: 'var(--detractor)' }}>
            A data inicial é depois da final, então o período está sendo ignorado. Ajuste uma das datas.
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
