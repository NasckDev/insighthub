import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'insighthub-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Flips and remembers the theme. Also used by the command palette and the `T` shortcut. */
export function applyNextTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this visit only.
  }
  window.dispatchEvent(new Event('insighthub-theme'));
  return next;
}

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  return (
    <button
      type="button"
      className={`btn btn-sm ${showLabel ? '' : 'btn-icon'}`}
      aria-pressed={theme === 'dark'}
      aria-label={showLabel ? undefined : 'Tema escuro'}
      onClick={() => setTheme(applyNextTheme())}
      title="Alternar entre tema claro e escuro (T)"
    >
      {theme === 'dark' ? <Moon aria-hidden="true" size={16} /> : <Sun aria-hidden="true" size={16} />}
      {showLabel ? 'Tema escuro' : null}
    </button>
  );
}
