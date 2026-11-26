import { SYNTHESIS_TEMPLATES } from '@insighthub/core';
import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import { formatNumber } from '../lib/format';
import { useSurveyId } from '../lib/use-survey-search';
import { ArrowRightOutlined, ThunderboltOutlined } from '../ui';

const PANEL_QUESTIONS = 3;

/**
 * Dark "Síntese assistida" panel of the dashboard. It does not generate anything by itself (with the API
 * connected, every synthesis is a model call): it shows what the synthesis is and opens it with a ready
 * question, keeping the filters of the current view.
 */
export function SynthesisPanel({ total }: { total: number }) {
  const surveyId = useSurveyId();
  const headingId = useId();
  return (
    <section className="ih-synth-panel" aria-labelledby={headingId}>
      <div className="ih-row ih-between ih-gap-2 ih-nowrap">
        <h2 id={headingId} className="ih-synth-panel-title">
          <ThunderboltOutlined />
          Síntese assistida
        </h2>
        <span className="ih-synth-panel-chip">{formatNumber(total)} respostas</span>
      </div>
      <p className="ih-synth-panel-text">
        Um resumo do que as pessoas dizem neste recorte. Toda afirmação leva um número, como{' '}
        <span className="ih-synth-panel-cite">[1]</span>, que abre a resposta de origem.
      </p>
      <ul className="ih-synth-panel-list" aria-label="Perguntas prontas">
        {SYNTHESIS_TEMPLATES.slice(0, PANEL_QUESTIONS).map((template) => (
          <li key={template.id}>
            <Link to="/s/$surveyId/sintese" params={{ surveyId }} search={(previous) => ({ ...previous, tpl: template.id })}>
              <span>{template.label}</span>
              <ArrowRightOutlined />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
