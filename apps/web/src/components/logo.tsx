interface LogoMarkProps {
  size?: number;
}

/** InsightHub mark: three rising bars (the data) and a coral dot (the insight). */
export function LogoMark({ size = 32 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#0f766e" />
      <rect x="7" y="17" width="4.5" height="8" rx="2" fill="#fbf8f3" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="2" fill="#fbf8f3" />
      <rect x="20.5" y="15" width="4.5" height="10" rx="2" fill="#fbf8f3" opacity="0.7" />
      <circle cx="22.75" cy="8.75" r="3.25" fill="#e8604c" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="display text-[21px] text-fg">InsightHub</span>
    </span>
  );
}
