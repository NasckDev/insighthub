import type { UseQueryResult } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Illustration, type IllustrationName } from './illustrations';

export function LoadingBlock({ label = 'Carregando', height = 120 }: { label?: string; height?: number }) {
  return (
    <div role="status" aria-live="polite" className="skeleton" style={{ height }}>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Skeleton shaped like a row of KPI cards. */
export function KpiSkeleton({ label = 'Carregando indicadores' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <span className="sr-only">{label}…</span>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} aria-hidden="true" className="skeleton h-[104px]" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: IllustrationName;
}

export function EmptyState({ title, description, action, illustration = 'search' }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <Illustration name={illustration} />
      <p className="display m-0 mt-2 text-xl">{title}</p>
      {description ? <p className="m-0 max-w-md text-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo deu errado.';
}

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Não foi possível carregar' }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center"
      style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderColor: 'var(--danger-fg)' }}
    >
      <div className="shrink-0 max-sm:hidden">
        <Illustration name="error" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="display m-0 text-lg">{title}</p>
        <p className="m-0 text-sm">{messageOf(error)} Tente de novo; se persistir, volte em instantes.</p>
        <div>
          <button type="button" className="btn btn-sm" onClick={onRetry}>
            <RotateCw aria-hidden="true" size={15} />
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}

interface PartialNoticeProps {
  message: string;
  onRetry?: () => void;
}

/** Shown when data arrived incomplete: the page keeps working with what it has. */
export function PartialNotice({ message, onRetry }: PartialNoticeProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
      style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', borderColor: 'var(--warn-line)' }}
    >
      <span className="font-semibold">Resultado parcial.</span>
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

interface QueryViewProps<T> {
  query: UseQueryResult<T>;
  loadingLabel?: string;
  loadingHeight?: number;
  loading?: ReactNode;
  /** Return a node to show the empty state instead of the content. */
  empty?: (data: T) => ReactNode | null;
  children: (data: T) => ReactNode;
}

/** Loading, error (with retry), empty and success in one place; stale data survives a failed refetch. */
export function QueryView<T>({
  query,
  loadingLabel,
  loadingHeight,
  loading,
  empty,
  children,
}: QueryViewProps<T>) {
  if (query.data === undefined) {
    if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    return loading ?? <LoadingBlock label={loadingLabel} height={loadingHeight} />;
  }
  const emptyNode = empty?.(query.data);
  if (emptyNode) return <>{emptyNode}</>;
  return (
    <>
      {query.isError ? (
        <PartialNotice
          message="A atualização falhou; exibindo os dados anteriores."
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {children(query.data)}
    </>
  );
}
