import { applyTemplate, DEFAULT_TEMPLATE_ID, findTemplate, SYNTHESIS_TEMPLATES, type Insight, type SynthesisTemplate } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useClient } from '../components/app-context';
import { useConnection } from '../components/connection';
import { NavButton } from '../components/nav-button';
import { PartialNotice } from '../components/states';
import { SynthesisText } from '../components/synthesis-text';
import { getBoardStore, newInsightId } from '../lib/board-store';
import { formatNumber } from '../lib/format';
import { describeFilters } from '../lib/scope';
import { filtersOf, hasActiveFilters, type SurveySearch } from '../lib/search';
import { useSynthesis, type SynthesisState, type SynthesisStatus } from '../lib/use-synthesis';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppButton,
  AppCard,
  AppEmpty,
  AppForm,
  AppFormItem,
  AppInput,
  AppModal,
  AppParagraph,
  AppRadioCards,
  AppStack,
  AppText,
  AppTextArea,
  AppTitle,
  CheckCircleFilled,
  PushpinOutlined,
  ReloadOutlined,
  StopOutlined,
  ThunderboltOutlined,
  useToast,
} from '../ui';

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

interface SaveValues {
  title: string;
  note?: string;
}

const TITLE_MAX = 120;
const NOTE_MAX = 1000;

function SaveDialog({ defaultTitle, onClose, onSave }: { defaultTitle: string; onClose: () => void; onSave: (title: string, note: string) => void }) {
  const [title, setTitle] = useState(defaultTitle);
  const [note, setNote] = useState('');
  const titleId = useId();
  const noteId = useId();
  const invalid = title.trim().length === 0;
  return (
    <AppModal open title="Salvar no quadro" onClose={onClose} size="sm">
      <AppForm<SaveValues> name="save-insight" onSubmit={() => {
          if (!invalid) onSave(title.trim(), note.trim());
        }}>
        <AppFormItem label="Título do insight" htmlFor={titleId} validateStatus={invalid ? 'error' : undefined} help={invalid ? <span role="alert">Dê um título para encontrar este insight depois.</span> : undefined}>
          <AppInput id={titleId} value={title} maxLength={TITLE_MAX} error={invalid} onChange={(event) => setTitle(event.target.value)} />
        </AppFormItem>
        <AppFormItem label="Sua nota (opcional)" htmlFor={noteId}>
          <AppTextArea id={noteId} rows={3} maxLength={NOTE_MAX} value={note} placeholder="O que isso significa para o time? Qual a próxima ação?" onChange={(event) => setNote(event.target.value)} />
        </AppFormItem>
        <div className="ih-row ih-end ih-gap-2">
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton variant="primary" htmlType="submit" icon={<PushpinOutlined />} disabled={invalid}>
            Salvar insight
          </AppButton>
        </div>
      </AppForm>
    </AppModal>
  );
}

const MAX_BODY_LENGTH = 8000;
const MAX_CITATIONS = 30;
const MAX_QUOTE_LENGTH = 600;
const MOBILE_SCROLL_MAX_WIDTH = 1200;

function buildInsight(state: SynthesisState, template: SynthesisTemplate, survey: { id: string; title: string }, scope: string, title: string, note: string): Insight {
  return {
    id: newInsightId(),
    title,
    note,
    body: state.text.slice(0, MAX_BODY_LENGTH),
    citations: state.citations.slice(0, MAX_CITATIONS).map((citation) => ({ responseId: citation.responseId, quote: citation.quote.slice(0, MAX_QUOTE_LENGTH) })),
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
  const articleRef = useRef<HTMLDivElement>(null);
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
    if (!hasText || window.innerWidth >= MOBILE_SCROLL_MAX_WIDTH) return;
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
    <AppStack gap={5}>
      <AppCard role="region" aria-label="Síntese assistida">
        <AppStack gap={4}>
          <div>
            <AppTitle level={2}>Pergunta</AppTitle>
            <AppParagraph tone="muted" small>
              Cada afirmação aponta para a resposta que a sustenta.
              {hasActiveFilters(search) ? ' Considera apenas as respostas dos filtros atuais.' : ''}
            </AppParagraph>
          </div>
          <AppRadioCards
            aria-label="Pergunta"
            value={template.id}
            onChange={(id) => patch({ tpl: id === DEFAULT_TEMPLATE_ID ? undefined : id })}
            options={SYNTHESIS_TEMPLATES.map((item) => ({ value: item.id, label: item.label, description: item.description }))}
          />
          <div className="ih-row ih-between ih-gap-3 ih-synthesis-actions">
            <p role="status" className="ih-muted" style={{ margin: 0, flex: '1 1 20rem' }}>
              <strong style={{ color: 'var(--ih-fg)' }}>{STATUS_TEXT[state.status]}</strong> Escopo: {scope}.{basisText(state)}
            </p>
            {isStreaming ? (
              <AppButton icon={<StopOutlined />} onClick={cancel}>
                Cancelar
              </AppButton>
            ) : (
              <AppButton variant="primary" icon={state.status === 'idle' ? <ThunderboltOutlined /> : <ReloadOutlined />} onClick={() => void start()}>
                {state.status === 'idle' ? 'Gerar síntese' : state.status === 'error' ? 'Tentar de novo' : 'Gerar de novo'}
              </AppButton>
            )}
          </div>
        </AppStack>
      </AppCard>

      {state.status === 'error' ? (
        <PartialNotice
          message={`${state.error ?? 'Falha ao gerar a síntese.'} ${hasText ? 'O texto abaixo está incompleto.' : ''}`}
          action={
            state.needsToken ? (
              <AppButton size="sm" variant="primary" onClick={connection.openDialog}>
                Informar token
              </AppButton>
            ) : undefined
          }
        />
      ) : null}
      {state.status === 'cancelled' && hasText ? (
        <PartialNotice message="Você cancelou a geração; o texto abaixo está incompleto. Use “Gerar de novo” para recomeçar." />
      ) : null}

      {hasText ? (
        <div ref={articleRef} className="ih-reveal">
          <AppCard role="article" aria-label="Texto da síntese" aria-busy={isStreaming}>
            <SynthesisText text={state.text} verifiedIds={verifiedIds} onOpenCitation={openCitation} />
            {isStreaming ? <span className="ih-caret" aria-hidden="true" /> : null}
            {state.status === 'done' ? (
              <div className="ih-row ih-gap-3 ih-synthesis-save">
                {savedAt === state.text ? (
                  <>
                    <AppText strong tone="promoter">
                      <CheckCircleFilled aria-hidden="true" /> Salvo no quadro
                    </AppText>
                    <NavButton size="sm" to="/s/$surveyId/quadro" params={{ surveyId }} search={{}}>
                      Ver quadro
                    </NavButton>
                  </>
                ) : (
                  <AppButton variant="primary" icon={<PushpinOutlined />} onClick={() => setSaving(true)}>
                    Salvar no quadro
                  </AppButton>
                )}
              </div>
            ) : null}
          </AppCard>
        </div>
      ) : null}

      {!hasText && state.status === 'idle' ? (
        <AppEmpty
          illustration="spark"
          title="Faça uma pergunta aos comentários"
          description="Escolha uma pergunta acima e clique em “Gerar síntese” para ler um resumo com citações clicáveis. Cada afirmação leva à resposta que a sustenta."
        />
      ) : null}

      {state.citations.length > 0 ? (
        <AppCard role="region" aria-label="Fontes citadas">
          <AppStack gap={3}>
            <AppTitle level={2}>Fontes citadas ({state.citations.length})</AppTitle>
            <ul className="ih-stack ih-gap-3" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {state.citations.map((citation) => (
                <li key={citation.responseId} className="ih-row ih-gap-2 ih-start">
                  <button type="button" className="ih-cite" aria-label={`Abrir resposta-fonte ${citation.responseId}`} onClick={() => openCitation(citation.responseId)}>
                    [#{citation.responseId}]
                  </button>
                  <span className="ih-quote ih-fill" style={{ flexBasis: '15rem', fontSize: '0.95rem' }}>
                    “{citation.quote}”
                  </span>
                </li>
              ))}
            </ul>
          </AppStack>
        </AppCard>
      ) : null}

      {saving ? <SaveDialog defaultTitle={`${template.label} · ${surveyTitle}`.slice(0, TITLE_MAX)} onClose={() => setSaving(false)} onSave={save} /> : null}
    </AppStack>
  );
}
