import Button from 'antd/es/button';
import type { ButtonProps } from 'antd';
import type { ReactNode, Ref } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ControlSize = 'sm' | 'md' | 'lg';

const TYPE = { primary: 'primary', secondary: 'default', ghost: 'text', link: 'link' } as const;
const SIZE = { sm: 'small', md: 'middle', lg: 'large' } as const;

export interface AppButtonProps
  extends Omit<ButtonProps, 'type' | 'size' | 'danger' | 'variant' | 'color' | 'icon' | 'loading' | 'disabled'> {
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  danger?: boolean;
  /** Ref of the underlying element (focus management). */
  buttonRef?: Ref<HTMLButtonElement | HTMLAnchorElement>;
}

type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

function assign(ref: Ref<ButtonElement> | undefined, node: ButtonElement | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/** The one button of the app: same props in every screen, themed by the central tokens. */
export function AppButton({ variant = 'secondary', size = 'md', buttonRef, ref, ...rest }: AppButtonProps & { ref?: Ref<ButtonElement> }) {
  // A Tooltip around the button also wants the element, so both refs are honored.
  const merged = (node: ButtonElement | null) => {
    assign(ref, node);
    assign(buttonRef, node);
  };
  return <Button ref={merged} type={TYPE[variant]} size={SIZE[size]} {...rest} />;
}
