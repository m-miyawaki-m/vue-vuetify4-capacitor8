/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DISABLE_OFFLINE_OVERLAY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
