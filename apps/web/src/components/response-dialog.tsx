import { classifyNps, type SurveyResponse } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../lib/format';
import { NPS_SINGULAR, PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { useClient } from './app-context';
import { Modal } from './modal';
import { ErrorState, LoadingBlock } from './states';

interface ResponseDialogProps {
  surveyId: string;
  responseId: string;
  onClose: () => void;
}

function formatAnswer(value: SurveyResponse['answers'][string]): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Nenhuma';
  return String(value);
}

export function ResponseDialog({ surveyId, responseId, onClose }: ResponseDialogProps) {
  const client = useClient();
  const response = useQuery({
    queryKey: ['response', surveyId, responseId],
    queryFn: ({ signal }) => client.getResponse(surveyId, responseId, { signal }),
    retry: false,
  });
  const survey = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: ({ signal }) => client.getSurvey(surveyId, { signal }),
  });

  return (
    <Modal title={`Resposta ${responseId}`} onClose={onClose}>
      {response.isPending ? <LoadingBlock label="Carregando resposta" /> : null}
      {response.isError ? (
        <ErrorState error={response.error} onRetry={() => void response.refetch()} />
      ) : null}
      {response.data ? (
        <div className="flex flex-col gap-4">
          <blockquote className="m-0 border-l-4 border-primary pl-3 text-base">
            {response.data.comment}
          </blockquote>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Meta
              label="Nota"
              value={`${response.data.npsScore} · ${NPS_SINGULAR[classifyNps(response.data.npsScore)]}`}
            />
            <Meta label="Enviada em" value={formatDate(response.data.submittedAt)} />
            <Meta label="Plano" value={PLAN_LABELS[response.data.plan]} />
            <Meta label="Região" value={REGION_LABELS[response.data.region]} />
            <Meta label="Função" value={ROLE_LABELS[response.data.role]} />
            <Meta label="Respondente" value={response.data.respondentId} />
          </dl>
          <section aria-label="Respostas do questionário">
            <h3 className="m-0 mb-2 text-sm font-semibold">Questionário</h3>
            <dl className="m-0 flex flex-col gap-2 text-sm">
              {Object.entries(response.data.answers).map(([questionId, value]) => (
                <div key={questionId}>
                  <dt className="text-muted">
                    {survey.data?.questions.find((question) => question.id === questionId)?.prompt ??
                      questionId}
                  </dt>
                  <dd className="m-0 font-medium">{formatAnswer(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
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
