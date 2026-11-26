import { PALETTES } from '../ui';

interface LogoMarkProps {
  size?: number;
}

const BRAND = PALETTES.light;

/** InsightHub mark: an indigo tile with three bars, the last one in coral (the insight). Brand colors in both themes. */
export function LogoMark({ size = 30 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <rect width="30" height="30" rx="9" fill={BRAND.primary} />
      <rect x="8" y="15" width="3.5" height="7" rx="1.5" fill={BRAND.surface} />
      <rect x="13.25" y="9" width="3.5" height="13" rx="1.5" fill={BRAND.surface} />
      <rect x="18.5" y="12" width="3.5" height="10" rx="1.5" fill={BRAND.accent} />
    </svg>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="ih-logo">
      <LogoMark />
      {collapsed ? null : <span className="ih-logo-word">InsightHub</span>}
    </span>
  );
}
