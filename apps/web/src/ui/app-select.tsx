import type { SelectProps } from 'antd';
import { lazy, Suspense } from 'react';
import type { ControlSize } from './app-button';
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

const LazySelect = lazy(() => import('./select-field'));

/**
 * Dropdown with the app look. The popup is rendered under <body>, so no card can clip it. The component
 * loads on demand and shows a field-shaped placeholder meanwhile.
 */
export function AppSelect<T extends string | number = string>(props: AppSelectProps<T>) {
  const Component = LazySelect as unknown as (p: AppSelectProps<T>) => React.JSX.Element;
  return (
    <Suspense fallback={<span className="ih-select-fallback" style={props.style} aria-hidden="true" />}>
      <Component {...props} />
    </Suspense>
  );
}
