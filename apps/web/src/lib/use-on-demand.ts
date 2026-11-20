import { useEffect, useState } from 'react';

/**
 * Loads a code-split module the first time `wanted` is true and returns it once it has arrived (until then
 * `null`). Plain state instead of `React.lazy` and `Suspense`, so what is on screen never depends on a
 * suspended render finishing: the caller decides what to show while the chunk is on its way.
 */
export function useOnDemand<T>(load: () => Promise<T>, wanted: boolean): T | null {
  const [loaded, setLoaded] = useState<T | null>(null);
  useEffect(() => {
    if (!wanted || loaded) return;
    let active = true;
    void load().then((module) => {
      if (active) setLoaded(module);
    });
    return () => {
      active = false;
    };
  }, [wanted, loaded, load]);
  return loaded;
}
