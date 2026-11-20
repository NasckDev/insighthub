import { SHORTCUT_GROUPS } from '../lib/shortcuts';
import { Modal } from './modal';

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Atalhos de teclado" onClose={onClose} size="md">
      <div className="flex flex-col gap-6">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="eyebrow mb-2">{group.title}</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {group.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 text-sm">
                  <span>{item.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {item.keys.map((key, index) => (
                      <span key={key} className="flex items-center gap-1.5">
                        {index > 0 ? (
                          <span className="text-xs text-muted">{item.joiner === 'depois' ? 'depois' : item.joiner ?? '+'}</span>
                        ) : null}
                        <kbd className="kbd">{key}</kbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
