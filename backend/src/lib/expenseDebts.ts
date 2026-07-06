import { and, desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { normalizeAddress } from './normalize.ts'

export type ExpenseDebtMeta = {
  expenseId: string
  chainExpenseId: number | null
  chainGroupId: number | null
  groupId: string
  groupName: string
  description: string
  payerAddress: string
  payerHandle: string
  createdAt: string
}

/** Expenses where `wallet` has a pending share and is not the payer (metadata only). */
export async function listPendingExpenseDebtsForWallet(
  wallet: string,
  groupIds: string[],
  groupNameById: Map<string, string>,
  handleByWallet: Map<string, string>,
): Promise<ExpenseDebtMeta[]> {
  if (groupIds.length === 0) return []

  const rows = await db
    .select({
      expense: schema.expenses,
      status: schema.expenseParticipants.status,
    })
    .from(schema.expenseParticipants)
    .innerJoin(schema.expenses, eq(schema.expenseParticipants.expenseId, schema.expenses.id))
    .where(
      and(
        eq(schema.expenseParticipants.walletAddress, wallet),
        eq(schema.expenseParticipants.status, 'pending'),
        inArray(schema.expenses.groupId, groupIds),
      ),
    )
    .orderBy(desc(schema.expenses.createdAt))

  const groupRows = await db
    .select({
      id: schema.groups.id,
      chainGroupId: schema.groups.chainGroupId,
    })
    .from(schema.groups)
    .where(inArray(schema.groups.id, groupIds))

  const chainGroupIdById = new Map(groupRows.map((g) => [g.id, g.chainGroupId]))

  return rows
    .filter((row) => normalizeAddress(row.expense.payerAddress) !== wallet)
    .map((row) => ({
      expenseId: row.expense.id,
      chainExpenseId: row.expense.chainExpenseId,
      chainGroupId: chainGroupIdById.get(row.expense.groupId) ?? null,
      groupId: row.expense.groupId,
      groupName: groupNameById.get(row.expense.groupId) ?? 'Group',
      description: row.expense.description,
      payerAddress: row.expense.payerAddress,
      payerHandle:
        handleByWallet.get(row.expense.payerAddress) ?? row.expense.payerAddress,
      createdAt: row.expense.createdAt.toISOString(),
    }))
}
