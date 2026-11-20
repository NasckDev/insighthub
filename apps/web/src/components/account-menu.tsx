import { AppDropdown, type AppMenuItem } from '../ui';
import { AccountButton } from './account-button';

/** Avatar button with its dropdown. Loaded after the first paint. */
export default function AccountMenu({ items }: { items: readonly AppMenuItem[] }) {
  return (
    <AppDropdown items={items}>
      <AccountButton />
    </AppDropdown>
  );
}
