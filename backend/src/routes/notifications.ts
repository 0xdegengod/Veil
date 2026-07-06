import { Hono } from 'hono'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppEnv } from '../types.ts'

export const notifications = new Hono<AppEnv>()

const createSchema = z.object({
  recipientAddress: z.string().min(1),
  type: z.enum(['expense', 'invite', 'dispute']),
  message: z.string().min(1),
  link: z.string().optional(),
})

notifications.get('/', async (c) => {
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 25) || 25, 1), 100)
  const offset = Math.max(Number(c.req.query('offset') ?? 0) || 0, 0)
  const filter = c.req.query('filter') === 'unread' ? 'unread' : 'all'

  const baseWhere = eq(schema.notifications.recipientAddress, wallet)
  const listWhere =
    filter === 'unread'
      ? and(baseWhere, eq(schema.notifications.read, false))
      : baseWhere

  const totalRow = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(listWhere)
  const total = totalRow[0]?.total ?? 0

  const unreadRow = await db
    .select({ unreadCount: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(and(baseWhere, eq(schema.notifications.read, false)))
  const unreadCount = unreadRow[0]?.unreadCount ?? 0

  const rows = await db
    .select()
    .from(schema.notifications)
    .where(listWhere)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    unreadCount,
    limit,
    offset,
  })
})

notifications.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

  const [row] = await db
    .insert(schema.notifications)
    .values({ ...parsed.data, recipientAddress: normalizeAddress(parsed.data.recipientAddress) })
    .returning()

  return c.json(row, 201)
})

notifications.post('/:id/read', async (c) => {
  const id = c.req.param('id')
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const [row] = await db
    .update(schema.notifications)
    .set({ read: true })
    .where(
      and(eq(schema.notifications.id, id), eq(schema.notifications.recipientAddress, wallet)),
    )
    .returning()

  if (!row) return apiError(c, 'not_found', 404)
  return c.json(row)
})

notifications.post('/read-all', async (c) => {
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(
      and(
        eq(schema.notifications.recipientAddress, wallet),
        eq(schema.notifications.read, false),
      ),
    )

  return c.json({ ok: true })
})
