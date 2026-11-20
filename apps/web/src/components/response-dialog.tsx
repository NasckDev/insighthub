import { type SurveyResponse } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { formatDate } from '../lib/format';
import { PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { personOf } from '../lib/people';
import { useClient } from './app-context';
import { Modal } from './modal';
import { Avatar, ScoreBadge, ThemeChips } from './response-bits';
import { ErrorState, LoadingBlock } from './states';
import { useToast } from './toast';

interface ResponseDialogProps {
  surveyId: string;
  responseId: string;
  onClose: () => void;
}

function formatAnswer(value: SurveyResponse['answers'][string]): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Nenhuma';
  return String(value);
}

/** Side panel (bottom sheet on phones) with one response in full. */
export function ResponseDialog({ surveyId, responseId, onClose }: ResponseDialogProps) {
  const client = useClient();
  const toast = useToast();
  const response = useQuery({
    queryKey: ['response', surveyId, responseId],
    queryFn: ({ signal }) => client.getResponse(surveyId, responseId, { signal }),
    retry: false,
  });
  const survey = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: ({ signal }) => client.getSurvey(surveyId, { signal }),
  });
  const data = response.data;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ message: 'Link da resposta copiado.' });
    } catch {
      toast({ kind: 'error', message: 'Não foi possível copiar. Copie o endereço do navegador.' });
    }
  }

  return (
    <Modal title={`Resposta ${responseId}`} onClose={onClose} variant="sheet">
      {response.isPending ? <LoadingBlock label="Carregando resposta" height={220} /> : null}
      {response.isError ? <ErrorState error={response.error} onRetry={() => void response.refetch()} /> : null}
      {data ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar respondentId={data.respondentId} size={44} />
            <div className="min-w-0 flex-1">
              <p className="m-0 font-semibold">{personOf(data.respondentId).name}</p>
              <p className="m-0 text-sm text-muted">
                {ROLE_LABELS[data.role]} · {formatDate(data.submittedAt)}
              </p>
            </div>
            <ScoreBadge score={data.npsScore} />
          </div>
          <blockquote className="quote m-0 border-l-4 border-primary pl-4 text-xl">{data.comment}</blockquote>
          <ThemeChips comment={data.comment} />
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface-2 p-4 text-sm">
            <Meta label="Plano" value={PLAN_LABELS[data.plan]} />
            <Meta label="Região" value={REGION_LABELS[data.region]} />
            <Meta label="Função" value={ROLE_LABELS[data.role]} />
            <Meta label="Respondente" value={data.respondentId} />
          </dl>
          <section aria-label="Respostas do questionário">
            <h3 className="eyebrow mb-2">Questionário</h3>
            <dl className="m-0 flex flex-col gap-3 text-sm">
              {Object.entries(data.answers).map(([questionId, value]) => (
                <div key={questionId}>
                  <dt className="text-muted">
                    {survey.data?.questions.find((question) => question.id === questionId)?.prompt ?? questionId}
                  </dt>
                  <dd className="m-0 font-medium">{formatAnswer(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div>
            <button type="button" className="btn btn-sm" onClick={() => void copyLink()}>
              <Link2 aria-hidden="true" size={15} />
              Copiar link desta resposta
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 font-semibold">{value}</dd>
    </div>
  );
}
