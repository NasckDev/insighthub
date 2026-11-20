import { PALETTES } from '../ui';

interface LogoMarkProps {
  size?: number;
}

const BRAND = PALETTES.light;

/** InsightHub mark: three rising bars (the data) and a coral dot (the insight). It keeps the brand colors in both themes. */
export function LogoMark({ size = 32 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={BRAND.primary} />
      <rect x="7" y="17" width="4.5" height="8" rx="2" fill={BRAND.bg} />
      <rect x="13.75" y="12" width="4.5" height="13" rx="2" fill={BRAND.bg} />
      <rect x="20.5" y="15" width="4.5" height="10" rx="2" fill={BRAND.bg} opacity="0.7" />
      <circle cx="22.75" cy="8.75" r="3.25" fill={BRAND.accent} />
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
