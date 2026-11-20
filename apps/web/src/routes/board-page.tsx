import { decodeShare, encodeShare, isShareTooLarge, insightsToCsv, insightsToMarkdown, type Insight } from '@insighthub/core';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { NavButton } from '../components/nav-button';
import { SynthesisText } from '../components/synthesis-text';
import { getBoardStore, useBoard } from '../lib/board-store';
import { downloadText } from '../lib/download';
import { formatDateTime, plural } from '../lib/format';
import { usePatchSearch, useSurveyId, useSurveySearch } from '../lib/use-survey-search';
import {
  AppButton,
  AppCard,
  AppCollapse,
  AppEmpty,
  AppForm,
  AppFormItem,
  AppGrid,
  AppIconButton,
  AppInput,
  AppParagraph,
  AppReveal,
  AppStack,
  AppTextArea,
  AppTitle,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileMarkdownOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  useToast,
} from '../ui';

const TITLE_MAX = 120;
const NOTE_MAX = 1000;
const UNDO_MS = 8000;

interface EditValues {
  title: string;
  note?: string;
}

function InsightCard({ insight, index, readOnly, onOpenCitation }: { insight: Insight; index: number; readOnly?: boolean; onOpenCitation: (id: string) => void }) {
  const store = getBoardStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(insight.title);
  const [note, setNote] = useState(insight.note);
  const editRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  const titleId = useId();
  const noteId = useId();
  const verified = useMemo(() => new Set(insight.citations.map((c) => c.responseId)), [insight.citations]);
  const invalid = title.trim().length === 0;

  // Entering edit mode moves focus to the title; leaving it hands focus back to the Edit button.
  useEffect(() => {
    if (editing) document.getElementById(titleId)?.focus();
    else if (wasEditing.current) editRef.current?.focus();
    wasEditing.current = editing;
  }, [editing, titleId]);

  function remove() {
    const position = store.get().findIndex((item) => item.id === insight.id);
    store.remove(insight.id);
    toast({
      message: `Insight “${insight.title}” excluído.`,
      kind: 'info',
      durationMs: UNDO_MS,
      action: { label: 'Desfazer', onClick: () => store.restore(insight, Math.max(0, position)) },
    });
  }

  function cancelEdit() {
    setTitle(insight.title);
    setNote(insight.note);
    setEditing(false);
  }

  return (
    <AppReveal index={index}>
      <AppCard role="article" aria-label={insight.title} data-editing={editing ? 'true' : undefined} fullHeight>
        <AppStack gap={4}>
          {editing ? (
            <AppForm<EditValues>
              name={`edit-${insight.id}`}
              onSubmit={() => {
                if (invalid) return;
                store.update(insight.id, { title: title.trim(), note: note.trim() });
                setEditing(false);
                toast({ message: 'Insight atualizado.' });
              }}
            >
              <AppFormItem label="Título" htmlFor={titleId} validateStatus={invalid ? 'error' : undefined} help={invalid ? <span role="alert">O título não pode ficar vazio.</span> : undefined}>
                <AppInput id={titleId} value={title} maxLength={TITLE_MAX} error={invalid} onChange={(event) => setTitle(event.target.value)} />
              </AppFormItem>
              <AppFormItem label="Nota" htmlFor={noteId}>
                <AppTextArea id={noteId} rows={3} maxLength={NOTE_MAX} value={note} onChange={(event) => setNote(event.target.value)} />
              </AppFormItem>
              <div className="ih-row ih-gap-2">
                <AppButton variant="primary" size="sm" htmlType="submit" disabled={invalid}>
                  Salvar alterações
                </AppButton>
                <AppButton size="sm" onClick={cancelEdit}>
                  Cancelar
                </AppButton>
              </div>
            </AppForm>
          ) : (
            <header className="ih-row ih-between ih-start ih-gap-3 ih-nowrap">
              <div className="ih-fill">
                <p className="ih-eyebrow">
                  {insight.question} · {formatDateTime(insight.createdAt)}
                </p>
                <AppTitle level={2}>{insight.title}</AppTitle>
                <AppParagraph tone="muted" small>
                  {insight.surveyTitle} · {insight.scope}
                </AppParagraph>
              </div>
              {readOnly ? null : (
                <div className="ih-row ih-gap-1 ih-nowrap">
                  <AppIconButton buttonRef={editRef} label={`Editar ${insight.title}`} icon={<EditOutlined />} onClick={() => setEditing(true)} />
                  <AppIconButton label={`Excluir ${insight.title}`} icon={<DeleteOutlined />} danger onClick={remove} />
                </div>
              )}
            </header>
          )}
          {!editing && insight.note ? <p className="ih-note">{insight.note}</p> : null}
          <AppCollapse label="Ler a síntese completa">
            <SynthesisText text={insight.body} verifiedIds={verified} onOpenCitation={onOpenCitation} />
          </AppCollapse>
        </AppStack>
      </AppCard>
    </AppReveal>
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
  const stamp = new Date().toISOString().slice(0, 10);

  function exportMarkdown() {
    downloadText(`insights-${stamp}.md`, insightsToMarkdown(getBoardStore().get()), 'text/markdown');
    toast({ message: 'Markdown exportado.' });
  }

  async function copyShareLink() {
    const base = window.location.href.split('#')[0];
    const token = encodeShare(board);
    if (isShareTooLarge(token)) {
      toast({
        kind: 'error',
        durationMs: 12000,
        message: 'O quadro ficou grande demais para caber num link. Exporte em Markdown ou CSV para compartilhar.',
        action: { label: 'Exportar Markdown', onClick: exportMarkdown },
      });
      return;
    }
    const link = `${base}#/s/${surveyId}/quadro?share=${token}`;
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
    toast({ message: added === 0 ? 'Todos esses insights já estavam no seu quadro.' : `${plural(added, 'insight importado', 'insights importados')} para o seu quadro.` });
  }

  return (
    <AppStack gap={5}>
      {search.share ? (
        <AppCard role="region" aria-label="Quadro compartilhado">
          {shared.length === 0 ? (
            <AppStack gap={3}>
              <AppTitle level={2}>Link de quadro inválido</AppTitle>
              <AppParagraph tone="muted">Este link está incompleto ou foi alterado, por isso nada foi importado. Peça um novo link a quem compartilhou.</AppParagraph>
              <div>
                <AppButton size="sm" onClick={() => patch({ share: undefined })}>
                  Fechar aviso
                </AppButton>
              </div>
            </AppStack>
          ) : (
            <AppStack gap={3}>
              <AppTitle level={2}>
                Quadro compartilhado com você: {shared.length} {shared.length === 1 ? 'insight' : 'insights'}
              </AppTitle>
              <ul style={{ margin: 0, paddingLeft: 'var(--ih-space-5)' }} className="ih-muted">
                {shared.map((insight) => (
                  <li key={insight.id}>{insight.title}</li>
                ))}
              </ul>
              <div className="ih-row ih-gap-2">
                <AppButton variant="primary" size="sm" onClick={importShared}>
                  Importar para o meu quadro
                </AppButton>
                <AppButton size="sm" onClick={() => patch({ share: undefined })}>
                  Descartar
                </AppButton>
              </div>
            </AppStack>
          )}
        </AppCard>
      ) : null}

      {shared.length > 0 ? (
        <AppGrid columns={{ base: 1, lg: 2 }} role="group" aria-label="Prévia do quadro compartilhado">
          {shared.map((insight, index) => (
            <InsightCard key={`shared-${insight.id}`} insight={insight} index={index} readOnly onOpenCitation={openCitation} />
          ))}
        </AppGrid>
      ) : null}

      {board.length === 0 && shared.length === 0 ? (
        <AppCard role="region" aria-label="Quadro vazio">
          <AppEmpty
            framed={false}
            illustration="board"
            title="Seu quadro está vazio"
            description="Gere uma síntese, leia com calma e salve o que merece virar decisão. Os insights ficam aqui, com as fontes."
            action={
              <NavButton variant="primary" icon={<ThunderboltOutlined />} to="/s/$surveyId/sintese" params={{ surveyId }} search={{}}>
                Ir para a Síntese
              </NavButton>
            }
          />
        </AppCard>
      ) : board.length === 0 ? null : (
        <>
          <div className="ih-row ih-between ih-gap-3">
            <p className="ih-muted" aria-live="polite" style={{ margin: 0 }}>
              {board.length} {board.length === 1 ? 'insight salvo' : 'insights salvos'} neste navegador
            </p>
            <div className="ih-row ih-gap-2">
              <AppButton size="sm" icon={<FileMarkdownOutlined />} onClick={exportMarkdown}>
                Exportar Markdown
              </AppButton>
              <AppButton
                size="sm"
                icon={<DownloadOutlined />}
                onClick={() => {
                  downloadText(`insights-${stamp}.csv`, `\uFEFF${insightsToCsv(board)}`, 'text/csv');
                  toast({ message: 'CSV exportado.' });
                }}
              >
                Exportar CSV
              </AppButton>
              <AppButton size="sm" icon={<LinkOutlined />} onClick={() => void copyShareLink()}>
                Copiar link compartilhável
              </AppButton>
            </div>
          </div>
          <AppGrid columns={{ base: 1, lg: 2 }}>
            {board.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} onOpenCitation={openCitation} />
            ))}
          </AppGrid>
        </>
      )}
    </AppStack>
  );
}
