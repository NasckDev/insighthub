import { DatePicker } from 'antd';
import ptBRPicker from 'antd/es/date-picker/locale/pt_BR';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import type { AppDatePickerProps } from './app-date-picker';

const ISO = 'YYYY-MM-DD';
const DISPLAY = 'DD/MM/YYYY';

dayjs.locale('pt-br');

function parse(value: string | undefined): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, ISO, true);
  return parsed.isValid() ? parsed : null;
}

/** Implementation behind `AppDatePicker`: loaded on demand because the calendar and dayjs are not small. */
export default function DatePickerField({ id, value, onChange, min, max, placeholder, error, ...rest }: AppDatePickerProps) {
  const low = parse(min);
  const high = parse(max);
  return (
    <DatePicker
      id={id}
      locale={ptBRPicker}
      value={parse(value)}
      format={DISPLAY}
      placeholder={placeholder ?? 'dd/mm/aaaa'}
      status={error ? 'error' : undefined}
      allowClear
      style={{ width: '100%' }}
      inputReadOnly={false}
      disabledDate={(day) => (low !== null && day.isBefore(low, 'day')) || (high !== null && day.isAfter(high, 'day'))}
      onChange={(day) => onChange(day ? day.format(ISO) : undefined)}
      {...rest}
    />
  );
}
