import { useState } from 'react';
import { DataError, createHttpClient } from '../data';
import { parseApiUrl } from '../lib/api-url';
import { AppAlert, AppButton, AppForm, AppFormItem, AppInput, AppModal, AppParagraph, AppPasswordInput, ApiOutlined, DisconnectOutlined } from '../ui';

interface ConnectDialogProps {
  open: boolean;
  initialUrl: string;
  connected: boolean;
  onClose: () => void;
  onConnect: (url: string, token: string) => void;
  onDisconnect: () => void;
}

interface ConnectValues {
  url: string;
  token?: string;
}

const ERROR_ID = 'connect-error';

export default function ConnectDialog({ open, initialUrl, connected, onClose, onConnect, onDisconnect }: ConnectDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit({ url, token }: ConnectValues) {
    const parsed = parseApiUrl(url ?? '');
    if (!parsed) {
      setError('Informe um endereço http:// ou https:// válido, por exemplo http://localhost:3333.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Reads the survey list before switching, so a wrong address or a blocked origin fails here, in the dialog.
      await createHttpClient(parsed.origin).listSurveys();
      onConnect(parsed.origin, token ?? '');
    } catch (failure: unknown) {
      setError(
        failure instanceof DataError && failure.code === 'NETWORK'
          ? 'Não consegui falar com essa API. Confira o endereço, se ela está rodando e se este site está em CORS_ORIGINS.'
          : failure instanceof Error
            ? failure.message
            : 'Não foi possível conectar.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal open={open} title="Conectar à API" onClose={onClose} size="sm">
      <AppForm<ConnectValues> name="connect" initialValues={{ url: initialUrl, token: '' }} onSubmit={submit}>
        <AppParagraph tone="muted" small>
          Troque os dados fictícios do navegador por uma API InsightHub sua. O token só é necessário para gerar sínteses
          quando a API exige um, e fica <strong>apenas na memória desta aba</strong>: não é gravado, não vai para a URL e
          some quando você fecha a página.
        </AppParagraph>
        <div style={{ height: 'var(--ih-space-4)' }} />
        <AppFormItem label="Endereço da API" name="url">
          <AppInput inputMode="url" autoComplete="off" error={error !== null} aria-describedby={error ? ERROR_ID : undefined} />
        </AppFormItem>
        <AppFormItem label="Token (opcional)" name="token">
          <AppPasswordInput autoComplete="off" />
        </AppFormItem>
        {error ? (
          <div id={ERROR_ID} style={{ marginBottom: 'var(--ih-space-4)' }}>
            <AppAlert kind="error" live="alert" title={error} />
          </div>
        ) : null}
        <div className="ih-row ih-end ih-gap-2">
          {connected ? (
            <AppButton icon={<DisconnectOutlined />} onClick={onDisconnect}>
              Voltar para a demo
            </AppButton>
          ) : null}
          <AppButton variant="primary" htmlType="submit" icon={<ApiOutlined />} loading={busy}>
            {busy ? 'Conectando…' : 'Conectar'}
          </AppButton>
        </div>
      </AppForm>
    </AppModal>
  );
}
