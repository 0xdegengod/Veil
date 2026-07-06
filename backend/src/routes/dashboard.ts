import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { apiError } from '../lib/errors.ts'
import { listPendingExpenseDebtsForWallet } from '../lib/expenseDebts.ts'
import { normalizeAddress } from '../lib/normalize.ts'
import { sessionWallet } from '../middleware/session.ts'
import type { AppHono } from '../types.ts'

/**
 * Cross-group activity index (metadata only).
 * Amounts are resolved client-side from chain ciphertexts.
 */
export function registerDashboardRoutes(app: AppHono) {
  app.get('/dashboard', async (c) => {
    const wallet = sessionWallet(c)
    if (!wallet) return apiError(c, 'unauthorized', 401)

    const normalized = wallet

    const memberships = await db
      .select({ groupId: schema.groupMembers.groupId })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.walletAddress, normalized))

    if (memberships.length === 0) {
      return c.json({
        recentActivity: [],
        creditsFromExpenses: [],
        debtsFromExpenses: [],
        balancesByGroup: [],
      })
    }

    const groupIds = memberships.map((m) => m.groupId)
    const groupRows = await db
      .select()
      .from(schema.groups)
      .where(inArray(schema.groups.id, groupIds))

    const groupNameById = new Map(groupRows.map((g) => [g.id, g.name]))

    const members = await db
      .select()
      .from(schema.groupMembers)
      .where(inArray(schema.groupMembers.groupId, groupIds))

    const handleByWallet = new Map(
      members.map((m) => [`${m.groupId}:${m.walletAddress}`, m.handle]),
    )

    const payerHandleByWallet = new Map(members.map((m) => [m.walletAddress, m.handle]))

    const expenseRows = await db
      .select()
      .from(schema.expenses)
      .where(inArray(schema.expenses.groupId, groupIds))
      .orderBy(desc(schema.expenses.createdAt))
      .limit(50)

    const recentExpenseActivity = expenseRows.map((expense) => ({
      kind: 'expense' as const,
      expenseId: expense.id,
      chainExpenseId: expense.chainExpenseId,
      groupId: expense.groupId,
      groupName: groupNameById.get(expense.groupId) ?? 'Group',
      description: expense.description,
      payerAddress: expense.payerAddress,
      payerHandle:
        payerHandleByWallet.get(expense.payerAddress) ?? expense.payerAddress,
      createdAt: expense.createdAt.toISOString(),
      isYourExpense: normalizeAddress(expense.payerAddress) === normalized,
    }))

    const repaymentRows = await db
      .select({
        paidAt: schema.expenseParticipants.paidAt,
        participantAddress: schema.expenseParticipants.walletAddress,
        expense: schema.expenses,
      })
      .from(schema.expenseParticipants)
      .innerJoin(schema.expenses, eq(schema.expenseParticipants.expenseId, schema.expenses.id))
      .where(
        and(
          inArray(schema.expenses.groupId, groupIds),
          eq(schema.expenseParticipants.status, 'paid'),
          isNotNull(schema.expenseParticipants.paidAt),
        ),
      )
      .orderBy(desc(schema.expenseParticipants.paidAt))
      .limit(30)

    const recentRepaymentActivity = repaymentRows
      .filter(
        (row) =>
          normalizeAddress(row.participantAddress) !==
          normalizeAddress(row.expense.payerAddress),
      )
      .map((row) => {
        const payer = normalizeAddress(row.expense.payerAddress)
        const participant = normalizeAddress(row.participantAddress)
        const isYourRepayment = participant === normalized
        const isYourReceipt = payer === normalized

        return {
          kind: 'repayment' as const,
          expenseId: row.expense.id,
          groupId: row.expense.groupId,
          groupName: groupNameById.get(row.expense.groupId) ?? 'Group',
          description: row.expense.description,
          payerAddress: row.expense.payerAddress,
          payerHandle:
            payerHandleByWallet.get(row.expense.payerAddress) ?? row.expense.payerAddress,
          participantAddress: row.participantAddress,
          participantHandle:
            payerHandleByWallet.get(row.participantAddress) ?? row.participantAddress,
          createdAt: row.paidAt!.toISOString(),
          isYourExpense: false,
          isYourRepayment,
          isYourReceipt,
        }
      })
      .filter((row) => row.isYourRepayment || row.isYourReceipt)

    const recentActivity = [...recentExpenseActivity, ...recentRepaymentActivity]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)

    const payerExpenses = expenseRows.filter(
      (e) => normalizeAddress(e.payerAddress) === normalized,
    )

    const creditsFromExpenses = await Promise.all(
      payerExpenses.map(async (expense) => {
        const participants = await db
          .select()
          .from(schema.expenseParticipants)
          .where(eq(schema.expenseParticipants.expenseId, expense.id))

        const others = participants.filter(
          (p) => normalizeAddress(p.walletAddress) !== normalized,
        )

        const paidCount = others.filter((p) => p.status === 'paid').length

        return {
          expenseId: expense.id,
          chainExpenseId: expense.chainExpenseId,
          chainGroupId: groupRows.find((g) => g.id === expense.groupId)?.chainGroupId ?? null,
          groupId: expense.groupId,
          groupName: groupNameById.get(expense.groupId) ?? 'Group',
          description: expense.description,
          paidCount,
          totalCount: others.length,
          createdAt: expense.createdAt.toISOString(),
          participants: others.map((p) => ({
            walletAddress: p.walletAddress,
            handle: handleByWallet.get(`${expense.groupId}:${p.walletAddress}`) ?? payerHandleByWallet.get(p.walletAddress) ?? p.walletAddress,
            status: p.status,
          })),
        }
      }),
    )

    const debtsFromExpenses = await listPendingExpenseDebtsForWallet(
      normalized,
      groupIds,
      groupNameById,
      payerHandleByWallet,
    )

    const sortedGroups = [...groupRows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    return c.json({
      recentActivity,
      creditsFromExpenses,
      debtsFromExpenses,
      balancesByGroup: sortedGroups.map((g) => ({
        groupId: g.id,
        groupName: g.name,
        chainGroupId: g.chainGroupId,
        createdAt: g.createdAt.toISOString(),
      })),
    })
  })
}
