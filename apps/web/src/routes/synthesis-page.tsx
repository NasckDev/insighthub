import {
  applyTemplate,
  DEFAULT_TEMPLATE_ID,
  findTemplate,
  SYNTHESIS_TEMPLATES,
  type Insight,
  type SynthesisTemplate,
} from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bookmark, Check, CircleStop, RotateCw, Sparkles } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useClient } from '../components/app-context';
import { Illustration } from '../components/illustrations';
import { Modal } from '../components/modal';
import { m } from '../components/motion';
import { useConnection } from '../components/connection';
import { PartialNotice } from '../components/states';
import { SynthesisText } from '../components/synthesis-text';
import { useToast } from '../components/toast';
import { getBoardStore, newInsightId } from '../lib/board-store';
import { formatNumber } from '../lib/format';
import { describeFilters } from '../lib/scope';
import { filtersOf, hasActiveFilters, type SurveySearch } from '../lib/search';
import { useSynthesis, type SynthesisState, type SynthesisStatus } from '../lib/use-synthesis';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

/** Plain-language provider name: no internal identifiers on screen. */
export function providerLabel(provider: string | undefined): string {
  if (!provider) return '';
  if (provider === 'local-extractive') return 'gerada no seu navegador';
  if (provider.startsWith('claude:')) return `gerada pelo modelo ${provider.slice('claude:'.length)}`;
  return `gerada por ${provider}`;
}

/** "Baseada em 80 de 640 respostas": what the text read, versus everything that matched. */
export function basisText(state: Pick<SynthesisState, 'sourceCount' | 'totalCount' | 'truncated' | 'provider'>): string {
  if (state.sourceCount === undefined) return '';
  const read = formatNumber(state.sourceCount);
  const matched = state.totalCount !== undefined && state.totalCount !== state.sourceCount ? ` de ${formatNumber(state.totalCount)}` : '';
  const cut = state.truncated ? ' O limite da API cortou a seleção.' : '';
  return ` Baseada em ${read}${matched} respostas, ${providerLabel(state.provider)}.${cut}`;
}

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
  // Remount (and so reset) when the survey, filters or question change: the old text would no longer match.
  const resetKey = JSON.stringify({ surveyId, filters: filtersOf(search), tpl: search.tpl });
  return <SynthesisRun key={resetKey} surveyId={surveyId} search={search} />;
}

function TemplatePicker({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Pergunta" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SYNTHESIS_TEMPLATES.map((template) => {
        const active = template.id === selected;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(template.id)}
            className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left transition-colors ${
              active ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:bg-surface-2'
            }`}
            style={active ? { boxShadow: 'inset 0 0 0 1px var(--primary)' } : undefined}
          >
            <span className="flex items-center gap-2 font-semibold">
              {active ? <Check aria-hidden="true" size={16} className="text-promoter" /> : <Sparkles aria-hidden="true" size={16} className="text-muted" />}
              {template.label}
            </span>
            <span className="text-[13px] text-muted">{template.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function SaveDialog({
  defaultTitle,
  onClose,
  onSave,
}: {
  defaultTitle: string;
  onClose: () => void;
  onSave: (title: string, note: string) => void;
}) {
  const titleId = useId();
  const noteId = useId();
  const [title, setTitle] = useState(defaultTitle);
  const [note, setNote] = useState('');
  const invalid = title.trim().length === 0;
  return (
    <Modal title="Salvar no quadro" onClose={onClose} size="sm">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) onSave(title.trim(), note.trim());
        }}
      >
        <div>
          <label htmlFor={titleId} className="label">
            Título do insight
          </label>
          <input
            id={titleId}
            className="field w-full"
            value={title}
            maxLength={120}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${titleId}-err` : undefined}
            onChange={(event) => setTitle(event.target.value)}
          />
          {invalid ? (
            <p id={`${titleId}-err`} role="alert" className="m-0 mt-1 text-sm" style={{ color: 'var(--detractor)' }}>
              Dê um título para encontrar este insight depois.
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={noteId} className="label">
            Sua nota (opcional)
          </label>
          <textarea
            id={noteId}
            className="field w-full"
            rows={3}
            maxLength={1000}
            value={note}
            placeholder="O que isso significa para o time? Qual a próxima ação?"
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={invalid}>
            <Bookmark aria-hidden="true" size={16} />
            Salvar insight
          </button>
        </div>
      </form>
    </Modal>
  );
}

const MAX_BODY_LENGTH = 8000;
const MAX_CITATIONS = 30;

function buildInsight(
  state: SynthesisState,
  template: SynthesisTemplate,
  survey: { id: string; title: string },
  scope: string,
  title: string,
  note: string,
): Insight {
  return {
    id: newInsightId(),
    title,
    note,
    body: state.text.slice(0, MAX_BODY_LENGTH),
    citations: state.citations
      .slice(0, MAX_CITATIONS)
      .map((citation) => ({ responseId: citation.responseId, quote: citation.quote.slice(0, 600) })),
    surveyId: survey.id,
    surveyTitle: survey.title,
    question: template.label,
    scope,
    createdAt: new Date().toISOString(),
  };
}

function SynthesisRun({ surveyId, search }: { surveyId: string; search: SurveySearch }) {
  const client = useClient();
  const patch = usePatchSearch();
  const toast = useToast();
  const connection = useConnection();
  const articleRef = useRef<HTMLElement>(null);
  const template = findTemplate(search.tpl ?? DEFAULT_TEMPLATE_ID) ?? (SYNTHESIS_TEMPLATES[0] as SynthesisTemplate);
  const userFilters = useMemo(() => filtersOf(search), [search]);
  const filters = useMemo(() => applyTemplate(template, userFilters), [template, userFilters]);
  const { state, start, cancel } = useSynthesis(client, surveyId, filters, template.focus);
  const verifiedIds = useMemo(() => new Set(state.citations.map((c) => c.responseId)), [state.citations]);
  const surveys = useQuery({ queryKey: ['surveys'], queryFn: ({ signal }) => client.listSurveys({ signal }) });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const isStreaming = state.status === 'streaming';
  const hasText = state.text.length > 0;
  const scope = describeFilters(filters);
  const surveyTitle = surveys.data?.find((survey) => survey.id === surveyId)?.title ?? surveyId;
  const openCitation = (responseId: string) => patch({ r: responseId });

  // On a phone the controls fill the screen, so bring the text into view as soon as it starts.
  useEffect(() => {
    if (!hasText || window.innerWidth >= 1024) return;
    const quiet = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    articleRef.current?.scrollIntoView({ block: 'start', behavior: quiet ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === 'streaming' && hasText]);

  function save(title: string, note: string) {
    const saved = getBoardStore().add(buildInsight(state, template, { id: surveyId, title: surveyTitle }, scope, title, note));
    setSaving(false);
    if (!saved) {
      toast({ kind: 'error', message: 'Não foi possível salvar: confira o título e tente de novo.' });
      return;
    }
    setSavedAt(state.text);
    toast({ message: `Insight “${title}” salvo no quadro.`, durationMs: 7000 });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-4" aria-label="Síntese assistida">
        <div>
          <h2 className="display m-0 text-xl">Pergunta</h2>
          <p className="m-0 text-sm text-muted">
            Cada afirmação aponta para a resposta que a sustenta.
            {hasActiveFilters(search) ? ' Considera apenas as respostas dos filtros atuais.' : ''}
          </p>
        </div>
        <TemplatePicker selected={template.id} onSelect={(id) => patch({ tpl: id === DEFAULT_TEMPLATE_ID ? undefined : id })} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p role="status" className="m-0 text-sm text-muted">
            <span className="font-semibold text-fg">{STATUS_TEXT[state.status]}</span> Escopo: {scope}.
            {basisText(state)}
          </p>
          <div className="flex gap-2">
            {isStreaming ? (
              <button type="button" className="btn" onClick={cancel}>
                <CircleStop aria-hidden="true" size={16} />
                Cancelar
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void start()}>
                {state.status === 'idle' ? <Sparkles aria-hidden="true" size={16} /> : <RotateCw aria-hidden="true" size={16} />}
                {state.status === 'idle' ? 'Gerar síntese' : state.status === 'error' ? 'Tentar de novo' : 'Gerar de novo'}
              </button>
            )}
          </div>
        </div>
      </section>

      {state.status === 'error' ? (
        <PartialNotice
          message={`${state.error ?? 'Falha ao gerar a síntese.'} ${hasText ? 'O texto abaixo está incompleto.' : ''}`}
          action={
            state.needsToken ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={connection.openDialog}>
                Informar token
              </button>
            ) : undefined
          }
        />
      ) : null}
      {state.status === 'cancelled' && hasText ? (
        <PartialNotice message="Você cancelou a geração; o texto abaixo está incompleto. Use “Gerar de novo” para recomeçar." />
      ) : null}

      {hasText ? (
        <m.article
          ref={articleRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          aria-busy={isStreaming}
          aria-label="Texto da síntese"
        >
          <SynthesisText text={state.text} verifiedIds={verifiedIds} onOpenCitation={openCitation} />
          {isStreaming ? <span className="caret" aria-hidden="true" /> : null}
          {state.status === 'done' ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              {savedAt === state.text ? (
                <>
                  <span className="flex items-center gap-2 text-sm font-semibold text-promoter">
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="11" fill="var(--primary-soft)" />
                      <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" style={{ animation: 'check-draw 0.5s ease-out both' }} />
                    </svg>
                    Salvo no quadro
                  </span>
                  <Link to="/s/$surveyId/quadro" params={{ surveyId }} search={{} as never} className="btn btn-sm">
                    Ver quadro
                  </Link>
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setSaving(true)}>
                  <Bookmark aria-hidden="true" size={16} />
                  Salvar no quadro
                </button>
              )}
            </div>
          ) : null}
        </m.article>
      ) : null}

      {!hasText && state.status === 'idle' ? (
        <div className="card flex flex-col items-center gap-2 py-8 text-center text-muted">
          <Illustration name="spark" />
          <p className="m-0 max-w-md">
            Escolha uma pergunta e clique em <strong className="text-fg">Gerar síntese</strong> para ver o resumo com
            citações clicáveis.
          </p>
        </div>
      ) : null}

      {state.citations.length > 0 ? (
        <section className="card" aria-label="Fontes citadas">
          <h2 className="display m-0 mb-3 text-xl">Fontes citadas ({state.citations.length})</h2>
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
                <span className="quote min-w-0 flex-1 basis-60 text-[15px]">“{citation.quote}”</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {saving ? (
        <SaveDialog defaultTitle={`${template.label} · ${surveyTitle}`.slice(0, 120)} onClose={() => setSaving(false)} onSave={save} />
      ) : null}
    </div>
  );
}
