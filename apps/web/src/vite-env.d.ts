/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When set, the app talks to apps/api; when empty or missing it runs the in-browser demo. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
