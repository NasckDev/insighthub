const numberFormat = new Intl.NumberFormat('pt-BR');
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
const shortDateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const dayMonthFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export const formatNumber = (value: number): string => numberFormat.format(value);
export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));
export const formatShortDate = (iso: string): string => shortDateFormat.format(new Date(iso));
/** "12 ago" style label. */
export const formatDayMonth = (iso: string): string => dayMonthFormat.format(new Date(iso)).replace('.', '');
const dayShortFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
/** "28 set": the short axis label (no "de", no dot), so it never gets cut. */
export const formatDayMonthShort = (iso: string): string =>
  dayShortFormat.formatToParts(new Date(iso)).filter((part) => part.type === 'day' || part.type === 'month').map((part) => part.value.replace('.', '')).join(' ');
export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));

/** NPS with an explicit sign so +12 and -12 never rely on color alone. */
export function formatNps(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '0';
}

/** Signed points: "+12 pts", "−8 pts". */
export function formatPoints(value: number): string {
  if (value === 0) return '0 pts';
  return `${formatNps(value)} ${Math.abs(value) === 1 ? 'pt' : 'pts'}`;
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

export function plural(count: number, one: string, many: string): string {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}
