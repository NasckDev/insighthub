import {
  decodeShare,
  encodeShare,
  insightsToCsv,
  insightsToMarkdown,
  type Insight,
} from '@insighthub/core';
import { Link } from '@tanstack/react-router';
import { Download, FileText, Link2, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Illustration } from '../components/illustrations';
import { Reveal } from '../components/motion';
import { SynthesisText } from '../components/synthesis-text';
import { useToast } from '../components/toast';
import { getBoardStore, useBoard } from '../lib/board-store';
import { downloadText } from '../lib/download';
import { formatDateTime } from '../lib/format';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';

function InsightCard({
  insight,
  index,
  readOnly,
  onOpenCitation,
}: {
  insight: Insight;
  index: number;
  readOnly?: boolean;
  onOpenCitation: (id: string) => void;
}) {
  const store = getBoardStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(insight.title);
  const [note, setNote] = useState(insight.note);
  const titleId = useId();
  const noteId = useId();
  const verified = useMemo(() => new Set(insight.citations.map((c) => c.responseId)), [insight.citations]);
  const invalid = title.trim().length === 0;

  function remove() {
    const position = store.get().findIndex((item) => item.id === insight.id);
    store.remove(insight.id);
    toast({
      message: `Insight “${insight.title}” excluído.`,
      kind: 'info',
      durationMs: 8000,
      action: { label: 'Desfazer', onClick: () => store.restore(insight, Math.max(0, position)) },
    });
  }

  return (
    <Reveal index={index}>
      <article className="card flex flex-col gap-4" aria-label={insight.title}>
        {editing ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (invalid) return;
              store.update(insight.id, { title: title.trim(), note: note.trim() });
              setEditing(false);
              toast({ message: 'Insight atualizado.' });
            }}
          >
            <div>
              <label htmlFor={titleId} className="label">
                Título
              </label>
              <input id={titleId} className="field w-full" value={title} maxLength={120} aria-invalid={invalid} onChange={(e) => setTitle(e.target.value)} />
              {invalid ? (
                <p role="alert" className="m-0 mt-1 text-sm" style={{ color: 'var(--detractor)' }}>
                  O título não pode ficar vazio.
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={noteId} className="label">
                Nota
              </label>
              <textarea id={noteId} className="field w-full" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={invalid}>
                Salvar alterações
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setTitle(insight.title);
                  setNote(insight.note);
                  setEditing(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">
                {insight.question} · {formatDateTime(insight.createdAt)}
              </p>
              <h2 className="display m-0 mt-1 text-2xl">{insight.title}</h2>
              <p className="m-0 mt-1 text-sm text-muted">
                {insight.surveyTitle} · {insight.scope}
              </p>
            </div>
            {readOnly ? null : (
              <div className="flex shrink-0 gap-1">
                <button type="button" className="btn btn-sm btn-icon" aria-label={`Editar ${insight.title}`} onClick={() => setEditing(true)}>
                  <Pencil aria-hidden="true" size={15} />
                </button>
                <button type="button" className="btn btn-sm btn-icon btn-danger" aria-label={`Excluir ${insight.title}`} onClick={remove}>
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            )}
          </header>
        )}
        {!editing && insight.note ? (
          <p className="m-0 rounded-xl border-l-4 border-accent bg-accent-soft p-3 text-sm">{insight.note}</p>
        ) : null}
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-promoter">Ler a síntese completa</summary>
          <div className="mt-3">
            <SynthesisText text={insight.body} verifiedIds={verified} onOpenCitation={onOpenCitation} />
          </div>
        </details>
      </article>
    </Reveal>
  );
}

export function BoardPage() {
  const surveyId = useSurveyId();
  const search = useSurveySearch();
  const patch = usePatchSearch();
  const toast = useToast();
  const board = useBoard();
  const shared = useMemo(() => (search.share ? decodeShare(search.share) : []), [search.share]);
  const openCitation = (id: string) => patch({ r: id });

  async function copyShareLink() {
    const base = window.location.href.split('#')[0];
    const link = `${base}#/s/${surveyId}/quadro?share=${encodeShare(board)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ message: 'Link do quadro copiado. Quem abrir poderá importar os insights.' });
    } catch {
      toast({ kind: 'error', message: 'Não foi possível copiar o link neste navegador.' });
    }
  }

  function importShared() {
    const added = getBoardStore().merge(shared);
    patch({ share: undefined });
    toast({ message: added === 0 ? 'Todos esses insights já estavam no seu quadro.' : `${added} insights importados para o seu quadro.` });
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      {search.share ? (
        <section aria-label="Quadro compartilhado" className="card flex flex-col gap-3 border-primary">
          {shared.length === 0 ? (
            <>
              <h2 className="display m-0 text-xl">Link de quadro inválido</h2>
              <p className="m-0 text-sm text-muted">Este link está incompleto ou foi alterado, por isso nada foi importado.</p>
              <div>
                <button type="button" className="btn btn-sm" onClick={() => patch({ share: undefined })}>
                  Fechar aviso
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="display m-0 text-xl">
                Quadro compartilhado com você: {shared.length} {shared.length === 1 ? 'insight' : 'insights'}
              </h2>
              <ul className="m-0 list-disc pl-5 text-sm text-muted">
                {shared.map((insight) => (
                  <li key={insight.id}>{insight.title}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={importShared}>
                  Importar para o meu quadro
                </button>
                <button type="button" className="btn btn-sm" onClick={() => patch({ share: undefined })}>
                  Descartar
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {board.length === 0 ? (
        <section className="card flex flex-col items-center gap-2 py-12 text-center" aria-label="Quadro vazio">
          <Illustration name="board" />
          <h2 className="display m-0 mt-2 text-2xl">Seu quadro está vazio</h2>
          <p className="m-0 max-w-md text-muted">
            Gere uma síntese, leia com calma e salve o que merece virar decisão. Os insights ficam aqui, com as fontes.
          </p>
          <div className="mt-3">
            <Link to="/s/$surveyId/sintese" params={{ surveyId }} search={{} as never} className="btn btn-primary">
              <Sparkles aria-hidden="true" size={16} />
              Ir para a Síntese
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm text-muted" aria-live="polite">
              {board.length} {board.length === 1 ? 'insight salvo' : 'insights salvos'} neste navegador
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  downloadText(`insights-${stamp}.md`, insightsToMarkdown(board), 'text/markdown');
                  toast({ message: 'Markdown exportado.' });
                }}
              >
                <FileText aria-hidden="true" size={15} />
                Exportar Markdown
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  downloadText(`insights-${stamp}.csv`, `\uFEFF${insightsToCsv(board)}`, 'text/csv');
                  toast({ message: 'CSV exportado.' });
                }}
              >
                <Download aria-hidden="true" size={15} />
                Exportar CSV
              </button>
              <button type="button" className="btn btn-sm" onClick={() => void copyShareLink()}>
                <Link2 aria-hidden="true" size={15} />
                Copiar link compartilhável
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {board.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} onOpenCitation={openCitation} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
