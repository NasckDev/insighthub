import { describe, expect, it } from 'vitest';
import { zoneOf } from './nps-zones';

describe('zoneOf', () => {
  it('maps NPS values to the reading bands', () => {
    expect(zoneOf(-40).label).toBe('Zona crítica');
    expect(zoneOf(0).label).toBe('Zona de aperfeiçoamento');
    expect(zoneOf(49).label).toBe('Zona de aperfeiçoamento');
    expect(zoneOf(50).label).toBe('Zona de qualidade');
    expect(zoneOf(80).label).toBe('Zona de excelência');
    expect(zoneOf(100).label).toBe('Zona de excelência');
  });
});
