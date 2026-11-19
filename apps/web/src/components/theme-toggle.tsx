import { useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'insighthub-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this visit only.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="btn btn-sm"
      aria-pressed={theme === 'dark'}
      onClick={toggle}
      title="Alternar entre tema claro e escuro"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
      Tema escuro
    </button>
  );
}
