export type IllustrationName = 'search' | 'board' | 'error' | 'chart' | 'themes' | 'spark';

const INK = 'var(--fg)';
const PRIMARY = 'var(--primary)';
const ACCENT = 'var(--accent)';
const SOFT = 'var(--primary-soft)';
const PAPER = 'var(--surface-2)';
const AMBER = 'var(--amber)';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 140"
      width="200"
      height="140"
      aria-hidden="true"
      focusable="false"
      className="max-w-full"
    >
      <ellipse cx="100" cy="126" rx="70" ry="7" fill={PAPER} />
      {children}
    </svg>
  );
}

const SCENES: Record<IllustrationName, React.ReactNode> = {
  search: (
    <>
      <rect x="38" y="26" width="110" height="82" rx="10" fill="var(--surface)" stroke={INK} strokeWidth="2" />
      <rect x="50" y="40" width="60" height="6" rx="3" fill={SOFT} />
      <rect x="50" y="54" width="84" height="6" rx="3" fill={PAPER} />
      <rect x="50" y="68" width="72" height="6" rx="3" fill={PAPER} />
      <circle cx="132" cy="86" r="22" fill="var(--surface)" stroke={PRIMARY} strokeWidth="5" />
      <path d="M148 102l20 20" stroke={PRIMARY} strokeWidth="7" strokeLinecap="round" />
      <path d="M124 86h16" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  board: (
    <>
      <rect x="30" y="30" width="62" height="74" rx="9" fill="var(--surface)" stroke={INK} strokeWidth="2" />
      <rect x="108" y="44" width="62" height="60" rx="9" fill="var(--surface)" stroke={INK} strokeWidth="2" strokeDasharray="5 5" />
      <rect x="42" y="44" width="38" height="6" rx="3" fill={PRIMARY} />
      <rect x="42" y="58" width="38" height="5" rx="2.5" fill={PAPER} />
      <rect x="42" y="69" width="30" height="5" rx="2.5" fill={PAPER} />
      <circle cx="139" cy="74" r="13" fill={ACCENT} />
      <path d="M139 67v14M132 74h14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  error: (
    <>
      <path d="M100 22l52 90H48z" fill="var(--surface)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 52v30" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="97" r="4.5" fill={ACCENT} />
      <circle cx="46" cy="40" r="5" fill={AMBER} />
      <circle cx="160" cy="58" r="4" fill={PRIMARY} />
    </>
  ),
  chart: (
    <>
      <rect x="30" y="24" width="140" height="86" rx="10" fill="var(--surface)" stroke={INK} strokeWidth="2" />
      <rect x="48" y="76" width="16" height="22" rx="3" fill={SOFT} />
      <rect x="74" y="58" width="16" height="40" rx="3" fill={PRIMARY} />
      <rect x="100" y="68" width="16" height="30" rx="3" fill={SOFT} />
      <rect x="126" y="46" width="16" height="52" rx="3" fill={ACCENT} />
    </>
  ),
  themes: (
    <>
      <rect x="30" y="28" width="76" height="52" rx="8" fill={PRIMARY} />
      <rect x="110" y="28" width="60" height="30" rx="8" fill={AMBER} />
      <rect x="110" y="62" width="28" height="18" rx="8" fill={ACCENT} />
      <rect x="142" y="62" width="28" height="18" rx="8" fill="var(--plum)" />
      <rect x="30" y="84" width="140" height="22" rx="8" fill={SOFT} stroke={INK} strokeWidth="2" />
    </>
  ),
  spark: (
    <>
      <rect x="34" y="30" width="132" height="74" rx="12" fill="var(--surface)" stroke={INK} strokeWidth="2" />
      <path d="M100 42l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill={ACCENT} />
      <rect x="52" y="86" width="96" height="5" rx="2.5" fill={PAPER} />
      <rect x="64" y="95" width="72" height="5" rx="2.5" fill={SOFT} />
    </>
  ),
};

export function Illustration({ name }: { name: IllustrationName }) {
  return <Frame>{SCENES[name]}</Frame>;
}
