import { getEthUsdPrice } from '../payments/ethPrice.ts'
import { sendSepoliaEthPayment } from '../payments/sendEthPayment.ts'
import { recordExpenseRepayment } from '../api/expenses.ts'
import { ApiError } from '../api/client.ts'
import type { GroupAction } from '../../types/contracts.ts'
import type { PayMethod } from '../constants/app.ts'

export async function executePayAction(input: {
  method: PayMethod
  action: GroupAction
  groupId: string
}): Promise<void> {
  if (input.method !== 'SEPOLIA_ETH') {
    throw new Error('stablecoin_not_available_on_testnet')
  }

  if (!input.action.counterpartyAddress) {
    throw new Error('payee_address_missing')
  }

  const ethUsdPrice = await getEthUsdPrice()
  const { txHash, wei } = await sendSepoliaEthPayment({
    payeeAddress: input.action.counterpartyAddress as `0x${string}`,
    amountCents: input.action.amountCents,
    ethUsdPrice,
  })

  if (input.action.expenseId) {
    try {
      await recordExpenseRepayment(input.groupId, input.action.expenseId, {
        txHash,
        expectedWei: wei.toString(),
      })
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
}
