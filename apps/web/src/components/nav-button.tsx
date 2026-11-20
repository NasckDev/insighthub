import { useNavigate, useRouter } from '@tanstack/react-router';
import type { MouseEvent } from 'react';
import { AppButton, type AppButtonProps } from '../ui';

interface NavButtonProps extends Omit<AppButtonProps, 'href' | 'onClick'> {
  to: string;
  params?: Record<string, string>;
  search?: unknown;
}

/**
 * A button that is a real link: the address is in the `href` (open in a new tab, copy the link), and a
 * plain click is handled by the router without reloading the page.
 */
export function NavButton({ to, params, search, children, ...buttonProps }: NavButtonProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const target = { to, params, search } as never;
  const href = router.history.createHref(router.buildLocation(target).href);

  function onClick(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void navigate(target);
  }

  return (
    <AppButton href={href} onClick={onClick} {...buttonProps}>
      {children}
    </AppButton>
  );
}
