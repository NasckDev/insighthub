import { NPS_ZONES, zoneOf } from '../../lib/nps-zones';
import { formatNps } from '../../lib/format';
import { CountUp } from '../motion';

interface NpsGaugeProps {
  value: number;
  total: number;
}

const SIZE = 240;
const RADIUS = 92;
const STROKE = 18;
const CENTER_X = SIZE / 2;
const CENTER_Y = 130;

/** Point on the semicircle for a value in [-100, 100] (left end = -100, top = 0, right end = +100). */
function pointAt(value: number, radius = RADIUS): [number, number] {
  const angle = Math.PI * (1 - (value + 100) / 200);
  return [CENTER_X + radius * Math.cos(angle), CENTER_Y - radius * Math.sin(angle)];
}

function arc(from: number, to: number): string {
  const [x1, y1] = pointAt(from);
  const [x2, y2] = pointAt(to);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Semicircular NPS meter with the four standard zones and an animated marker. */
export function NpsGauge({ value, total }: NpsGaugeProps) {
  const zone = zoneOf(value);
  const [markerX, markerY] = pointAt(value);
  const [innerX, innerY] = pointAt(value, RADIUS - STROKE);
  return (
    <figure className="relative m-0 w-full max-w-[360px]">
      <svg
        viewBox={`0 0 ${SIZE} 150`}
        className="block w-full"
        role="img"
        aria-label={`NPS ${formatNps(value)} em uma escala de menos 100 a mais 100, zona ${zone.label.toLowerCase()}, com base em ${total} respostas`}
      >
        {NPS_ZONES.map((item) => (
          <path
            key={item.label}
            d={arc(item.from, item.to)}
            fill="none"
            stroke={item.color}
            strokeOpacity="0.28"
            strokeWidth={STROKE}
          />
        ))}
        <path
          d={arc(-100, Math.max(-99.5, value))}
          fill="none"
          stroke={zone.color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          className="draw-line"
        />
        <line
          x1={innerX}
          y1={innerY}
          x2={markerX}
          y2={markerY}
          stroke="var(--fg)"
          strokeWidth="3"
          strokeLinecap="round"
          className="fade-in"
        />
        <circle cx={markerX} cy={markerY} r="5" fill="var(--surface)" stroke="var(--fg)" strokeWidth="3" className="fade-in" />
        <text x={pointAt(-100)[0]} y="148" textAnchor="middle" fontSize="11" fill="var(--muted)">
          −100
        </text>
        <text x={pointAt(100)[0]} y="148" textAnchor="middle" fontSize="11" fill="var(--muted)">
          +100
        </text>
      </svg>
      <figcaption className="absolute inset-x-0 top-[47%] flex flex-col items-center text-center">
        <span className="display text-[52px] leading-none tabular-nums">
          <CountUp value={value} format={formatNps} />
        </span>
        <span className="mt-1 text-sm font-semibold" style={{ color: zone.textColor }}>
          {zone.label}
        </span>
      </figcaption>
    </figure>
  );
}
