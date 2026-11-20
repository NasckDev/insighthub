import { BarChart3, Table2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description: string;
  chart: ReactNode;
  /** Same data as the chart, as a table: the accessible alternative. */
  table: ReactNode;
  legend?: ReactNode;
  className?: string;
}

/** Card with a heading, a short description, the chart, and a switch to the table alternative. */
export function ChartCard({ title, description, chart, table, legend, className = '' }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={`card flex min-w-0 flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="display m-0 text-xl">
            {title}
          </h2>
          <p className="m-0 mt-0.5 text-sm text-muted">{description}</p>
        </div>
        <div className="seg" role="group" aria-label={`Formato de ${title}`}>
          <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
            <BarChart3 aria-hidden="true" size={15} className="mr-1 inline" />
            Gráfico
          </button>
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
            <Table2 aria-hidden="true" size={15} className="mr-1 inline" />
            Tabela
          </button>
        </div>
      </div>
      {view === 'chart' ? (
        <>
          {chart}
          {legend}
        </>
      ) : (
        <div className="max-h-80 overflow-auto rounded-xl border border-line">{table}</div>
      )}
    </section>
  );
}
