import { AppSkeleton } from '../ui';

export function LoadingBlock({ label = 'Carregando', height = 120 }: { label?: string; height?: number }) {
  return <AppSkeleton label={label} height={height} />;
}
