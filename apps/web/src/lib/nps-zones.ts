export interface NpsZone {
  label: string;
  from: number;
  to: number;
  /** Which palette tone paints this band (bar color and text color both come from the theme). */
  tone: 'detractor' | 'passive' | 'promoter';
}

/** The usual NPS reading bands: below 0 needs attention; above 75 is world class. */
export const NPS_ZONES: readonly NpsZone[] = [
  { label: 'Zona crítica', from: -100, to: 0, tone: 'detractor' },
  { label: 'Zona de aperfeiçoamento', from: 0, to: 50, tone: 'passive' },
  { label: 'Zona de qualidade', from: 50, to: 75, tone: 'promoter' },
  { label: 'Zona de excelência', from: 75, to: 100, tone: 'promoter' },
];

export function zoneOf(nps: number): NpsZone {
  return NPS_ZONES.find((zone) => nps < zone.to) ?? (NPS_ZONES[NPS_ZONES.length - 1] as NpsZone);
}
