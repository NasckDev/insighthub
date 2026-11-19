const numberFormat = new Intl.NumberFormat('pt-BR');
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
const shortDateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export const formatNumber = (value: number): string => numberFormat.format(value);
export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));
export const formatShortDate = (iso: string): string => shortDateFormat.format(new Date(iso));

/** NPS with an explicit sign so +12 and -12 never rely on color alone. */
export function formatNps(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}
