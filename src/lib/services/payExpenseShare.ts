import {
  sendConfidentialUsdcPayment,
  type ConfidentialPayPhase,
} from '../payments/sendConfidentialUsdcPayment.ts'
import { recordExpenseRepayment } from '../api/expenses.ts'
import { ApiError } from '../api/client.ts'
import type { GroupAction } from '../../types/contracts.ts'

export type PayPhase = ConfidentialPayPhase

export async function executePayAction(input: {
  action: GroupAction
  groupId: string
  onPhase?: (phase: PayPhase) => void
}): Promise<void> {
  if (!input.action.counterpartyAddress) {
    throw new Error('payee_address_missing')
  }

  const { txHash } = await sendConfidentialUsdcPayment({
    payeeAddress: input.action.counterpartyAddress as `0x${string}`,
    amountCents: input.action.amountCents,
    onPhase: input.onPhase,
  })

  if (input.action.expenseId) {
    await recordRepayment(input.groupId, input.action.expenseId, {
      method: 'CUSD',
      txHash,
    })
  }
}

async function recordRepayment(
  groupId: string,
  expenseId: string,
  body: {
    method: 'CUSD'
    txHash: `0x${string}`
  },
): Promise<void> {
  try {
    await recordExpenseRepayment(groupId, expenseId, body)
  } catch (err) {
    if (err instanceof ApiError) {
      const txCode =
        err.details && typeof err.details === 'object' && err.details !== null && 'tx' in err.details
          ? String((err.details as { tx: string }).tx)
          : err.code
      throw new Error(txCode)
    }
    throw err
  }
}
