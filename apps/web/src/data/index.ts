export * from './types';
export { createHttpClient, errorForStatus, type HttpClientOptions } from './http-client';
export { createFaultController, useFaultMode, type FaultController, type FaultMode } from './faults';
// The demo adapter (and the seed it carries) is deliberately not re-exported here: main.tsx loads it
// with a dynamic import so it stays out of the first-paint bundle.
