import { Suspense, useId, useState, type ReactNode } from 'react';
import { LoadingBlock } from '../states';
import { AppCard, AppParagraph, AppSegmented, AppStack, AppTitle, BarChartOutlined, TableOutlined } from '../../ui';

interface ChartCardProps {
  title: string;
  description: string;
  chart: ReactNode;
  /** Same data as the chart, as a table: the accessible alternative. */
  table: ReactNode;
  legend?: ReactNode;
  fullHeight?: boolean;
}

type View = 'chart' | 'table';

/** Card with a heading, a short description, the chart, and a switch to the table alternative. */
export function ChartCard({ title, description, chart, table, legend, fullHeight }: ChartCardProps) {
  const [view, setView] = useState<View>('chart');
  const headingId = useId();
  return (
    <AppCard role="region" aria-labelledby={headingId} fullHeight={fullHeight}>
      <AppStack gap={3}>
        <div className="ih-row ih-between ih-start ih-gap-3">
          <div className="ih-fill" style={{ flexBasis: '14rem' }}>
            <AppTitle level={2} id={headingId}>
              {title}
            </AppTitle>
            <AppParagraph tone="muted" small>
              {description}
            </AppParagraph>
          </div>
          <AppSegmented<View>
            aria-label={`Formato de ${title}`}
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: <><BarChartOutlined aria-hidden="true" /> Gráfico</> },
              { value: 'table', label: <><TableOutlined aria-hidden="true" /> Tabela</> },
            ]}
          />
        </div>
        {view === 'chart' ? (
          <>
            {chart}
            {legend}
          </>
        ) : (
          <Suspense fallback={<LoadingBlock label="Carregando a tabela" height={160} />}>{table}</Suspense>
        )}
      </AppStack>
    </AppCard>
  );
}
