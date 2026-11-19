import { createContext, useContext, type ReactNode } from 'react';
import type { DataClient } from '../data';

const ClientContext = createContext<DataClient | null>(null);

export function ClientProvider({ client, children }: { client: DataClient; children: ReactNode }) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useClient(): DataClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error('useClient must be used inside <ClientProvider>');
  return client;
}
