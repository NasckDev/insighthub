import { AppButton, LinkOutlined, useToast } from '../ui';

/** Copies the address of the current view: the filters live in the URL, so whoever opens it sees the same cut. */
export function CopyViewLink() {
  const toast = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ message: 'Link desta visão copiado, com os filtros.' });
    } catch {
      toast({ kind: 'error', message: 'Não foi possível copiar. Copie o endereço do navegador.' });
    }
  }
  return (
    <AppButton icon={<LinkOutlined />} onClick={() => void copy()}>
      Copiar link
    </AppButton>
  );
}
