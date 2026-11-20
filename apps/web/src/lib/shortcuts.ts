export interface ShortcutGroup {
  title: string;
  items: { keys: string[]; label: string; joiner?: string }[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Geral',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Abrir a paleta de comandos (⌘ K no Mac)', joiner: '+' },
      { keys: ['?'], label: 'Mostrar esta lista de atalhos' },
      { keys: ['/'], label: 'Ir para a busca nos comentários' },
      { keys: ['T'], label: 'Alternar entre tema claro e escuro' },
      { keys: ['Esc'], label: 'Fechar painel, janela ou paleta' },
    ],
  },
  {
    title: 'Ir para (aperte G e depois a letra)',
    items: [
      { keys: ['G', 'P'], label: 'Painel', joiner: 'depois' },
      { keys: ['G', 'R'], label: 'Respostas', joiner: 'depois' },
      { keys: ['G', 'T'], label: 'Temas', joiner: 'depois' },
      { keys: ['G', 'C'], label: 'Comparar segmentos', joiner: 'depois' },
      { keys: ['G', 'S'], label: 'Síntese com IA', joiner: 'depois' },
      { keys: ['G', 'Q'], label: 'Quadro de insights', joiner: 'depois' },
    ],
  },
  {
    title: 'Em gráficos',
    items: [
      { keys: ['←', '→'], label: 'Percorrer os pontos de um gráfico focado', joiner: 'ou' },
    ],
  },
];

export const GO_TARGETS = {
  p: 'visao-geral',
  r: 'respostas',
  t: 'temas',
  c: 'comparar',
  s: 'sintese',
  q: 'quadro',
} as const;

export type GoKey = keyof typeof GO_TARGETS;

/** True when a key press should be ignored because the user is typing somewhere. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
