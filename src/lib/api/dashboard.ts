import type { DashboardSummary } from '../../types/contracts.ts'
import { sortByLatest, sortByLatestOptional } from '../utils/sort.ts'
import { apiFetch } from './client.ts'
import { getContractAddresses } from '../contracts/addresses.ts'
import { resolveExpenseAmounts } from '../fhe/expenseAmounts.ts'
import {
  resolveExpenseDebtPayActions,
  type ExpenseDebtMeta,
} from '../fhe/resolveDebtPayActions.ts'

type ApiDashboard = {
  recentActivity: {
    kind?: 'expense' | 'repayment'
    expenseId: string
    groupId: string
    groupName: string
    description: string
    payerAddress: string
    payerHandle?: string
    participantHandle?: string
    createdAt: string
    isYourExpense: boolean
    isYourRepayment?: boolean
    isYourReceipt?: boolean
  }[]
  creditsFromExpenses: {
    expenseId: string
    chainExpenseId: number | null
    chainGroupId: number | null
    groupId: string
    groupName: string
    description: string
    paidCount: number
    totalCount: number
    createdAt: string
    participants: {
      walletAddress: string
      handle: string
      status: string
    }[]
  }[]
  debtsFromExpenses: ExpenseDebtMeta[]
  balancesByGroup: {
    groupId: string
    groupName: string
    chainGroupId: number | null
    createdAt: string
  }[]
}

export async function fetchDashboard(
  chainId: number,
  viewerAddress: `0x${string}`,
): Promise<DashboardSummary> {
  const data = await apiFetch<ApiDashboard>('/dashboard')
  const ledger = getContractAddresses(chainId)?.confidentialLedger
  const ledgerReady =
    Boolean(ledger) && ledger !== '0x0000000000000000000000000000000000000000'

  const creditsFromExpenses = []

  for (const credit of data.creditsFromExpenses) {
    const unpaidCount = credit.participants.filter((p) => p.status !== 'paid').length
    if (unpaidCount === 0) continue

    if (!credit.chainExpenseId || !credit.chainGroupId || !ledgerReady || !ledger) {
      continue
    }

    try {
      const repaidWallets = new Set(
        credit.participants
          .filter((p) => p.status === 'paid')
          .map((p) => p.walletAddress.toLowerCase()),
      )

      const amounts = await resolveExpenseAmounts(
        chainId,
        credit.chainExpenseId,
        ledger,
        'payer',
        viewerAddress,
        viewerAddress,
        viewerAddress,
        credit.participants.map((p) => ({
          walletAddress: p.walletAddress,
          handle: p.handle,
        })),
        { repaidWallets },
      )

      if (amounts.pendingReceivableCents <= 0) continue

      creditsFromExpenses.push({
        expenseId: credit.expenseId,
        groupId: credit.groupId,
        groupName: credit.groupName,
        description: credit.description,
        receivableCents: amounts.receivableCents,
        pendingCents: amounts.pendingReceivableCents,
        paidCount: credit.paidCount,
        totalCount: credit.totalCount,
        createdAt: credit.createdAt,
      })
    } catch {
      // Skip expenses that cannot be decrypted yet
    }
  }

  const payActions = sortByLatest(
    await resolveExpenseDebtPayActions(chainId, viewerAddress, data.debtsFromExpenses),
  )
  const totalYouOweCents = payActions.reduce((sum, a) => sum + a.amountCents, 0)

  const netByGroup = new Map<string, number>()
  for (const action of payActions) {
    if (action.direction === 'pay') {
      netByGroup.set(action.groupId, (netByGroup.get(action.groupId) ?? 0) - action.amountCents)
    }
  }
  for (const credit of creditsFromExpenses) {
    netByGroup.set(credit.groupId, (netByGroup.get(credit.groupId) ?? 0) + credit.pendingCents)
  }

  return {
    totalYouOweCents,
    totalOwedToYouCents: creditsFromExpenses.reduce((sum, c) => sum + c.pendingCents, 0),
    netPositionCents:
      creditsFromExpenses.reduce((sum, c) => sum + c.pendingCents, 0) - totalYouOweCents,
    pendingPayCount: payActions.length,
    pendingReceiveCount: creditsFromExpenses.length,
    recentActivity: sortByLatest(
      data.recentActivity.map((a) => ({
        expenseId: a.expenseId,
        groupId: a.groupId,
        groupName: a.groupName,
        description: a.description,
        payerHandle: a.payerHandle ?? a.payerAddress,
        memberCount: 0,
        createdAt: a.createdAt,
        isYourExpense: a.isYourExpense,
        kind: a.kind ?? 'expense',
        participantHandle: a.participantHandle,
        isYourRepayment: a.isYourRepayment,
        isYourReceipt: a.isYourReceipt,
      })),
    ),
    creditsFromExpenses: sortByLatest(creditsFromExpenses),
    payActions,
    balancesByGroup: sortByLatestOptional(
      data.balancesByGroup.map((b) => ({
        groupId: b.groupId,
        groupName: b.groupName,
        netCents: netByGroup.get(b.groupId) ?? 0,
        createdAt: b.createdAt,
      })),
    ),
  }
}

export async function listGroupExpenseDebts(groupId: string): Promise<ExpenseDebtMeta[]> {
  return apiFetch<ExpenseDebtMeta[]>(`/groups/${groupId}/expense-debts`)
}
