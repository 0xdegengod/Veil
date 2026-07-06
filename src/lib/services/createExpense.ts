import { createExpense as createExpenseApi } from '../api/expenses.ts'
import { recordExpenseOnChain } from '../contracts/actions/recordExpense.ts'
import type { ExpenseSplit } from '../../components/expenses/ExpenseForm.tsx'

export type CreateExpenseFlowInput = {
  chainId: number
  groupId: string
  chainGroupId: number
  split: ExpenseSplit
}

export async function createExpenseFlow(input: CreateExpenseFlowInput) {
  const participantAddresses = input.split.shares.map((s) => s.address)
  const shareCents = input.split.shares.map((s) => s.amountCents)

  const chainExpenseId = await recordExpenseOnChain(
    input.chainId,
    input.chainGroupId,
    participantAddresses as `0x${string}`[],
    input.split.amountCents,
    shareCents,
  )

  return createExpenseApi(input.groupId, {
    description: input.split.description,
    participantAddresses,
    chainExpenseId,
  })
}
