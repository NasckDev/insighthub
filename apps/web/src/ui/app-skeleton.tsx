import { Skeleton } from 'antd';

export interface AppSkeletonProps {
  /** Read by screen readers: "Carregando respostas…". */
  label?: string;
  /** Height of the block, as a CSS length. */
  height?: string | number;
  rows?: number;
}

/** Loading block with shimmer. It is a live region, so the wait is announced once. */
export function AppSkeleton({ label = 'Carregando', height, rows = 4 }: AppSkeletonProps) {
  return (
    <div role="status" aria-live="polite" style={height ? { minHeight: height } : undefined}>
      <span className="ih-sr-only" style={SR_ONLY}>
        {label}…
      </span>
      <Skeleton active paragraph={{ rows }} title />
    </div>
  );
}

const SR_ONLY = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/** Visually hidden text for screen readers. */
export function AppSrOnly({ children }: { children: React.ReactNode }) {
  return <span style={SR_ONLY}>{children}</span>;
}

export function AppSkeletonInput() {
  return <Skeleton.Input active block />;
}

/** Row of placeholder cards, shaped like the KPI cards it stands for. */
export function AppSkeletonCards({ count = 4, label = 'Carregando indicadores' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="ih-grid ih-grid--tight" style={{ '--cols-base': 2, '--cols-lg': count } as React.CSSProperties}>
      <span style={SR_ONLY}>{label}…</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true">
          <Skeleton.Node active style={{ width: '100%', height: 112 }}>
            <span />
          </Skeleton.Node>
        </div>
      ))}
    </div>
  );
}
