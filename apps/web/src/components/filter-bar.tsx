import { MAX_SEARCH_LENGTH, THEME_LABELS } from '@insighthub/core';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../lib/format';
import { NPS_SINGULAR, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { hasActiveFilters, type SurveySearch } from '../lib/search';
import { usePatchSearch, useSurveySearch } from '../lib/use-survey-search';
import { AppButton, AppDrawer, AppRow, AppSearchInput, AppStack, CloseOutlined, FilterOutlined } from '../ui';
import { FacetPanel, toggled } from './facet-panel';

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
  const chips = activeChips(search);

  // The box is controlled and follows the URL: a removed chip, "Limpar filtros" or the browser's back
  // button all update what is typed, and what is typed is never lost to the debounce.
  const [text, setText] = useState(search.q ?? '');
  const [syncedQ, setSyncedQ] = useState(search.q);
  if (search.q !== syncedQ) {
    setSyncedQ(search.q);
    setText(search.q ?? '');
  }

  function apply(change: Partial<SurveySearch>) {
    patch({ ...change, page: undefined });
  }

  const latest = useRef({ apply, current: search.q });
  useEffect(() => {
    latest.current = { apply, current: search.q };
  });
  useEffect(() => {
    const wanted = text.trim() || undefined;
    if (wanted === latest.current.current) return;
    const timer = setTimeout(() => latest.current.apply({ q: wanted }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  function clearAll() {
    setText('');
    patch(RESET);
  }

  return (
    <section aria-label="Filtros">
      <AppStack gap={2}>
        <div className="ih-row ih-gap-2 ih-nowrap">
          <div className="ih-fill">
            <AppSearchInput
              id="busca-global"
              aria-label="Buscar nos comentários"
              placeholder="Buscar nos comentários"
              maxLength={MAX_SEARCH_LENGTH}
              value={text}
              onChange={setText}
              onClear={() => apply({ q: undefined })}
              onPressEnter={() => apply({ q: text.trim() || undefined })}
              onBlur={() => {
                const wanted = text.trim() || undefined;
                if (wanted !== search.q) apply({ q: wanted });
              }}
            />
          </div>
          <span className={facetsVisible ? 'ih-hide-desktop' : undefined}>
            <AppButton icon={<FilterOutlined />} aria-haspopup="dialog" onClick={() => setOpen(true)}>
              Filtros{chips.length > 0 ? ` (${chips.length})` : ''}
            </AppButton>
          </span>
        </div>

        {chips.length > 0 ? (
          <AppRow gap={2}>
            <ul className="ih-row ih-gap-2" aria-label="Filtros ativos" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {chips.map((chip) => (
                <li key={chip.key}>
                  <AppButton size="sm" aria-label={`Remover filtro ${chip.text}`} onClick={() => apply(chip.remove)}>
                    {chip.text}
                    <CloseOutlined aria-hidden="true" />
                  </AppButton>
                </li>
              ))}
            </ul>
            {hasActiveFilters(search) ? (
              <AppButton size="sm" variant="link" onClick={clearAll}>
                Limpar filtros
              </AppButton>
            ) : null}
          </AppRow>
        ) : null}
      </AppStack>

      <AppDrawer
        open={open}
        title="Filtros"
        onClose={() => setOpen(false)}
        footer={
          <div className="ih-row ih-gap-2 ih-nowrap">
            <div className="ih-fill">
              <AppButton variant="primary" block onClick={() => setOpen(false)}>
                Ver resultados
              </AppButton>
            </div>
            {hasActiveFilters(search) ? <AppButton onClick={clearAll}>Limpar</AppButton> : null}
          </div>
        }
      >
        <FacetPanel />
      </AppDrawer>
    </section>
  );
}
