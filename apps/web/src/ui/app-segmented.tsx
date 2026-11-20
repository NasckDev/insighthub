import Segmented from 'antd/es/segmented';
import type { ReactNode } from 'react';

export interface AppSegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is only an icon. */
  ariaLabel?: string;
}

export interface AppSegmentedProps<T extends string> {
  options: readonly AppSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  size?: 'sm' | 'md';
}

/** Switch between two or three views of the same content (chart or table). */
export function AppSegmented<T extends string>({ options, value, onChange, size = 'md', 'aria-label': ariaLabel }: AppSegmentedProps<T>) {
  return (
    <Segmented<T>
      value={value}
      size={size === 'sm' ? 'small' : 'middle'}
      aria-label={ariaLabel}
      options={options.map((option) => ({ value: option.value, label: option.label, ariaLabel: option.ariaLabel }))}
      onChange={onChange}
    />
  );
}
