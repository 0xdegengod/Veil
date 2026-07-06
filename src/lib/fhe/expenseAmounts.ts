import type { ExpenseDetail, ExpenseShare } from '../../types/contracts.ts'
import { readExpenseFromChain } from '../contracts/readLedger.ts'
import { centsForHandle, userDecryptHandles, type HandleContractPair } from './userDecrypt.ts'

type ParticipantMeta = {
  walletAddress: string
  handle: string
}

export type ExpenseAmounts = {
  totalCents: number
  shares: ExpenseShare[]
  receivableCents: number
  pendingReceivableCents: number
  yourShareCents?: number
}

function buildDecryptPairs(
  ledgerAddress: `0x${string}`,
  totalHandle: `0x${string}`,
  participants: { walletAddress: string; shareHandle: `0x${string}` }[],
  viewerRole: ExpenseDetail['viewerRole'],
  viewerAddress: string,
): HandleContractPair[] {
  const pairs: HandleContractPair[] = [
    { handle: totalHandle, contractAddress: ledgerAddress },
  ]

  if (viewerRole === 'payer') {
    for (const row of participants) {
      pairs.push({ handle: row.shareHandle, contractAddress: ledgerAddress })
    }
    return pairs
  }

  if (viewerRole === 'participant') {
    const own = participants.find(
      (p) => p.walletAddress.toLowerCase() === viewerAddress.toLowerCase(),
    )
    if (own) {
      pairs.push({ handle: own.shareHandle, contractAddress: ledgerAddress })
    }
  }

  return pairs
}

export async function resolveExpenseAmounts(
  chainId: number,
  chainExpenseId: number,
  ledgerAddress: `0x${string}`,
  viewerRole: ExpenseDetail['viewerRole'],
  viewerAddress: string,
  payerAddress: string,
  payerHandle: string,
  participantMeta: ParticipantMeta[],
  options?: {
    /** Backend-verified repayments (ETH tx confirmed off-chain). */
    repaidWallets?: Set<string>
  },
): Promise<ExpenseAmounts> {
  const chain = await readExpenseFromChain(chainId, chainExpenseId)
  const handleByWallet = new Map(
    participantMeta.map((p) => [p.walletAddress.toLowerCase(), p.handle]),
  )

  const pairs = buildDecryptPairs(
    ledgerAddress,
    chain.totalHandle,
    chain.participants,
    viewerRole,
    viewerAddress,
  )

  const decrypted = await userDecryptHandles(chainId, pairs)
  const totalCents = centsForHandle(decrypted, chain.totalHandle)

  const visibleParticipants =
    viewerRole === 'payer'
      ? chain.participants
      : chain.participants.filter(
          (p) => p.walletAddress.toLowerCase() === viewerAddress.toLowerCase(),
        )

  const repaidWallets = options?.repaidWallets

  const shareStatus = (wallet: string, chainSettled: boolean): ExpenseShare['status'] => {
    const key = wallet.toLowerCase()
    if (repaidWallets?.has(key)) return 'paid'
    return chainSettled ? 'paid' : 'pending'
  }

  const shares: ExpenseShare[] = visibleParticipants.map((row) => {
    const isPayerRow = row.walletAddress.toLowerCase() === payerAddress.toLowerCase()
    return {
      memberAddress: row.walletAddress,
      memberHandle: isPayerRow
        ? payerHandle
        : (handleByWallet.get(row.walletAddress.toLowerCase()) ?? row.walletAddress),
      amountCents: centsForHandle(decrypted, row.shareHandle),
      status: shareStatus(row.walletAddress, row.settled),
    }
  })

  const payer = payerAddress.toLowerCase()
  const others = chain.participants.filter((p) => p.walletAddress.toLowerCase() !== payer)
  const receivableCents = others.reduce(
    (sum, row) => sum + centsForHandle(decrypted, row.shareHandle),
    0,
  )
  const pendingReceivableCents = others
    .filter((row) => shareStatus(row.walletAddress, row.settled) === 'pending')
    .reduce((sum, row) => sum + centsForHandle(decrypted, row.shareHandle), 0)

  const yourRow = chain.participants.find(
    (p) => p.walletAddress.toLowerCase() === viewerAddress.toLowerCase(),
  )

  return {
    totalCents,
    shares,
    receivableCents: viewerRole === 'payer' ? receivableCents : 0,
    pendingReceivableCents: viewerRole === 'payer' ? pendingReceivableCents : 0,
    yourShareCents: yourRow ? centsForHandle(decrypted, yourRow.shareHandle) : undefined,
  }
}
