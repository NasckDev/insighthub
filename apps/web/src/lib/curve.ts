export interface Point {
  x: number;
  y: number;
}

/**
 * SVG path through the points as a monotone cubic curve (Fritsch-Carlson): smooth, and it never
 * overshoots between samples, so a chart line never shows a peak that is not in the data.
 */
export function monotonePath(points: readonly Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  const first = points[0] as Point;
  if (n === 1) return `M ${first.x} ${first.y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i] as Point;
    const b = points[i + 1] as Point;
    dx.push(b.x - a.x);
    slope.push((b.y - a.y) / (b.x - a.x));
  }
  const tangent: number[] = [slope[0] as number];
  for (let i = 1; i < n - 1; i += 1) {
    const prev = slope[i - 1] as number;
    const next = slope[i] as number;
    tangent.push(prev * next <= 0 ? 0 : (prev + next) / 2);
  }
  tangent.push(slope[n - 2] as number);
  for (let i = 0; i < n - 1; i += 1) {
    const s = slope[i] as number;
    if (s === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = (tangent[i] as number) / s;
    const b = (tangent[i + 1] as number) / s;
    const h = Math.hypot(a, b);
    if (h > 3) {
      tangent[i] = ((3 * a) / h) * s;
      tangent[i + 1] = ((3 * b) / h) * s;
    }
  }

  let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i] as Point;
    const b = points[i + 1] as Point;
    const step = (dx[i] as number) / 3;
    path +=
      ` C ${(a.x + step).toFixed(2)} ${(a.y + step * (tangent[i] as number)).toFixed(2)}` +
      ` ${(b.x - step).toFixed(2)} ${(b.y - step * (tangent[i + 1] as number)).toFixed(2)}` +
      ` ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return path;
}
