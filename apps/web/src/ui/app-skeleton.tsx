export interface AppSkeletonProps {
  /** Read by screen readers: "Carregando respostas…". */
  label?: string;
  /** Height of the block, as a CSS length. */
  height?: string | number;
  rows?: number;
}

/** Visually hidden text for screen readers. */
export function AppSrOnly({ children }: { children: React.ReactNode }) {
  return <span className="ih-sr-only">{children}</span>;
}

/**
 * Loading block with shimmer, made of plain elements (the Ant Design Skeleton is not needed in the first
 * load). It is a live region, so the wait is announced once.
 */
export function AppSkeleton({ label = 'Carregando', height, rows = 4 }: AppSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className="ih-skeleton" style={height ? { minHeight: height } : undefined}>
      <AppSrOnly>{label}…</AppSrOnly>
      <span aria-hidden="true" className="ih-skeleton-line ih-skeleton-title" />
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} aria-hidden="true" className="ih-skeleton-line" style={{ width: index === rows - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

/** Row of placeholder cards, shaped like the KPI cards it stands for. */
export function AppSkeletonCards({ count = 4, label = 'Carregando indicadores' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="ih-grid ih-grid--tight" style={{ '--cols-base': 2, '--cols-lg': count } as React.CSSProperties}>
      <AppSrOnly>{label}…</AppSrOnly>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="ih-skeleton-card" />
      ))}
    </div>
  );
}
