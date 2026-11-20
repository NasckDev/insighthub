export interface NpsZone {
  label: string;
  from: number;
  to: number;
  /** Fill color for graphics (>= 3:1 on the card surface). */
  color: string;
  /** Text color (>= 4.5:1 on the card surface). */
  textColor: string;
}

/** The usual NPS reading bands: below 0 needs attention; above 75 is world class. */
export const NPS_ZONES: readonly NpsZone[] = [
  { label: 'Zona crítica', from: -100, to: 0, color: 'var(--detractor-bar)', textColor: 'var(--detractor)' },
  { label: 'Zona de aperfeiçoamento', from: 0, to: 50, color: 'var(--passive-bar)', textColor: 'var(--passive)' },
  { label: 'Zona de qualidade', from: 50, to: 75, color: 'var(--promoter-bar)', textColor: 'var(--promoter)' },
  { label: 'Zona de excelência', from: 75, to: 100, color: 'var(--promoter-bar)', textColor: 'var(--promoter)' },
];

export function zoneOf(nps: number): NpsZone {
  return NPS_ZONES.find((zone) => nps < zone.to) ?? (NPS_ZONES[NPS_ZONES.length - 1] as NpsZone);
}
