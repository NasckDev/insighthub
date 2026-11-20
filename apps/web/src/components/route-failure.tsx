import { EmptyState, ErrorState } from './states';

/** Anything a screen throws (bad address, broken data) lands here in plain language, never as a blank page. */
export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <ErrorState
      title="Algo deu errado nesta tela"
      error={new Error(error instanceof Error && error.message ? 'Não foi possível montar esta tela com os dados do endereço.' : 'Erro inesperado.')}
      onRetry={reset}
    />
  );
}

export function NotFound() {
  return <EmptyState title="Página não encontrada" description="Use o menu para voltar a uma tela existente." illustration="search" />;
}
