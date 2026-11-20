import { sentimentLabel, squarify, type SentimentLabel, type Theme, type ThemeStat } from '@insighthub/core';
import { Frown, Meh, Smile, TriangleAlert } from 'lucide-react';
import type { CSSProperties } from 'react';
import { formatNps, formatNumber } from '../../lib/format';
import { useElementWidth } from './use-element-width';

interface TreemapChartProps {
  themes: ThemeStat[];
  selected: Theme | undefined;
  onSelect: (theme: Theme) => void;
}

export const SENTIMENT_STYLE: Record<
  SentimentLabel,
  { label: string; bg: string; edge: string; text: string; Icon: typeof Smile; pattern: string }
> = {
  positive: {
    label: 'Positivo',
    bg: 'var(--primary-soft)',
    edge: 'var(--promoter-bar)',
    text: 'var(--promoter)',
    Icon: Smile,
    pattern: 'none',
  },
  mixed: {
    label: 'Misto',
    bg: 'var(--amber-soft)',
    edge: 'var(--passive-bar)',
    text: 'var(--passive)',
    Icon: Meh,
    // dots
    pattern: 'radial-gradient(circle, var(--passive-bar) 1.1px, transparent 1.5px) 0 0 / 11px 11px',
  },
  negative: {
    label: 'Negativo',
    bg: 'var(--accent-soft)',
    edge: 'var(--detractor-bar)',
    text: 'var(--detractor)',
    Icon: Frown,
    // diagonal stripes
    pattern: 'repeating-linear-gradient(135deg, var(--detractor-bar) 0 1.5px, transparent 1.5px 10px)',
  },
};

const GAP = 4;
const MIN_LABEL_PX = 12;
/** Narrow tiles (a 360 px phone has some under 100 px) use one size that fits a long word like "Integrações". */
const NARROW_LABEL_PX = 11.5;
const MAX_LABEL_PX = 22;
const MIN_NUMBER_PX = 20;
const MAX_NUMBER_PX = 42;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Treemap of themes: area is the number of mentions; color, pattern and icon are the sentiment. */
export function TreemapChart({ themes, selected, onSelect }: TreemapChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = width < 520 ? 400 : 380;
  const rects = squarify(
    themes.map((stat) => ({ stat, value: stat.mentions })),
    width,
    height,
  );
  return (
    <div ref={ref} className="relative w-full" style={{ height }} role="group" aria-label="Mapa de temas">
      {rects.map(({ item, x, y, width: w, height: h }, index) => {
        const { stat } = item;
        const style = SENTIMENT_STYLE[sentimentLabel(stat.sentiment)];
        const isSelected = selected === stat.theme;
        const scale = Math.sqrt(Math.max(1, (w - GAP) * (h - GAP)));
        const compact = w < 150 || h < 112;
        const tile: CSSProperties = {
          left: x + GAP / 2,
          top: y + GAP / 2,
          width: Math.max(0, w - GAP),
          height: Math.max(0, h - GAP),
          backgroundColor: style.bg,
          color: 'var(--fg)',
          borderTop: `5px solid ${style.edge}`,
          outline: isSelected ? '3px solid var(--fg)' : undefined,
          outlineOffset: isSelected ? '-3px' : undefined,
          animationDelay: `${index * 60}ms`,
        };
        return (
          <button
            key={stat.theme}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(stat.theme)}
            className={`fade-in absolute flex flex-col justify-between overflow-hidden rounded-xl text-left ${w < 150 ? 'p-2' : 'p-3'} transition-transform hover:z-10 hover:scale-[1.015]`}
            style={tile}
          >
            {/* The pattern sits under the text and fades out where the text is, so contrast stays AA. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{ background: style.pattern }}
            />
            <span
              className="display relative leading-[1.1]"
              style={{
                fontSize: w < 120 ? NARROW_LABEL_PX : clamp(Math.round(scale / 8), MIN_LABEL_PX, MAX_LABEL_PX),
                overflowWrap: 'break-word',
                hyphens: 'manual',
              }}
              lang="pt-BR"
            >
              {stat.label}
            </span>
            <span className="relative flex flex-col gap-1">
              <span
                className="display leading-none tabular-nums"
                style={{ fontSize: clamp(Math.round(scale / 4.5), MIN_NUMBER_PX, MAX_NUMBER_PX) }}
              >
                {formatNumber(stat.mentions)}
                <span className="sr-only"> menções</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-semibold" style={{ color: style.text }}>
                <style.Icon aria-hidden="true" size={compact ? 18 : 20} className="shrink-0" />
                {compact ? formatNps(stat.sentiment) : `${style.label} · NPS ${formatNps(stat.sentiment)}`}
                {compact ? <span className="sr-only"> de NPS, sentimento {style.label.toLowerCase()}</span> : null}
              </span>
              {stat.lowSample ? (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--passive)' }}>
                  <TriangleAlert aria-hidden="true" size={13} className="shrink-0" />
                  {compact ? <span className="sr-only">Amostra pequena</span> : 'Amostra pequena'}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemeTable({ themes }: { themes: ThemeStat[] }) {
  return (
    <table className="data-table" aria-label="Temas e sentimento">
      <thead>
        <tr>
          <th scope="col">Tema</th>
          <th scope="col">Menções</th>
          <th scope="col">Parcela</th>
          <th scope="col">Sentimento (NPS)</th>
          <th scope="col">Promotores</th>
          <th scope="col">Neutros</th>
          <th scope="col">Detratores</th>
        </tr>
      </thead>
      <tbody>
        {themes.map((stat) => (
          <tr key={stat.theme}>
            <th scope="row">
              {stat.label}
              {stat.lowSample ? <span className="badge badge-passive ml-2">Amostra pequena</span> : null}
            </th>
            <td className="tabular-nums">{formatNumber(stat.mentions)}</td>
            <td className="tabular-nums">{stat.share}%</td>
            <td className="tabular-nums">
              {SENTIMENT_STYLE[sentimentLabel(stat.sentiment)].label} ({formatNps(stat.sentiment)})
            </td>
            <td className="tabular-nums">{stat.promoters}</td>
            <td className="tabular-nums">{stat.passives}</td>
            <td className="tabular-nums">{stat.detractors}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
