import { Statistic } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import { AppCard } from './app-card';
import { PALETTES, useThemeMode } from './theme';

export type StatisticTone = 'default' | 'promoter' | 'passive' | 'detractor';

const COUNT_UP_MS = 900;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Number that counts up to `value`. Plain requestAnimationFrame, no animation library. The final value
 * is always in the DOM for screen readers, and nothing moves with `prefers-reduced-motion`.
 */
export function CountUp({ value, format = String }: { value: number; format?: (value: number) => string }) {
  const [shown, setShown] = useState(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return (
    <>
      <span aria-hidden="true">{format(reduced ? value : shown)}</span>
      <span style={SR_ONLY}>{format(value)}</span>
    </>
  );
}

const SR_ONLY = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

export interface AppStatisticProps {
  title: string;
  value: number | string;
  /** Formats a numeric value (default: plain number). */
  format?: (value: number) => string;
  /** Small line under the number. */
  hint?: ReactNode;
  tone?: StatisticTone;
  /** Counts up on mount. */
  animate?: boolean;
  loading?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/** KPI card: label, big serif number and a hint. */
export function AppStatistic({ title, value, format, hint, tone = 'default', animate = true, loading, prefix, suffix }: AppStatisticProps) {
  const mode = useThemeMode();
  const palette = PALETTES[mode];
  const color = tone === 'default' ? palette.fg : palette[tone];
  const numeric = typeof value === 'number';
  return (
    <AppCard fullHeight>
      <Statistic
        title={title}
        value={value}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
        classNames={{ content: 'ih-display ih-tabular' }}
        styles={{ content: { color } }}
        formatter={
          numeric && animate
            ? () => <CountUp value={value} format={format} />
            : numeric
              ? () => (format ? format(value) : String(value))
              : undefined
        }
      />
      {hint ? <p className="ih-muted" style={{ margin: 'var(--ih-space-1) 0 0', fontSize: '0.8125rem' }}>{hint}</p> : null}
    </AppCard>
  );
}
