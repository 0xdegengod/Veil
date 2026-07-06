import { API_URL } from './config.ts'
import { getSessionToken } from '../auth/session.ts'

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(code: string, status: number, details?: unknown) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getSessionToken()
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? 'request_failed', res.status, body.details)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
