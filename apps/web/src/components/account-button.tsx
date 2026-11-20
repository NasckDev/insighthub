import { AppAvatar, AppButton, UserOutlined, type AppButtonProps } from '../ui';

export const ACCOUNT_LABEL = 'Menu da conta';

/** Avatar button of the header. It forwards every prop, because the Dropdown clones it to attach its trigger. */
export function AccountButton(props: Omit<AppButtonProps, 'children' | 'icon' | 'variant' | 'aria-label'>) {
  return (
    <AppButton
      {...props}
      variant="ghost"
      aria-label={ACCOUNT_LABEL}
      icon={
        <AppAvatar size="sm" background="var(--ih-primary)">
          <UserOutlined />
        </AppAvatar>
      }
    />
  );
}
