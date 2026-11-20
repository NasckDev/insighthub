import Collapse from 'antd/es/collapse';
import type { ReactNode } from 'react';

export interface AppCollapseProps {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** One expandable section ("Ler a síntese completa"). */
export function AppCollapse({ label, children, defaultOpen = false }: AppCollapseProps) {
  return (
    <Collapse
      ghost
      defaultActiveKey={defaultOpen ? ['item'] : []}
      items={[{ key: 'item', label, children }]}
      styles={{ header: { paddingInline: 0, fontWeight: 600 }, body: { paddingInline: 0 } }}
    />
  );
}
