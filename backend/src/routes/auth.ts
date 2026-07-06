import { Hono } from 'hono'
import { SiweMessage } from 'siwe'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { env } from '../env.ts'
import { apiError } from '../lib/errors.ts'
import { consumeNonce, issueNonce } from '../lib/nonce.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import { issueSession } from '../lib/session.ts'
import { db, schema } from '../db/client.ts'
import { requireSession } from '../middleware/session.ts'
import type { AppEnv } from '../types.ts'

export const auth = new Hono<AppEnv>()

auth.get('/nonce', async (c) => {
  const address = c.req.query('address')
  if (!address) return apiError(c, 'invalid', 400, { address: 'required' })

  const nonce = await issueNonce(address)
  return c.json({ nonce })
})

const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
})

auth.post('/verify', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

  let siwe: SiweMessage
  try {
    siwe = new SiweMessage(parsed.data.message)
    const result = await siwe.verify({
      signature: parsed.data.signature,
      domain: env.SIWE_DOMAIN,
      nonce: siwe.nonce,
    })

    if (!result.success) return apiError(c, 'unauthorized', 401)
  } catch {
    return apiError(c, 'unauthorized', 401)
  }

  if (siwe.chainId !== env.CHAIN_ID) return apiError(c, 'unauthorized', 401, { chainId: 'mismatch' })
  if (siwe.uri !== env.SIWE_URI) return apiError(c, 'unauthorized', 401, { uri: 'mismatch' })

  const wallet = normalizeAddress(siwe.address)
  const nonceOk = await consumeNonce(wallet, siwe.nonce)
  if (!nonceOk) return apiError(c, 'unauthorized', 401, { nonce: 'invalid_or_expired' })

  const token = await issueSession(wallet)

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, wallet))
    .limit(1)

  return c.json({
    token,
    walletAddress: wallet,
    hasProfile: Boolean(profile),
    profile: profile ?? null,
  })
})

auth.get('/me', requireSession, async (c) => {
  const wallet = c.get('wallet')
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, wallet))
    .limit(1)

  return c.json({
    walletAddress: wallet,
    hasProfile: Boolean(profile),
    profile: profile ?? null,
  })
})
