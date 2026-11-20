import { Input, type GetProps, type InputProps, type InputRef } from 'antd';
import type { Ref } from 'react';
import { AppIconButton } from './app-button';
import { CloseCircleFilled, SearchOutlined } from './icons';
import type { ControlSize } from './app-button';

const SIZE = { sm: 'small', md: 'middle', lg: 'large' } as const;

export type AppInputRef = InputRef;

export interface AppInputProps extends Omit<InputProps, 'size' | 'status'> {
  size?: ControlSize;
  /** Marks the field as invalid and links the message to it. */
  error?: boolean;
  inputRef?: Ref<InputRef>;
}

export function AppInput({ size = 'md', error = false, inputRef, ...rest }: AppInputProps) {
  return <Input ref={inputRef} size={SIZE[size]} status={error ? 'error' : undefined} aria-invalid={error || undefined} {...rest} />;
}

export interface AppSearchInputProps extends Omit<AppInputProps, 'prefix' | 'suffix' | 'type' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
  onClear?: () => void;
}

/** Search box with a magnifier and its own labelled clear button (44 px on touch screens). */
export function AppSearchInput({ value, onChange, clearLabel = 'Limpar a busca', onClear, className, ...rest }: AppSearchInputProps) {
  return (
    <AppInput
      {...rest}
      type="search"
      className={`ih-search-field ${className ?? ''}`}
      value={value}
      prefix={<SearchOutlined aria-hidden="true" />}
      suffix={
        value ? (
          <AppIconButton
            label={clearLabel}
            size="sm"
            icon={<CloseCircleFilled />}
            onClick={() => {
              onChange('');
              onClear?.();
            }}
          />
        ) : null
      }
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

type TextAreaProps = GetProps<typeof Input.TextArea>;

export type AppTextAreaProps = Omit<TextAreaProps, 'size' | 'status'> & {
  error?: boolean;
};

export function AppTextArea({ error = false, ...rest }: AppTextAreaProps) {
  return <Input.TextArea status={error ? 'error' : undefined} aria-invalid={error || undefined} {...rest} />;
}

export function AppPasswordInput({ size = 'md', ...rest }: Omit<AppInputProps, 'type'>) {
  return <Input.Password size={SIZE[size]} {...rest} />;
}
