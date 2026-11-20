const FIRST = ['Ana', 'Bruno', 'Camila', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olívia', 'Paulo', 'Rafaela', 'Sérgio', 'Tatiana', 'Vinícius', 'Yasmin', 'Rodrigo', 'Beatriz', 'Thiago'];
const LAST = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferraz', 'Gomes', 'Horta', 'Ibrahim', 'Junqueira', 'Lima', 'Machado', 'Nogueira', 'Oliveira', 'Pacheco', 'Queiroz', 'Ramos', 'Siqueira', 'Teixeira', 'Vasconcelos'];
const AVATAR_TONES = ['#0f766e', '#7a4e8c', '#b23a27', '#8a5a00', '#1b1b3a', '#2b6cb0'];

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  }
  return value >>> 0;
}

export interface Person {
  name: string;
  initials: string;
  tone: string;
}

/** Fictional name and avatar derived from the respondent id, so the same id is always the same person. */
export function personOf(respondentId: string): Person {
  const seed = hash(respondentId);
  const first = FIRST[seed % FIRST.length] as string;
  const last = LAST[Math.floor(seed / FIRST.length) % LAST.length] as string;
  return {
    name: `${first} ${last}`,
    initials: `${first.charAt(0)}${last.charAt(0)}`,
    tone: AVATAR_TONES[seed % AVATAR_TONES.length] as string,
  };
}
