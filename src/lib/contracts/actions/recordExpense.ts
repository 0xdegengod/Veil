import { getWalletClient, waitForTransactionReceipt } from '@wagmi/core'
import { parseEventLogs } from 'viem'
import { wagmiConfig } from '../../wagmi/config.ts'
import { encryptExpenseAmounts } from '../../fhe/encrypt.ts'
import { confidentialLedgerAbi } from '../abis.ts'
import { getContractAddresses } from '../addresses.ts'

export class FheNotConfiguredError extends Error {
  constructor(
    message = 'FHE encryption client is not configured. Set VITE_CONFIDENTIAL_LEDGER_ADDRESS and ensure the Zama relayer SDK can load.',
  ) {
    super(message)
    this.name = 'FheNotConfiguredError'
  }
}

export async function recordExpenseOnChain(
  chainId: number,
  chainGroupId: number,
  participantAddresses: `0x${string}`[],
  totalCents: number,
  shareCents: number[],
): Promise<number> {
  const addresses = getContractAddresses(chainId)
  const ledger = addresses?.confidentialLedger
  if (!ledger || ledger === '0x0000000000000000000000000000000000000000') {
    throw new FheNotConfiguredError()
  }

  if (participantAddresses.length !== shareCents.length) {
    throw new Error('participant_share_length_mismatch')
  }

  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const payer = walletClient.account.address
  const encrypted = await encryptExpenseAmounts(ledger, payer, totalCents, shareCents)

  const hash = await walletClient.writeContract({
    address: ledger,
    abi: confidentialLedgerAbi,
    functionName: 'recordExpense',
    args: [
      BigInt(chainGroupId),
      participantAddresses,
      encrypted.encTotal,
      encrypted.encShares,
      encrypted.inputProof,
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  })

  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
  const events = parseEventLogs({
    abi: confidentialLedgerAbi,
    logs: receipt.logs,
    eventName: 'ExpenseRecorded',
  })

  if (!events[0]) throw new Error('expense_recorded_event_missing')

  return Number(events[0].args.expenseId)
}
