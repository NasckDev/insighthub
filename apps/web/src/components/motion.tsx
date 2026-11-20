import { animate, domAnimation, LazyMotion, m, MotionConfig, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';

/** Every animation in the app goes through here, so `prefers-reduced-motion` turns them all off. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

const STAGGER_S = 0.05;
const MAX_STAGGER_ITEMS = 10;

interface RevealProps {
  index?: number;
  className?: string;
  children: ReactNode;
}

/** Fade and rise on entry, staggered by `index`. */
export function Reveal({ index = 0, className, children }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={`min-w-0 ${className ?? ''}`}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index, MAX_STAGGER_ITEMS) * STAGGER_S }}
    >
      {children}
    </m.div>
  );
}

/** Route transition wrapper: a short fade and slide when the screen changes. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
}

interface CountUpProps {
  value: number;
  format?: (value: number) => string;
  durationS?: number;
}

/** Number that counts up to `value`. The final value is always in the DOM for screen readers. */
export function CountUp({ value, format = String, durationS = 0.9 }: CountUpProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, value, {
      duration: durationS,
      ease: 'easeOut',
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, durationS, reduced]);

  return (
    <>
      <span aria-hidden="true">{format(reduced ? value : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

export { m, useReducedMotion };
