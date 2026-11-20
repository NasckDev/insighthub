import { type SurveyResponse } from '@insighthub/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { formatDate } from '../lib/format';
import { PLAN_LABELS, REGION_LABELS, ROLE_LABELS } from '../lib/labels';
import { personOf } from '../lib/people';
import { AppButton, AppDrawer, AppParagraph, AppStack, AppText, AppTitle, LinkOutlined, useToast } from '../ui';
import { useClient } from './app-context';
import { Avatar, ScoreBadge, ThemeChips } from './response-bits';
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

  // The panel is unmounted when the address loses `?r=`, so hand the focus back to whatever opened it.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      setTimeout(() => opener?.focus(), 0);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ message: 'Link da resposta copiado.' });
    } catch {
      toast({ kind: 'error', message: 'Não foi possível copiar. Copie o endereço do navegador.' });
    }
  }

  return (
    <AppDrawer open title={`Resposta ${responseId}`} onClose={onClose}>
      {response.isPending ? <LoadingBlock label="Carregando resposta" height={220} /> : null}
      {response.isError ? <ErrorState error={response.error} onRetry={() => void response.refetch()} /> : null}
      {data ? (
        <AppStack gap={5}>
          <div className="ih-row ih-gap-3 ih-nowrap">
            <Avatar respondentId={data.respondentId} size={44} />
            <div className="ih-fill">
              <AppText strong block>
                {personOf(data.respondentId).name}
              </AppText>
              <AppText tone="muted" small>
                {ROLE_LABELS[data.role]} · {formatDate(data.submittedAt)}
              </AppText>
            </div>
            <ScoreBadge score={data.npsScore} />
          </div>
          <blockquote className="ih-quote ih-response-quote">{data.comment}</blockquote>
          <ThemeChips comment={data.comment} />
          <dl className="ih-meta">
            <Meta label="Plano" value={PLAN_LABELS[data.plan]} />
            <Meta label="Região" value={REGION_LABELS[data.region]} />
            <Meta label="Função" value={ROLE_LABELS[data.role]} />
            <Meta label="Respondente" value={data.respondentId} />
          </dl>
          <section aria-label="Respostas do questionário">
            <AppTitle level={3}>Questionário</AppTitle>
            <dl className="ih-answers">
              {Object.entries(data.answers).map(([questionId, value]) => (
                <div key={questionId}>
                  <dt>{survey.data?.questions.find((question) => question.id === questionId)?.prompt ?? questionId}</dt>
                  <dd>{formatAnswer(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div>
            <AppButton icon={<LinkOutlined />} onClick={() => void copyLink()}>
              Copiar link desta resposta
            </AppButton>
          </div>
          <AppParagraph tone="muted" small>
            Respondente fictício, gerado só para esta demonstração.
          </AppParagraph>
        </AppStack>
      ) : null}
    </AppDrawer>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
