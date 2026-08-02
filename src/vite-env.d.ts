/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** URL of the local AI rephrase server (ai-server). Defaults to localhost:8000. */
  readonly VITE_AI_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
