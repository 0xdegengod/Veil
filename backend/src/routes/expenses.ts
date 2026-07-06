import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { assertGroupMember, getGroupOrThrow, isGroupMember } from '../lib/membership.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import {
  canSendReminder,
  nextRemindAt,
  recentRemindersByRecipient,
} from '../lib/reminders.ts'
import { loadExpenseMeta } from '../lib/expenseMeta.ts'
import { verifyEthRepaymentTx } from '../lib/verifyEthRepayment.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppHono } from '../types.ts'

const createExpenseSchema = z.object({
  description: z.string().min(1).max(500),
  participantAddresses: z.array(z.string().min(1)).min(1),
  /** Required — ConfidentialLedger.recordExpense must be mined before indexing. */
  chainExpenseId: z.number().int().positive(),
})

type ParticipantRow = {
  walletAddress: string
  status: string
}

function expenseViewerRole(
  wallet: string,
  payerAddress: string,
  participants: string[],
): 'payer' | 'participant' | 'observer' {
  const normalized = normalizeAddress(wallet)
  if (normalized === normalizeAddress(payerAddress)) return 'payer'
  if (participants.some((p) => normalizeAddress(p) === normalized)) return 'participant'
  return 'observer'
}

function pendingReceivableCount(payerAddress: string, rows: ParticipantRow[]): number {
  const payer = normalizeAddress(payerAddress)
  return rows.filter(
    (p) => normalizeAddress(p.walletAddress) !== payer && p.status !== 'paid',
  ).length
}

export function registerExpenseRoutes(app: AppHono) {
  app.get('/groups/:groupId/expenses', async (c) => {
    const groupId = c.req.param('groupId')
    const wallet = sessionWallet(c)
    if (!wallet) return apiError(c, 'unauthorized', 401)

    try {
      await assertGroupMember(groupId, wallet)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 15) || 15, 1), 50)
    const offset = Math.max(Number(c.req.query('offset') ?? 0) || 0, 0)

    const countRow = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.expenses)
      .where(eq(schema.expenses.groupId, groupId))
    const total = countRow[0]?.total ?? 0

    const rows = await db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.groupId, groupId))
      .orderBy(desc(schema.expenses.createdAt))
      .limit(limit)
      .offset(offset)

    const members = await db
      .select()
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId))

    const handleByWallet = new Map(members.map((m) => [m.walletAddress, m.handle]))

    const expenseIds = rows.map((r) => r.id)
    const participantRows =
      expenseIds.length > 0
        ? await db
            .select()
            .from(schema.expenseParticipants)
            .where(inArray(schema.expenseParticipants.expenseId, expenseIds))
        : []

    const participantsByExpense = new Map<string, ParticipantRow[]>()
    for (const row of participantRows) {
      const list = participantsByExpense.get(row.expenseId) ?? []
      list.push({ walletAddress: row.walletAddress, status: row.status })
      participantsByExpense.set(row.expenseId, list)
    }

    return c.json({
      items: rows.map((expense) => {
        const participants = participantsByExpense.get(expense.id) ?? []
        const participantAddresses = participants.map((p) => p.walletAddress)
        const youArePayer = normalizeAddress(expense.payerAddress) === wallet
        const isParticipant = participants.some(
          (p) => normalizeAddress(p.walletAddress) === wallet,
        )

        return {
          id: expense.id,
          groupId: expense.groupId,
          chainExpenseId: expense.chainExpenseId,
          description: expense.description,
          payerAddress: expense.payerAddress,
          payerHandle: handleByWallet.get(expense.payerAddress) ?? expense.payerAddress,
          memberCount: participants.length,
          createdAt: expense.createdAt.toISOString(),
          isYourExpense: youArePayer,
          canViewAmounts: youArePayer || isParticipant,
          pendingReceivableCount: youArePayer
            ? pendingReceivableCount(expense.payerAddress, participants)
            : undefined,
        }
      }),
      total,
      limit,
      offset,
    })
  })

  app.get('/groups/:groupId/expenses/:expenseId', async (c) => {
    const groupId = c.req.param('groupId')
    const expenseId = c.req.param('expenseId')
    const wallet = sessionWallet(c)
    if (!wallet) return apiError(c, 'unauthorized', 401)

    try {
      await assertGroupMember(groupId, wallet)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const [expense] = await db
      .select()
      .from(schema.expenses)
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)))
      .limit(1)

    if (!expense) return apiError(c, 'not_found', 404)

    const [group] = await db
      .select({ chainGroupId: schema.groups.chainGroupId })
      .from(schema.groups)
      .where(eq(schema.groups.id, groupId))
      .limit(1)

    const participantRows = await db
      .select()
      .from(schema.expenseParticipants)
      .where(eq(schema.expenseParticipants.expenseId, expenseId))

    const participantAddresses = participantRows.map((p) => p.walletAddress)
    const role = expenseViewerRole(wallet, expense.payerAddress, participantAddresses)

    const members = await db
      .select()
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId))

    const handleByWallet = new Map(members.map((m) => [m.walletAddress, m.handle]))

    const pendingOthers =
      role === 'payer'
        ? participantRows.filter(
            (row) =>
              normalizeAddress(row.walletAddress) !== normalizeAddress(expense.payerAddress) &&
              row.status === 'pending',
          )
        : []

    const { recentReminders, flaggedByYou } = await loadExpenseMeta(
      expenseId,
      groupId,
      wallet,
      role,
      pendingOthers.map((row) => row.walletAddress),
    )

    return c.json({
      id: expense.id,
      groupId: expense.groupId,
      chainGroupId: group?.chainGroupId ?? null,
      chainExpenseId: expense.chainExpenseId,
      description: expense.description,
      payerAddress: expense.payerAddress,
      payerHandle: handleByWallet.get(expense.payerAddress) ?? expense.payerAddress,
      memberCount: participantAddresses.length,
      createdAt: expense.createdAt.toISOString(),
      viewerRole: role,
      flaggedByYou,
      participants:
        role === 'observer'
          ? []
          : role === 'payer'
            ? participantRows.map((row) => {
                const walletKey = normalizeAddress(row.walletAddress)
                const lastReminder = recentReminders.get(walletKey)
                const canRemind =
                  walletKey !== normalizeAddress(expense.payerAddress) &&
                  row.status === 'pending' &&
                  canSendReminder(lastReminder)

                return {
                  walletAddress: row.walletAddress,
                  handle: handleByWallet.get(row.walletAddress) ?? row.walletAddress,
                  status: row.status as 'pending' | 'paid',
                  canRemind,
                  nextRemindAt:
                    lastReminder && !canRemind ? nextRemindAt(lastReminder) : undefined,
                }
              })
            : participantRows
                .filter((row) => normalizeAddress(row.walletAddress) === wallet)
                .map((row) => ({
                  walletAddress: row.walletAddress,
                  handle: handleByWallet.get(row.walletAddress) ?? row.walletAddress,
                  status: row.status as 'pending' | 'paid',
                })),
    })
  })

  /** Index expense metadata after ConfidentialLedger.recordExpense is mined. */
  app.post('/groups/:groupId/expenses', async (c) => {
    const groupId = c.req.param('groupId')
    const caller = sessionWallet(c)
    if (!caller) return apiError(c, 'unauthorized', 401)

    const body = await c.req.json().catch(() => null)
    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

    try {
      await assertGroupMember(groupId, caller)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const participants = [...new Set(parsed.data.participantAddresses.map(normalizeAddress))]

    for (const participant of participants) {
      if (!(await isGroupMember(groupId, participant))) {
        return apiError(c, 'invalid', 400, { participant: 'not_a_group_member' })
      }
    }

    const memberRows = await db
      .select()
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId))
    const handleByWallet = new Map(memberRows.map((m) => [m.walletAddress, m.handle]))

    const [expense] = await db
      .insert(schema.expenses)
      .values({
        groupId,
        payerAddress: caller,
        description: parsed.data.description.trim(),
        chainExpenseId: parsed.data.chainExpenseId,
      })
      .returning()

    if (!expense) return c.json({ error: 'insert_failed' }, 500)

    await db.insert(schema.expenseParticipants).values(
      participants.map((walletAddress) => ({
        expenseId: expense.id,
        walletAddress,
        status: walletAddress === caller ? 'paid' : 'pending',
      })),
    )

    const group = await getGroupOrThrow(groupId)

    const notifyTargets = participants.filter((w) => w !== caller)
    if (notifyTargets.length > 0) {
      await db.insert(schema.notifications).values(
        notifyTargets.map((recipientAddress) => ({
          recipientAddress,
          type: 'expense' as const,
          message: `New expense added to ${group.name} — ${expense.description}`,
          link: `/groups/${groupId}?expense=${expense.id}`,
        })),
      )
    }

    const participantRows: ParticipantRow[] = participants.map((walletAddress) => ({
      walletAddress,
      status: walletAddress === caller ? 'paid' : 'pending',
    }))

    return c.json(
      {
        id: expense.id,
        groupId: expense.groupId,
        chainExpenseId: expense.chainExpenseId,
        description: expense.description,
        payerAddress: expense.payerAddress,
        payerHandle: handleByWallet.get(expense.payerAddress) ?? expense.payerAddress,
        memberCount: participants.length,
        createdAt: expense.createdAt.toISOString(),
        isYourExpense: true,
        canViewAmounts: true,
        pendingReceivableCount: pendingReceivableCount(caller, participantRows) || undefined,
      },
      201,
    )
  })

  const repaySchema = z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    expectedWei: z.string().regex(/^\d+$/).optional(),
  })

  /** Record an on-chain Sepolia ETH repayment for the caller's pending expense share. */
  app.post('/groups/:groupId/expenses/:expenseId/repay', async (c) => {
    const groupId = c.req.param('groupId')
    const expenseId = c.req.param('expenseId')
    const caller = sessionWallet(c)
    if (!caller) return apiError(c, 'unauthorized', 401)

    const body = await c.req.json().catch(() => null)
    const parsed = repaySchema.safeParse(body)
    if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

    try {
      await assertGroupMember(groupId, caller)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const [expense] = await db
      .select()
      .from(schema.expenses)
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)))
      .limit(1)

    if (!expense) return apiError(c, 'not_found', 404)

    const participantRows = await db
      .select()
      .from(schema.expenseParticipants)
      .where(eq(schema.expenseParticipants.expenseId, expenseId))

    const participant = participantRows.find(
      (row) => normalizeAddress(row.walletAddress) === caller,
    )

    if (!participant) return apiError(c, 'forbidden', 403)
    if (participant.status === 'paid') return apiError(c, 'invalid', 400, { status: 'already_paid' })
    if (normalizeAddress(expense.payerAddress) === caller) {
      return apiError(c, 'invalid', 400, { payer: 'cannot_repay_own_expense' })
    }

    try {
      await verifyEthRepaymentTx({
        txHash: parsed.data.txHash as `0x${string}`,
        participantAddress: caller,
        payeeAddress: expense.payerAddress,
        expectedWei: parsed.data.expectedWei ? BigInt(parsed.data.expectedWei) : undefined,
      })
    } catch (e) {
      const code = e instanceof Error ? e.message : 'tx_verify_failed'
      return apiError(c, 'invalid', 400, { tx: code })
    }

    const paidAt = new Date()

    await db
      .update(schema.expenseParticipants)
      .set({ status: 'paid', paidAt })
      .where(
        and(
          eq(schema.expenseParticipants.expenseId, expenseId),
          eq(schema.expenseParticipants.walletAddress, participant.walletAddress),
        ),
      )

    const group = await getGroupOrThrow(groupId)
    const payerAddress = normalizeAddress(expense.payerAddress)

    await db.insert(schema.notifications).values([
      {
        recipientAddress: payerAddress,
        type: 'expense' as const,
        message: `Repayment received for ${expense.description} in ${group.name}`,
        link: `/groups/${groupId}?expense=${expenseId}`,
      },
      {
        recipientAddress: caller,
        type: 'expense' as const,
        message: `You repaid your share for ${expense.description} in ${group.name}`,
        link: `/groups/${groupId}?expense=${expenseId}`,
      },
    ])

    return c.json({ ok: true, status: 'paid' })
  })

  const remindSchema = z.object({
    memberAddress: z.string().min(1),
  })

  /** Payer sends a repayment reminder — max once per recipient per 24 hours. */
  app.post('/groups/:groupId/expenses/:expenseId/remind', async (c) => {
    const groupId = c.req.param('groupId')
    const expenseId = c.req.param('expenseId')
    const caller = sessionWallet(c)
    if (!caller) return apiError(c, 'unauthorized', 401)

    const body = await c.req.json().catch(() => null)
    const parsed = remindSchema.safeParse(body)
    if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

    try {
      await assertGroupMember(groupId, caller)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const [expense] = await db
      .select()
      .from(schema.expenses)
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)))
      .limit(1)

    if (!expense) return apiError(c, 'not_found', 404)
    if (normalizeAddress(expense.payerAddress) !== caller) {
      return apiError(c, 'forbidden', 403)
    }

    const recipient = normalizeAddress(parsed.data.memberAddress)
    if (recipient === caller) return apiError(c, 'invalid', 400, { member: 'cannot_remind_self' })

    const [participant] = await db
      .select()
      .from(schema.expenseParticipants)
      .where(
        and(
          eq(schema.expenseParticipants.expenseId, expenseId),
          eq(schema.expenseParticipants.walletAddress, recipient),
        ),
      )
      .limit(1)

    if (!participant) return apiError(c, 'not_found', 404)
    if (participant.status === 'paid') {
      return apiError(c, 'invalid', 400, { status: 'already_paid' })
    }

    const recent = await recentRemindersByRecipient(expenseId, [recipient])
    const lastSent = recent.get(recipient)
    if (!canSendReminder(lastSent)) {
      return apiError(c, 'invalid', 400, {
        reason: 'reminder_cooldown',
        nextRemindAt: lastSent ? nextRemindAt(lastSent) : undefined,
      })
    }

    await db.insert(schema.expenseReminders).values({
      expenseId,
      recipientAddress: recipient,
      sentByAddress: caller,
    })

    const group = await getGroupOrThrow(groupId)
    const members = await db
      .select()
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId))
    const payerHandle =
      members.find((m) => normalizeAddress(m.walletAddress) === caller)?.handle ?? 'Someone'

    await db.insert(schema.notifications).values({
      recipientAddress: recipient,
      type: 'expense',
      message: `${payerHandle} reminded you to repay your share for ${expense.description} in ${group.name}`,
      link: `/groups/${groupId}?expense=${expenseId}`,
    })

    return c.json({ ok: true }, 201)
  })

  const flagSchema = z.object({
    reason: z.string().trim().min(3).max(1000),
  })

  /**
   * Anonymous expense flag — creates an open dispute for the group admin to review.
   * The flagger's wallet is stored server-side but not shown to other members.
   */
  app.post('/groups/:groupId/expenses/:expenseId/flag', async (c) => {
    const groupId = c.req.param('groupId')
    const expenseId = c.req.param('expenseId')
    const caller = sessionWallet(c)
    if (!caller) return apiError(c, 'unauthorized', 401)

    const body = await c.req.json().catch(() => null)
    const parsed = flagSchema.safeParse(body)
    if (!parsed.success) return apiError(c, 'invalid', 400, parsed.error.flatten())

    try {
      await assertGroupMember(groupId, caller)
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') return apiError(c, 'forbidden', 403)
      throw e
    }

    const [expense] = await db
      .select()
      .from(schema.expenses)
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)))
      .limit(1)

    if (!expense) return apiError(c, 'not_found', 404)

    const [existing] = await db
      .select({ id: schema.expenseDisputes.id })
      .from(schema.expenseDisputes)
      .where(
        and(
          eq(schema.expenseDisputes.expenseId, expenseId),
          eq(schema.expenseDisputes.flaggerAddress, caller),
          eq(schema.expenseDisputes.status, 'open'),
        ),
      )
      .limit(1)

    if (existing) {
      return apiError(c, 'invalid', 400, { reason: 'already_flagged' })
    }

    const group = await getGroupOrThrow(groupId)

    const [dispute] = await db
      .insert(schema.expenseDisputes)
      .values({
        expenseId,
        groupId,
        flaggerAddress: caller,
        reason: parsed.data.reason,
        status: 'open',
      })
      .returning()

    if (!dispute) return c.json({ error: 'insert_failed' }, 500)

    await db.insert(schema.notifications).values({
      recipientAddress: normalizeAddress(group.adminAddress),
      type: 'dispute',
      message: `Expense flagged in ${group.name} — "${expense.description}" needs review`,
      link: `/groups/${groupId}?expense=${expenseId}`,
    })

    return c.json(
      {
        id: dispute.id,
        expenseId: dispute.expenseId,
        status: dispute.status,
      },
      201,
    )
  })
}
