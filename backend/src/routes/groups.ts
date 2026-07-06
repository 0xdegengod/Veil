import { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { listPendingExpenseDebtsForWallet } from '../lib/expenseDebts.ts'
import { assertGroupMember } from '../lib/membership.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppEnv } from '../types.ts'

export const groups = new Hono<AppEnv>()

const memberSchema = z.object({
  walletAddress: z.string().min(1),
  handle: z.string().min(1),
  trustTier: z.enum(['low', 'medium', 'high']).default('medium'),
})

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  settlementToken: z.enum(['USDC', 'USDT']).default('USDC'),
  cadence: z.enum(['manual', 'weekly', 'monthly']).default('manual'),
  /** Required — GroupRegistry.createGroup must be mined before indexing metadata. */
  chainGroupId: z.number().int().positive(),
  members: z.array(memberSchema).default([]),
})

/** List groups the signed-in wallet belongs to. */
groups.get('/', async (c) => {
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const memberships = await db
    .select({ groupId: schema.groupMembers.groupId })
    .from(schema.groupMembers)
    .where(eq(schema.groupMembers.walletAddress, wallet))

  if (memberships.length === 0) return c.json([])

  const ids = memberships.map((m) => m.groupId)
  const [rows, memberRows] = await Promise.all([
    db.select().from(schema.groups).where(inArray(schema.groups.id, ids)),
    db
      .select({
        groupId: schema.groupMembers.groupId,
        walletAddress: schema.groupMembers.walletAddress,
        handle: schema.groupMembers.handle,
      })
      .from(schema.groupMembers)
      .where(inArray(schema.groupMembers.groupId, ids)),
  ])

  const countByGroup = new Map<string, number>()
  const adminHandleByGroup = new Map<string, string>()
  for (const row of memberRows) {
    countByGroup.set(row.groupId, (countByGroup.get(row.groupId) ?? 0) + 1)
  }

  const sorted = [...rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )

  for (const g of sorted) {
    const admin = memberRows.find(
      (m) =>
        m.groupId === g.id &&
        normalizeAddress(m.walletAddress) === normalizeAddress(g.adminAddress),
    )
    if (admin) adminHandleByGroup.set(g.id, admin.handle)
  }

  return c.json(
    sorted.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      inviteToken: g.inviteToken,
      adminAddress: g.adminAddress,
      adminHandle: adminHandleByGroup.get(g.id) ?? null,
      chainGroupId: g.chainGroupId,
      settlementToken: g.settlementToken,
      cadence: g.cadence,
      createdAt: g.createdAt.toISOString(),
      memberCount: countByGroup.get(g.id) ?? 0,
    })),
  )
})

groups.get('/:id', async (c) => {
  const id = c.req.param('id')
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  const [membership] = await db
    .select()
    .from(schema.groupMembers)
    .where(
      and(eq(schema.groupMembers.groupId, id), eq(schema.groupMembers.walletAddress, wallet)),
    )
    .limit(1)

  if (!membership) return apiError(c, 'forbidden', 403)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)

  const members = await db
    .select()
    .from(schema.groupMembers)
    .where(eq(schema.groupMembers.groupId, id))
    .orderBy(desc(schema.groupMembers.joinedAt))

  return c.json({ group, members })
})

/** Pending expense shares the caller owes in this group (metadata only). */
groups.get('/:id/expense-debts', async (c) => {
  const id = c.req.param('id')
  const wallet = sessionWallet(c)
  if (!wallet) return apiError(c, 'unauthorized', 401)

  try {
    await assertGroupMember(id, wallet)
  } catch (e) {
    if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
    throw e
  }

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)

  const members = await db
    .select()
    .from(schema.groupMembers)
    .where(eq(schema.groupMembers.groupId, id))

  const groupNameById = new Map([[group.id, group.name]])
  const payerHandleByWallet = new Map(members.map((m) => [m.walletAddress, m.handle]))

  const debts = await listPendingExpenseDebtsForWallet(
    wallet,
    [id],
    groupNameById,
    payerHandleByWallet,
  )

  return c.json(debts)
})

/**
 * Index group metadata after GroupRegistry.createGroup is mined.
 * Caller must be the on-chain admin (session wallet).
 */
groups.post('/', async (c) => {
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const body = await c.req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.walletAddress, caller))
    .limit(1)

  if (!profile) return apiError(c, 'forbidden', 403, { profile: 'required' })

  const inviteToken = randomUUID()

  const [group] = await db
    .insert(schema.groups)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      settlementToken: parsed.data.settlementToken,
      cadence: parsed.data.cadence,
      adminAddress: caller,
      chainGroupId: parsed.data.chainGroupId,
      inviteToken,
    })
    .returning()

  if (!group) return c.json({ error: 'insert_failed' }, 500)

  const memberRows = [
    { groupId: group.id, walletAddress: caller, handle: profile.handle, trustTier: 'high' as const },
    ...parsed.data.members.map((m) => ({
      groupId: group.id,
      walletAddress: normalizeAddress(m.walletAddress),
      handle: m.handle,
      trustTier: m.trustTier,
    })),
  ]

  await db.insert(schema.groupMembers).values(memberRows).onConflictDoNothing()
  await db
    .insert(schema.invites)
    .values({ token: inviteToken, groupId: group.id, inviterAddress: caller })

  return c.json({ group, members: memberRows }, 201)
})

const renameSchema = z.object({ name: z.string().min(1) })

groups.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const body = await c.req.json().catch(() => null)
  const parsed = renameSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)
  if (normalizeAddress(group.adminAddress) !== caller) return apiError(c, 'forbidden', 403)

  const [row] = await db
    .update(schema.groups)
    .set({ name: parsed.data.name })
    .where(eq(schema.groups.id, id))
    .returning()

  return c.json(row)
})

groups.post('/:id/leave', async (c) => {
  const id = c.req.param('id')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)

  if (normalizeAddress(group.adminAddress) === caller) {
    return apiError(c, 'forbidden', 403, { reason: 'transfer_admin_first' })
  }

  await db
    .delete(schema.groupMembers)
    .where(
      and(eq(schema.groupMembers.groupId, id), eq(schema.groupMembers.walletAddress, caller)),
    )

  return c.json({ ok: true })
})

groups.post('/:id/members', async (c) => {
  const id = c.req.param('id')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)
  if (normalizeAddress(group.adminAddress) !== caller) return apiError(c, 'forbidden', 403)

  const body = await c.req.json().catch(() => null)
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400)

  await db
    .insert(schema.groupMembers)
    .values({
      groupId: id,
      walletAddress: normalizeAddress(parsed.data.walletAddress),
      handle: parsed.data.handle,
      trustTier: parsed.data.trustTier,
    })
    .onConflictDoNothing()

  return c.json({ ok: true }, 201)
})

groups.delete('/:id/members/:wallet', async (c) => {
  const id = c.req.param('id')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)
  if (normalizeAddress(group.adminAddress) !== caller) return apiError(c, 'forbidden', 403)

  const wallet = c.req.param('wallet').toLowerCase()
  await db
    .delete(schema.groupMembers)
    .where(and(eq(schema.groupMembers.groupId, id), eq(schema.groupMembers.walletAddress, wallet)))

  return c.json({ ok: true })
})

const transferAdminSchema = z.object({ adminAddress: z.string().min(1) })

groups.patch('/:id/admin', async (c) => {
  const id = c.req.param('id')
  const caller = sessionWallet(c)
  if (!caller) return apiError(c, 'unauthorized', 401)

  const body = await c.req.json().catch(() => null)
  const parsed = transferAdminSchema.safeParse(body)
  if (!parsed.success) return apiError(c, 'invalid', 400)

  const newAdmin = normalizeAddress(parsed.data.adminAddress)

  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1)
  if (!group) return apiError(c, 'not_found', 404)
  if (normalizeAddress(group.adminAddress) !== caller) return apiError(c, 'forbidden', 403)

  const [member] = await db
    .select()
    .from(schema.groupMembers)
    .where(
      and(eq(schema.groupMembers.groupId, id), eq(schema.groupMembers.walletAddress, newAdmin)),
    )
    .limit(1)

  if (!member) return apiError(c, 'invalid', 400, { adminAddress: 'not_a_member' })

  const [row] = await db
    .update(schema.groups)
    .set({ adminAddress: newAdmin })
    .where(eq(schema.groups.id, id))
    .returning()

  return c.json(row)
})
