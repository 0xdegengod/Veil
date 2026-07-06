import { createMiddleware } from 'hono/factory'
import { apiError } from '../lib/errors.ts'
import { verifySession } from '../lib/session.ts'

/** Optional session — sets `wallet` when a valid Bearer token is present. */
export const sessionContext = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  c.set('wallet', null)

  if (token) {
    try {
      const claims = await verifySession(token)
      c.set('wallet', claims.sub)
    } catch {
      c.set('wallet', null)
    }
  }

  await next()
})

/** Require a valid SIWE-issued Bearer session. */
export const requireSession = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return apiError(c, 'unauthorized', 401)

  try {
    const claims = await verifySession(token)
    c.set('wallet', claims.sub)
    await next()
  } catch {
    return apiError(c, 'unauthorized', 401)
  }
})

export function sessionWallet(c: { get: (key: 'wallet') => string | null }): string | null {
  return c.get('wallet')
}
