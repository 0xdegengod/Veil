import type { Context } from 'hono'

export type ApiErrorCode =
  | 'invalid'
  | 'not_found'
  | 'forbidden'
  | 'wallet_required'
  | 'unauthorized'

export function apiError(c: Context, code: ApiErrorCode, status: 400 | 401 | 403 | 404, details?: unknown) {
  return c.json(details === undefined ? { error: code } : { error: code, details }, status)
}
