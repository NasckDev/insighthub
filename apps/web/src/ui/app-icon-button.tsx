import type { ReactNode } from 'react';
import { AppButton, type AppButtonProps } from './app-button';

export interface AppIconButtonProps extends Omit<AppButtonProps, 'children' | 'icon'> {
  /** Required: the accessible name and the hover hint. */
  label: string;
  icon: ReactNode;
}

/**
 * Button with only an icon. It always has an accessible name, and the same text as a native hover hint
 * (`title`): the Ant Design Tooltip would bring its popup and form-context code into the first load.
 */
export function AppIconButton({ label, icon, variant = 'ghost', size = 'md', ...rest }: AppIconButtonProps) {
  return <AppButton variant={variant} size={size} icon={icon} aria-label={label} title={label} {...rest} />;
}
