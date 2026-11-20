import { Select, type SelectProps } from 'antd';
import type { ControlSize } from './app-button';

const SIZE = { sm: 'small', md: 'middle', lg: 'large' } as const;

export interface AppSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps<T extends string | number = string>
  extends Omit<SelectProps<T>, 'size' | 'options' | 'status' | 'onChange'> {
  options: readonly AppSelectOption<T>[];
  size?: ControlSize;
  error?: boolean;
  /** Accessible name; a visible `<label htmlFor>` pointing at `id` works too. */
  'aria-label'?: string;
  onChange?: (value: T) => void;
}

/** Dropdown with the app look. The popup is rendered under <body>, so no card can clip it. */
export function AppSelect<T extends string | number = string>({
  options,
  size = 'md',
  error = false,
  onChange,
  ...rest
}: AppSelectProps<T>) {
  return (
    <Select<T>
      size={SIZE[size]}
      status={error ? 'error' : undefined}
      options={options as unknown as SelectProps<T>['options']}
      onChange={(value) => onChange?.(value)}
      {...rest}
    />
  );
}
