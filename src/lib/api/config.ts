export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

/** True when the built app still targets localhost while served from a remote host. */
export function isProductionApiMisconfigured(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return false
  return API_URL.includes('localhost') || API_URL.includes('127.0.0.1')
}

export const SIWE_DOMAIN =
  import.meta.env.VITE_SIWE_DOMAIN ?? window.location.host

export const SIWE_URI =
  import.meta.env.VITE_SIWE_URI ?? window.location.origin

export const SIWE_CHAIN_ID = Number(
  import.meta.env.VITE_SIWE_CHAIN_ID ?? 11155111,
)
