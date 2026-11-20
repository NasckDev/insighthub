import type { ResponseFilters } from './filters';
import type { NpsCategory } from './types';

export type SynthesisFocus = 'overview' | 'problems' | 'strengths' | 'opportunities';

export interface SynthesisTemplate {
  id: string;
  label: string;
  description: string;
  focus: SynthesisFocus;
  /** Filters forced on top of the ones in the URL. */
  overrides: Pick<ResponseFilters, 'nps' | 'plan'>;
}

export const SYNTHESIS_TEMPLATES: readonly SynthesisTemplate[] = [
  {
    id: 'executive',
    label: 'Resumo executivo',
    description: 'Visão geral para a diretoria: NPS, temas mais citados e próximos passos.',
    focus: 'overview',
    overrides: {},
  },
  {
    id: 'detractors',
    label: 'Por que há detratores?',
    description: 'Lê só as notas de 0 a 6 e ordena os temas pelo que mais incomoda.',
    focus: 'problems',
    overrides: { nps: 'detractor' as NpsCategory },
  },
  {
    id: 'promoters',
    label: 'O que os promotores valorizam',
    description: 'Lê só as notas 9 e 10 para saber o que proteger e comunicar.',
    focus: 'strengths',
    overrides: { nps: 'promoter' as NpsCategory },
  },
  {
    id: 'free-risk',
    label: 'Risco de perda no plano Free',
    description: 'Foca em quem está no plano gratuito e ainda não se convenceu do valor.',
    focus: 'problems',
    overrides: { plan: ['free'] },
  },
  {
    id: 'opportunities',
    label: 'Oportunidades de produto',
    description: 'Temas onde neutros e detratores concentram os pedidos de melhoria.',
    focus: 'opportunities',
    overrides: {},
  },
];

export const DEFAULT_TEMPLATE_ID = 'executive';

export function findTemplate(id: string): SynthesisTemplate | undefined {
  return SYNTHESIS_TEMPLATES.find((template) => template.id === id);
}

/** Merges a template's forced filters over the user's filters. */
export function applyTemplate(template: SynthesisTemplate, filters: ResponseFilters): ResponseFilters {
  return { ...filters, ...template.overrides };
}
