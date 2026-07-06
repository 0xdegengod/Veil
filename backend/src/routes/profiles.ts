import { Hono } from 'hono'
import { eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { isValidHandle, normalizeHandle } from '../lib/handle.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppEnv } from '../types.ts'

export const profiles = new Hono<AppEnv>()

const upsertSchema = z.object({
  displayName: z.string().min(1).max(64),
  handle: z.string().min(3).max(32),
})

profiles.get('/', async (c) => {
  const q = c.req.query('q')?.trim().replace(/^@/, '')
  if (!q) return c.json([])

  const rows = await db
    .select()
    .from(schema.profiles)
    .where(
      or(
        ilike(schema.profiles.handle, `%${q.toLowerCase()}%`),
        ilike(schema.profiles.displayName, `%${q}%`),
      ),
    )
    .limit(20)

  return c.json(
    rows.map((row) => ({
      address: row.walletAddress,
      handle: row.handle,
      trustTier: 'medium' as const,
    })),
  )
})

profiles.get('/me', async (c) => {
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const [row] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, wallet))
    .limit(1)

  if (!row) return apiError(c, 'not_found', 404)
  return c.json(row)
})

profiles.get('/:address', async (c) => {
  const address = c.req.param('address').toLowerCase()
  const [row] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, address))
    .limit(1)

  if (!row) return apiError(c, 'not_found', 404)
  return c.json(row)
})

/** Create or update the signed-in wallet's profile (onboarding). */
profiles.put('/', async (c) => {
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const body = await c.req.json().catch(() => null)
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

  const handle = normalizeHandle(parsed.data.handle)
  if (!isValidHandle(handle)) {
    return apiError(c, 'invalid', 400, { handle: 'invalid_format' })
  }

  const [existingHandle] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.handle, handle))
    .limit(1)

  if (existingHandle && existingHandle.walletAddress !== wallet) {
    return apiError(c, 'invalid', 400, { handle: 'already_taken' })
  }

  const [row] = await db
    .insert(schema.profiles)
    .values({
      walletAddress: wallet,
      handle,
      displayName: parsed.data.displayName.trim(),
    })
    .onConflictDoUpdate({
      target: schema.profiles.walletAddress,
      set: {
        handle,
        displayName: parsed.data.displayName.trim(),
      },
    })
    .returning()

  return c.json(row)
})
