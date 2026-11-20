import { lazy, Suspense } from 'react';
import { AppSkeletonInput } from './app-skeleton-input';

export interface AppDatePickerProps {
  /** Needed so a `<label htmlFor>` can name the field. */
  id: string;
  /** ISO date (`2026-08-10`), the same format the URL filters use. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** ISO dates that bound the selectable range. */
  min?: string;
  max?: string;
  placeholder?: string;
  error?: boolean;
  'aria-describedby'?: string;
}

const DatePickerField = lazy(() => import('./date-picker-field'));

/** Date field that works with ISO strings, so screens never touch `dayjs` or the calendar package. */
export function AppDatePicker(props: AppDatePickerProps) {
  return (
    <Suspense fallback={<AppSkeletonInput />}>
      <DatePickerField {...props} />
    </Suspense>
  );
}
