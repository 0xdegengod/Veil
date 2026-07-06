import type { GroupAction } from '../../types/contracts.ts'
import { getContractAddresses } from '../contracts/addresses.ts'
import { resolveExpenseAmounts } from '../fhe/expenseAmounts.ts'

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

export async function resolveExpenseDebtPayActions(
  chainId: number,
  viewerAddress: `0x${string}`,
  debts: ExpenseDebtMeta[],
): Promise<GroupAction[]> {
  const ledger = getContractAddresses(chainId)?.confidentialLedger
  const ledgerReady =
    Boolean(ledger) && ledger !== '0x0000000000000000000000000000000000000000'

  if (!ledgerReady || !ledger) return []

  const actions: GroupAction[] = []

  for (const debt of debts) {
    if (!debt.chainExpenseId || !debt.chainGroupId) continue

    try {
      const amounts = await resolveExpenseAmounts(
        chainId,
        debt.chainExpenseId,
        ledger,
        'participant',
        viewerAddress,
        debt.payerAddress,
        debt.payerHandle,
        [{ walletAddress: viewerAddress, handle: viewerAddress }],
      )

      const oweCents = amounts.yourShareCents ?? 0
      if (oweCents <= 0) continue

      actions.push({
        id: `expense-debt-${debt.expenseId}`,
        groupId: debt.groupId,
        groupName: debt.groupName,
        counterpartyHandle: debt.payerHandle,
        counterpartyAddress: debt.payerAddress,
        amountCents: oweCents,
        direction: 'pay',
        status: 'pending',
        expenseId: debt.expenseId,
        chainExpenseId: debt.chainExpenseId,
        expenseDescription: debt.description,
        createdAt: debt.createdAt,
      })
    } catch {
      // Skip if decrypt fails (wallet not ready, etc.)
    }
  }

  return actions
}
