import type { SegmentDelta, SegmentDimension, ThemeStat } from '@insighthub/core';
import { useEffect, useState } from 'react';
import type { DistributionBin, TimelinePoint } from '../../lib/overview';
import { LoadingBlock } from '../loading';

import type * as ChartTables from './chart-tables';

type Tables = typeof ChartTables;

/**
 * The accessible table alternatives share one on-demand chunk (it carries the Ant Design Table). It is
 * requested when a table is first shown, and each wrapper renders a placeholder until it arrives.
 */
function useTables(): Tables | null {
  const [tables, setTables] = useState<Tables | null>(null);
  useEffect(() => {
    let active = true;
    void import('./chart-tables').then((module) => {
      if (active) setTables(module);
    });
    return () => {
      active = false;
    };
  }, []);
  return tables;
}

const placeholder = <LoadingBlock label="Carregando a tabela" height={160} />;

export function DistributionTable({ bins }: { bins: DistributionBin[] }) {
  const tables = useTables();
  return tables ? <tables.DistributionTable bins={bins} /> : placeholder;
}

export function TimelineTable({ points }: { points: TimelinePoint[] }) {
  const tables = useTables();
  return tables ? <tables.TimelineTable points={points} /> : placeholder;
}

export function SegmentTable({ stats, dimension }: { stats: SegmentDelta[]; dimension: SegmentDimension }) {
  const tables = useTables();
  return tables ? <tables.SegmentTable stats={stats} dimension={dimension} /> : placeholder;
}

export function ThemeTable({ themes }: { themes: ThemeStat[] }) {
  const tables = useTables();
  return tables ? <tables.ThemeTable themes={themes} /> : placeholder;
}
