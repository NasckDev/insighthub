import { sentimentLabel, squarify, type SentimentLabel, type Theme, type ThemeStat } from '@insighthub/core';
import { Frown, Meh, Smile } from 'lucide-react';
import { formatNps, formatNumber } from '../../lib/format';
import { useElementWidth } from './use-element-width';

interface TreemapChartProps {
  themes: ThemeStat[];
  selected: Theme | undefined;
  onSelect: (theme: Theme) => void;
}

export const SENTIMENT_STYLE: Record<
  SentimentLabel,
  { label: string; bg: string; edge: string; text: string; Icon: typeof Smile }
> = {
  positive: { label: 'Positivo', bg: 'var(--primary-soft)', edge: 'var(--promoter-bar)', text: 'var(--promoter)', Icon: Smile },
  mixed: { label: 'Misto', bg: 'var(--amber-soft)', edge: 'var(--passive-bar)', text: 'var(--passive)', Icon: Meh },
  negative: { label: 'Negativo', bg: 'var(--accent-soft)', edge: 'var(--detractor-bar)', text: 'var(--detractor)', Icon: Frown },
};

const GAP = 4;

/** Treemap of themes: area is the number of mentions, color and icon are the sentiment. */
export function TreemapChart({ themes, selected, onSelect }: TreemapChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = width < 520 ? 380 : 360;
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
        const compact = w < 150 || h < 90;
        return (
          <button
            key={stat.theme}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(stat.theme)}
            className="fade-in absolute flex flex-col justify-between overflow-hidden rounded-xl p-3 text-left transition-transform hover:z-10 hover:scale-[1.015]"
            style={{
              left: x + GAP / 2,
              top: y + GAP / 2,
              width: Math.max(0, w - GAP),
              height: Math.max(0, h - GAP),
              background: style.bg,
              color: 'var(--fg)',
              borderTop: `5px solid ${style.edge}`,
              outline: isSelected ? '3px solid var(--fg)' : undefined,
              outlineOffset: isSelected ? '-3px' : undefined,
              animationDelay: `${index * 60}ms`,
            }}
          >
            <span className="display text-[17px] leading-tight">{stat.label}</span>
            <span className="flex flex-col gap-0.5">
              <span className="display text-3xl leading-none tabular-nums">
                {formatNumber(stat.mentions)}
                <span className="sr-only"> menções</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: style.text }}>
                <style.Icon aria-hidden="true" size={14} />
                {compact ? formatNps(stat.sentiment) : `${style.label} · NPS ${formatNps(stat.sentiment)}`}
                {compact ? <span className="sr-only"> de NPS, sentimento {style.label.toLowerCase()}</span> : null}
              </span>
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
            <th scope="row">{stat.label}</th>
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
