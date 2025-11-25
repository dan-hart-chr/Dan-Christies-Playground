/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_AUTH_USERNAME: string
  readonly VITE_AUTH_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
