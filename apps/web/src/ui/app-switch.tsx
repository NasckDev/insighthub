import Switch from 'antd/es/switch';
import type { SwitchProps } from 'antd';

export interface AppSwitchProps extends Omit<SwitchProps, 'size'> {
  /** Required: a switch without a name is announced as "switch, on". */
  'aria-label': string;
  size?: 'sm' | 'md';
}

export function AppSwitch({ size = 'md', ...rest }: AppSwitchProps) {
  return <Switch size={size === 'sm' ? 'small' : 'default'} {...rest} />;
}
