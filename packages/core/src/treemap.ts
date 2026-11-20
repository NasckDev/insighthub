export interface TreemapRect<T> {
  item: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Worst aspect ratio of a row laid along the shorter side `side`. */
function worstRatio(areas: readonly number[], side: number): number {
  const sum = areas.reduce((acc, area) => acc + area, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * Squarified treemap (Bruls, Huizing, van Wijk): tiles with aspect ratios as close to 1 as
 * possible, areas proportional to `value`. Items with a non-positive value are skipped.
 */
export function squarify<T extends { value: number }>(
  items: readonly T[],
  width: number,
  height: number,
): TreemapRect<T>[] {
  const positive = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = positive.reduce((acc, item) => acc + item.value, 0);
  if (positive.length === 0 || total === 0 || width <= 0 || height <= 0) return [];
  const scale = (width * height) / total;
  const rects: TreemapRect<T>[] = [];
  let box: Box = { x: 0, y: 0, width, height };
  let row: { item: T; area: number }[] = [];

  const flush = () => {
    if (row.length === 0) return;
    const sum = row.reduce((acc, entry) => acc + entry.area, 0);
    const horizontal = box.width >= box.height;
    const thickness = sum / (horizontal ? box.height : box.width);
    let offset = 0;
    for (const entry of row) {
      const length = entry.area / thickness;
      rects.push(
        horizontal
          ? { item: entry.item, x: box.x, y: box.y + offset, width: thickness, height: length }
          : { item: entry.item, x: box.x + offset, y: box.y, width: length, height: thickness },
      );
      offset += length;
    }
    box = horizontal
      ? { x: box.x + thickness, y: box.y, width: box.width - thickness, height: box.height }
      : { x: box.x, y: box.y + thickness, width: box.width, height: box.height - thickness };
    row = [];
  };

  for (const item of positive) {
    const entry = { item, area: item.value * scale };
    const side = Math.min(box.width, box.height);
    const areas = row.map((r) => r.area);
    if (row.length === 0 || worstRatio([...areas, entry.area], side) <= worstRatio(areas, side)) {
      row.push(entry);
    } else {
      flush();
      row.push(entry);
    }
  }
  flush();
  return rects;
}
