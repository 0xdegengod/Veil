import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { normalizeAddress } from './normalize.ts'

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'
const TX_LOOKUP_ATTEMPTS = 6
const TX_LOOKUP_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function verifyEthRepaymentTx(input: {
  txHash: `0x${string}`
  participantAddress: string
  payeeAddress: string
  expectedWei?: bigint
  rpcUrl?: string
}): Promise<void> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(input.rpcUrl ?? process.env.SEPOLIA_RPC_URL ?? DEFAULT_SEPOLIA_RPC),
  })

  let tx: Awaited<ReturnType<typeof client.getTransaction>> | null = null
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null = null

  for (let attempt = 0; attempt < TX_LOOKUP_ATTEMPTS; attempt++) {
    ;[tx, receipt] = await Promise.all([
      client.getTransaction({ hash: input.txHash }),
      client.getTransactionReceipt({ hash: input.txHash }),
    ])

    if (tx && receipt) break
    if (attempt < TX_LOOKUP_ATTEMPTS - 1) {
      await sleep(TX_LOOKUP_DELAY_MS)
    }
  }

  if (!tx) throw new Error('tx_not_found')
  if (!receipt || receipt.status !== 'success') throw new Error('tx_failed')

  const from = normalizeAddress(tx.from)
  const to = tx.to ? normalizeAddress(tx.to) : null
  const participant = normalizeAddress(input.participantAddress)
  const payee = normalizeAddress(input.payeeAddress)

  if (from !== participant) throw new Error('tx_sender_mismatch')
  if (!to || to !== payee) throw new Error('tx_recipient_mismatch')

  if (input.expectedWei != null && input.expectedWei > 0n) {
    const minWei = (input.expectedWei * 99n) / 100n
    if (tx.value < minWei) throw new Error('tx_value_insufficient')
  } else if (tx.value <= 0n) {
    throw new Error('tx_value_zero')
  }
}
