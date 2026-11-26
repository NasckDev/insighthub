import type { NpsBreakdown } from '@insighthub/core';
import { useId } from 'react';
import { formatNps, formatNumber, formatPercent } from '../lib/format';
import { zoneOf } from '../lib/nps-zones';
import { AppBand, AppCard, PALETTES, useThemeMode } from '../ui';

/**
 * Hero NPS of the dashboard: the number in indigo (or the negative text tone), its reading zone, the three
 * groups side by side and the coral / mist / indigo distribution band.
 */
export function NpsCard({ summary }: { summary: NpsBreakdown }) {
  const p = PALETTES[useThemeMode()];
  const headingId = useId();
  const share = (count: number) => formatPercent(count, summary.total);
  const zone = zoneOf(summary.nps);
  const negative = summary.nps < 0;
  const columns = [
    { key: 'promoters', label: 'Promotores', value: summary.promoters, hint: 'notas 9 e 10' },
    { key: 'passives', label: 'Neutros', value: summary.passives, hint: 'notas 7 e 8' },
    { key: 'detractors', label: 'Detratores', value: summary.detractors, hint: 'notas 0 a 6' },
  ];
  return (
    <AppCard role="region" aria-labelledby={headingId} className="ih-nps-card">
      <div className="ih-nps-top">
        <div className="ih-stack ih-gap-1">
          <h2 id={headingId} className="ih-card-kicker">
            Net Promoter Score
          </h2>
          <div className="ih-nps-hero-row">
            <span
              role="img"
              className={`ih-nps-hero${negative ? ' is-negative' : ''}`}
              aria-label={`NPS ${formatNps(summary.nps)} em uma escala de menos 100 a mais 100, ${zone.label.toLowerCase()}, com base em ${summary.total} respostas`}
            >
              {formatNps(summary.nps)}
            </span>
            <span className={`ih-zone${zone.tone === 'detractor' ? ' is-negative' : ''}`}>{zone.label}</span>
          </div>
        </div>
        <dl className="ih-nps-split">
          {columns.map((column) => (
            <div key={column.key}>
              <dt>{column.label}</dt>
              <dd className="ih-nps-split-value">{formatNumber(column.value)}</dd>
              <dd className="ih-nps-split-hint">
                {share(column.value)}, {column.hint}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <AppBand
        legend={false}
        label={`Distribuição das notas: ${share(summary.detractors)} detratores, ${share(summary.passives)} neutros e ${share(summary.promoters)} promotores`}
        parts={[
          { key: 'detractors', label: `Detratores ${share(summary.detractors)}`, value: summary.detractors, color: p.detractorBar },
          { key: 'passives', label: `Neutros ${share(summary.passives)}`, value: summary.passives, color: p.passiveBar },
          { key: 'promoters', label: `Promotores ${share(summary.promoters)}`, value: summary.promoters, color: p.promoterBar },
        ]}
      />
      <p className="ih-card-note">
        {formatNumber(summary.total)} respostas no recorte atual. O NPS é a parcela de promotores menos a de detratores.
      </p>
    </AppCard>
  );
}
