import { useMemo } from 'react';
import { useClient } from '../components/app-context';
import { PartialNotice } from '../components/states';
import { SynthesisText } from '../components/synthesis-text';
import { formatNumber } from '../lib/format';
import { filtersOf, hasActiveFilters, type SurveySearch } from '../lib/search';
import { useSynthesis, type SynthesisStatus } from '../lib/use-synthesis';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

const STATUS_TEXT: Record<SynthesisStatus, string> = {
  idle: 'Pronta para gerar.',
  streaming: 'Gerando a síntese…',
  done: 'Síntese concluída.',
  cancelled: 'Geração cancelada.',
  error: 'A geração foi interrompida.',
};

export function SynthesisPage() {
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  // Remount (and so reset) when the survey or filters change: the old text would no longer match.
  const resetKey = JSON.stringify({ surveyId, filters: filtersOf(search) });
  return <SynthesisRun key={resetKey} surveyId={surveyId} search={search} />;
}

function SynthesisRun({ surveyId, search }: { surveyId: string; search: SurveySearch }) {
  const client = useClient();
  const patch = usePatchSearch();
  const filters = useMemo(() => filtersOf(search), [search]);
  const { state, start, cancel } = useSynthesis(client, surveyId, filters);
  const verifiedIds = useMemo(() => new Set(state.citations.map((c) => c.responseId)), [state.citations]);
  const isStreaming = state.status === 'streaming';
  const hasText = state.text.length > 0;
  const openCitation = (responseId: string) => patch({ r: responseId });

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-3" aria-label="Síntese assistida">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold">Síntese das respostas</h2>
            <p className="m-0 text-sm text-muted">
              Cada afirmação aponta para a resposta que a sustenta.
              {hasActiveFilters(search) ? ' Considera apenas as respostas dos filtros atuais.' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {isStreaming ? (
              <button type="button" className="btn" onClick={cancel}>
                Cancelar
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void start()}>
                {state.status === 'idle' ? 'Gerar síntese' : 'Gerar de novo'}
              </button>
            )}
          </div>
        </div>
        <p role="status" className="m-0 text-sm text-muted">
          {STATUS_TEXT[state.status]}
          {state.sourceCount !== undefined
            ? ` Baseada em ${formatNumber(state.sourceCount)} respostas · provedor ${state.provider}.`
            : ''}
        </p>
      </section>

      {state.status === 'error' ? (
        <PartialNotice
          message={`${state.error ?? 'Falha ao gerar a síntese.'} ${hasText ? 'O texto abaixo está incompleto.' : ''}`}
          onRetry={() => void start()}
        />
      ) : null}
      {state.status === 'cancelled' && hasText ? (
        <PartialNotice
          message="Você cancelou a geração; o texto abaixo está incompleto."
          onRetry={() => void start()}
        />
      ) : null}

      {hasText ? (
        <article className="card" aria-busy={isStreaming} aria-label="Texto da síntese">
          <div className={isStreaming ? 'streaming-caret' : undefined}>
            <SynthesisText text={state.text} verifiedIds={verifiedIds} onOpenCitation={openCitation} />
          </div>
        </article>
      ) : null}

      {!hasText && state.status === 'idle' ? (
        <div className="card text-center text-muted">
          Clique em <strong className="text-fg">Gerar síntese</strong> para ver o resumo com citações
          clicáveis.
        </div>
      ) : null}

      {state.citations.length > 0 ? (
        <section className="card" aria-label="Fontes citadas">
          <h3 className="m-0 mb-2 text-base font-semibold">Fontes citadas ({state.citations.length})</h3>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {state.citations.map((citation) => (
              <li key={citation.responseId} className="flex flex-wrap items-start gap-2">
                <button
                  type="button"
                  className="cite"
                  aria-label={`Abrir resposta-fonte ${citation.responseId}`}
                  onClick={() => openCitation(citation.responseId)}
                >
                  [#{citation.responseId}]
                </button>
                <span className="min-w-0 flex-1 basis-60 text-sm">“{citation.quote}”</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
