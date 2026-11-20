import type { ReactNode } from 'react';
import { ApiOutlined, AppButton, AppDrawer, AppMenu, AppStack, CompassOutlined, QuestionCircleOutlined, SearchOutlined, type AppNavItem } from '../ui';

interface MobileMenuProps {
  items: AppNavItem[];
  section: string;
  connectLabel: ReactNode;
  onClose: () => void;
  onShortcuts: () => void;
  onTour: () => void;
  onPalette: () => void;
  onConnect: () => void;
}

/** Menu of the phone and tablet layouts ("Mais opções"). Loaded when someone opens it. */
export default function MobileMenu({ items, section, connectLabel, onClose, onShortcuts, onTour, onPalette, onConnect }: MobileMenuProps) {
  const then = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <AppDrawer open title="Mais opções" onClose={onClose} placement="end" width={360}>
      <AppStack gap={4}>
        <nav aria-label="Todas as seções">
          <AppMenu aria-label="Todas as seções" items={items} selectedKey={section} />
        </nav>
        <AppStack gap={1}>
          <AppButton variant="ghost" block icon={<QuestionCircleOutlined />} onClick={then(onShortcuts)}>
            Atalhos de teclado
          </AppButton>
          <AppButton variant="ghost" block icon={<CompassOutlined />} onClick={then(onTour)}>
            Rever o tour
          </AppButton>
          <AppButton variant="ghost" block icon={<ApiOutlined />} onClick={then(onConnect)}>
            {connectLabel}
          </AppButton>
          <AppButton variant="ghost" block icon={<SearchOutlined />} onClick={then(onPalette)}>
            Paleta de comandos
          </AppButton>
        </AppStack>
      </AppStack>
    </AppDrawer>
  );
}
