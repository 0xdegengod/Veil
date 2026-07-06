const TOKEN_KEY = 'veil-session-token'

const listeners = new Set<() => void>()

function notifySessionChange(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  notifySessionChange()
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  notifySessionChange()
}
