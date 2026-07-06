import type { Expense, ExpenseDetail } from '../../types/contracts.ts'
import type { PaginatedResult } from '../../types/pagination.ts'
import { EXPENSE_PAGE_SIZE } from '../constants/listLimits.ts'
import { apiFetch } from './client.ts'

type ApiExpense = {
  id: string
  groupId: string
  chainExpenseId: number | null
  description: string
  payerAddress: string
  payerHandle?: string
  memberCount: number
  createdAt: string
  isYourExpense?: boolean
  canViewAmounts?: boolean
  pendingReceivableCount?: number
}

export type ApiExpenseDetailMeta = {
  id: string
  groupId: string
  chainGroupId: number | null
  chainExpenseId: number | null
  description: string
  payerAddress: string
  payerHandle: string
  memberCount: number
  createdAt: string
  viewerRole: 'payer' | 'participant' | 'observer'
  flaggedByYou?: boolean
  participants: {
    walletAddress: string
    handle: string
    status?: 'pending' | 'paid'
    canRemind?: boolean
    nextRemindAt?: string
  }[]
}

function mapExpense(row: ApiExpense): Expense {
  return {
    id: row.id,
    description: row.description,
    payerAddress: row.payerAddress,
    payerHandle: row.payerHandle,
    memberCount: row.memberCount,
    createdAt: row.createdAt,
    isYourExpense: row.isYourExpense,
    pendingReceivableCount: row.pendingReceivableCount,
  }
}

export function toExpenseDetail(
  row: ApiExpenseDetailMeta,
  amounts?: {
    totalCents: number
    shares: ExpenseDetail['shares']
    receivableCents: number
    pendingReceivableCents: number
    yourShareCents?: number
  },
): ExpenseDetail {
  const remindMeta = new Map(
    row.participants.map((p) => [p.walletAddress.toLowerCase(), p]),
  )

  const shares =
    amounts?.shares.map((share) => {
      const meta = remindMeta.get(share.memberAddress.toLowerCase())
      return {
        ...share,
        canRemind: meta?.canRemind,
        nextRemindAt: meta?.nextRemindAt,
      }
    }) ??
    row.participants.map((p) => ({
      memberAddress: p.walletAddress,
      memberHandle: p.handle,
      amountCents: 0,
      status: (p.status ?? 'pending') as ExpenseDetail['shares'][number]['status'],
      canRemind: p.canRemind,
      nextRemindAt: p.nextRemindAt,
    }))

  return {
    id: row.id,
    groupId: row.groupId,
    description: row.description,
    payerAddress: row.payerAddress,
    payerHandle: row.payerHandle,
    memberCount: row.memberCount,
    createdAt: row.createdAt,
    viewerRole: row.viewerRole,
    flaggedByYou: row.flaggedByYou,
    totalCents: amounts?.totalCents ?? 0,
    shares,
    receivableCents: amounts?.receivableCents ?? 0,
    pendingReceivableCents: amounts?.pendingReceivableCents ?? 0,
    yourShareCents: amounts?.yourShareCents,
  }
}

export async function listExpenses(
  groupId: string,
  opts?: { limit?: number; offset?: number },
): Promise<PaginatedResult<Expense>> {
  const limit = opts?.limit ?? EXPENSE_PAGE_SIZE
  const offset = opts?.offset ?? 0
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  const data = await apiFetch<PaginatedResult<ApiExpense>>(
    `/groups/${groupId}/expenses?${params}`,
  )
  return {
    ...data,
    items: data.items.map(mapExpense),
  }
}

export async function getExpenseDetailMeta(
  groupId: string,
  expenseId: string,
): Promise<ApiExpenseDetailMeta> {
  return apiFetch<ApiExpenseDetailMeta>(`/groups/${groupId}/expenses/${expenseId}`)
}

export type CreateExpenseInput = {
  description: string
  participantAddresses: string[]
  chainExpenseId: number
}

export async function createExpense(
  groupId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  const row = await apiFetch<ApiExpense>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return mapExpense(row)
}

export async function recordExpenseRepayment(
  groupId: string,
  expenseId: string,
  input: { txHash: string; expectedWei: string },
): Promise<void> {
  await apiFetch(`/groups/${groupId}/expenses/${expenseId}/repay`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function remindExpenseShare(
  groupId: string,
  expenseId: string,
  memberAddress: string,
): Promise<void> {
  await apiFetch(`/groups/${groupId}/expenses/${expenseId}/remind`, {
    method: 'POST',
    body: JSON.stringify({ memberAddress }),
  })
}

export async function flagExpense(
  groupId: string,
  expenseId: string,
  reason: string,
): Promise<{ id: string; expenseId: string; status: string }> {
  return apiFetch(`/groups/${groupId}/expenses/${expenseId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
