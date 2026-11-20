import Select from 'antd/es/select';
import type { SelectProps } from 'antd';
import type { AppSelectProps } from './app-select';

const SIZE = { sm: 'small', md: 'middle', lg: 'large' } as const;

/** Implementation behind `AppSelect`: the dropdown (rc-select, virtual list) loads on demand. */
export default function SelectField<T extends string | number = string>({
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
