import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { DataError } from '../data';
import { AppAlert, AppButton, AppEmpty, AppResult, AppSkeleton, AppSkeletonCards, KeyOutlined, ReloadOutlined, type IllustrationName } from '../ui';
import { useConnection } from './connection';

export function LoadingBlock({ label = 'Carregando', height = 120 }: { label?: string; height?: number }) {
  return <AppSkeleton label={label} height={height} />;
}

/** Skeleton shaped like a row of KPI cards. */
export function KpiSkeleton({ label = 'Carregando indicadores' }: { label?: string }) {
  return <AppSkeletonCards label={label} count={4} />;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: IllustrationName;
}

export function EmptyState({ title, description, action, illustration = 'search' }: EmptyStateProps) {
  return <AppEmpty title={title} description={description} action={action} illustration={illustration} />;
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
  const connection = useConnection();
  const needsToken = error instanceof DataError && error.code === 'AUTH';
  return (
    <AppResult
      status="error"
      illustrated
      title={title}
      subTitle={`${messageOf(error)}${needsToken ? '' : ' Tente de novo; se o problema continuar, volte em instantes.'}`}
      extra={
        <>
          {needsToken ? (
            <AppButton variant="primary" icon={<KeyOutlined />} onClick={connection.openDialog}>
              Informar token
            </AppButton>
          ) : null}
          <AppButton icon={<ReloadOutlined />} onClick={onRetry}>
            Tentar de novo
          </AppButton>
        </>
      }
    />
  );
}

interface PartialNoticeProps {
  message: string;
  onRetry?: () => void;
  /** Extra action, shown before the retry button. */
  action?: ReactNode;
}

/** Shown when data arrived incomplete: the page keeps working with what it has. */
export function PartialNotice({ message, onRetry, action }: PartialNoticeProps) {
  return (
    <AppAlert
      kind="warning"
      live="status"
      title={
        <>
          <strong>Resultado parcial.</strong> {message}
        </>
      }
      action={
        action || onRetry ? (
          <>
            {action}
            {onRetry ? (
              <AppButton size="sm" onClick={onRetry}>
                Tentar de novo
              </AppButton>
            ) : null}
          </>
        ) : undefined
      }
    />
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
export function QueryView<T>({ query, loadingLabel, loadingHeight, loading, empty, children }: QueryViewProps<T>) {
  if (query.data === undefined) {
    if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    return loading ?? <LoadingBlock label={loadingLabel} height={loadingHeight} />;
  }
  const emptyNode = empty?.(query.data);
  if (emptyNode) return <>{emptyNode}</>;
  return (
    <>
      {query.isError ? (
        <PartialNotice message="A atualização falhou; exibindo os dados anteriores." onRetry={() => void query.refetch()} />
      ) : null}
      {children(query.data)}
    </>
  );
}
