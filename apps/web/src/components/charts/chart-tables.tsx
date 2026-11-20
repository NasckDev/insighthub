import { sentimentLabel, type SegmentDelta, type SegmentDimension, type ThemeStat } from '@insighthub/core';
import { formatDate, formatNps, formatNumber, formatPercent, formatPoints } from '../../lib/format';
import { NPS_SINGULAR, segmentLabel } from '../../lib/labels';
import type { DistributionBin, TimelinePoint } from '../../lib/overview';
import { AppTable, AppTag, WarningOutlined } from '../../ui';
import { SENTIMENT_STYLE } from './chart-theme';

/** The accessible table alternatives of the charts. Loaded on demand, only when someone switches to "Tabela". */
export function DistributionTable({ bins }: { bins: DistributionBin[] }) {
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  return (
    <AppTable<DistributionBin>
      label="Quantidade de respostas por nota"
      size="sm"
      rows={bins}
      rowKey={(bin) => String(bin.score)}
      columns={[
        { key: 'score', title: 'Nota', render: (bin) => bin.score },
        { key: 'band', title: 'Faixa', render: (bin) => NPS_SINGULAR[bin.category] },
        { key: 'count', title: 'Respostas', align: 'right', render: (bin) => formatNumber(bin.count) },
        { key: 'share', title: 'Parcela', align: 'right', render: (bin) => formatPercent(bin.count, total) },
      ]}
    />
  );
}

export function TimelineTable({ points }: { points: TimelinePoint[] }) {
  return (
    <AppTable<TimelinePoint>
      label="NPS por semana"
      size="sm"
      rows={points}
      rowKey={(point) => point.weekStart}
      columns={[
        { key: 'week', title: 'Semana de', render: (point) => formatDate(point.weekStart) },
        { key: 'count', title: 'Respostas', align: 'right', render: (point) => formatNumber(point.count) },
        { key: 'nps', title: 'NPS', align: 'right', render: (point) => formatNps(point.nps) },
      ]}
    />
  );
}

export function SegmentTable({ stats, dimension }: { stats: SegmentDelta[]; dimension: SegmentDimension }) {
  return (
    <AppTable<SegmentDelta>
      label="NPS por segmento"
      size="sm"
      rows={stats}
      rowKey={(stat) => stat.segment}
      columns={[
        {
          key: 'segment',
          title: 'Segmento',
          render: (stat) => (
            <>
              {segmentLabel(dimension, stat.segment)}
              {stat.lowSample ? (
                <>
                  {' '}
                  <AppTag tone="passive" icon={<WarningOutlined aria-hidden="true" />}>
                    Amostra pequena
                  </AppTag>
                </>
              ) : null}
            </>
          ),
        },
        { key: 'count', title: 'Respostas', align: 'right', render: (stat) => formatNumber(stat.count) },
        { key: 'nps', title: 'NPS', align: 'right', render: (stat) => formatNps(stat.nps) },
        { key: 'delta', title: 'Diferença', align: 'right', render: (stat) => formatPoints(stat.delta) },
        { key: 'promoters', title: 'Promotores', align: 'right', render: (stat) => `${stat.promoters}%` },
        { key: 'passives', title: 'Neutros', align: 'right', render: (stat) => `${stat.passives}%` },
        { key: 'detractors', title: 'Detratores', align: 'right', render: (stat) => `${stat.detractors}%` },
      ]}
    />
  );
}

export function ThemeTable({ themes }: { themes: ThemeStat[] }) {
  return (
    <AppTable<ThemeStat>
      label="Temas e sentimento"
      size="sm"
      rows={themes}
      rowKey={(stat) => stat.theme}
      columns={[
        {
          key: 'theme',
          title: 'Tema',
          render: (stat) => (
            <>
              {stat.label}
              {stat.lowSample ? (
                <>
                  {' '}
                  <AppTag tone="passive" icon={<WarningOutlined aria-hidden="true" />}>
                    Amostra pequena
                  </AppTag>
                </>
              ) : null}
            </>
          ),
        },
        { key: 'mentions', title: 'Menções', align: 'right', render: (stat) => formatNumber(stat.mentions) },
        { key: 'share', title: 'Parcela', align: 'right', render: (stat) => `${stat.share}%` },
        { key: 'sentiment', title: 'Sentimento (NPS)', render: (stat) => `${SENTIMENT_STYLE[sentimentLabel(stat.sentiment)].label} (${formatNps(stat.sentiment)})` },
        { key: 'promoters', title: 'Promotores', align: 'right', render: (stat) => stat.promoters },
        { key: 'passives', title: 'Neutros', align: 'right', render: (stat) => stat.passives },
        { key: 'detractors', title: 'Detratores', align: 'right', render: (stat) => stat.detractors },
      ]}
    />
  );
}
