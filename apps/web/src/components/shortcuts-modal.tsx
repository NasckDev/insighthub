import { SHORTCUT_GROUPS } from '../lib/shortcuts';
import { AppKbd, AppModal, AppStack, AppText, AppTitle } from '../ui';

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <AppModal open title="Atalhos de teclado" onClose={onClose} size="md">
      <AppStack gap={5}>
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <div style={{ marginBottom: 'var(--ih-space-2)' }}>
              <AppTitle level={3}>{group.title}</AppTitle>
            </div>
            <ul className="ih-stack ih-gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {group.items.map((item) => (
                <li key={item.label} className="ih-row ih-between ih-gap-4 ih-nowrap">
                  <span>{item.label}</span>
                  <span className="ih-row ih-gap-2 ih-nowrap" style={{ flexShrink: 0 }}>
                    {item.keys.map((key, index) => (
                      <span key={key} className="ih-row ih-gap-1 ih-nowrap">
                        {index > 0 ? <AppText tone="muted" small>{item.joiner === 'depois' ? 'depois' : (item.joiner ?? '+')}</AppText> : null}
                        <AppKbd>{key}</AppKbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </AppStack>
    </AppModal>
  );
}
