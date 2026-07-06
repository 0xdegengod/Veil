export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export const SIWE_DOMAIN =
  import.meta.env.VITE_SIWE_DOMAIN ?? window.location.host

export const SIWE_URI =
  import.meta.env.VITE_SIWE_URI ?? window.location.origin

export const SIWE_CHAIN_ID = Number(
  import.meta.env.VITE_SIWE_CHAIN_ID ?? 11155111,
)
