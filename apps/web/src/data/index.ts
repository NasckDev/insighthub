import { createDemoClient } from './demo-client';
import { createHttpClient } from './http-client';
import type { DataClient } from './types';

export * from './types';
export { createDemoClient, type DemoClient, type DemoClientOptions } from './demo-client';
export { createHttpClient } from './http-client';
export { createFaultController, useFaultMode, type FaultController, type FaultMode } from './faults';

/** `VITE_API_URL` set -> real API; otherwise the self-contained demo. */
export function createDefaultClient(): DataClient {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  return apiUrl ? createHttpClient(apiUrl) : createDemoClient();
}
