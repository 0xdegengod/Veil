import { createPublicClient, decodeEventLog, decodeFunctionData, http } from 'viem'
import { sepolia } from 'viem/chains'
import { normalizeAddress } from './normalize.ts'

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'
const DEFAULT_CONFIDENTIAL_USDC = '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639'
const TX_LOOKUP_ATTEMPTS = 6
const TX_LOOKUP_DELAY_MS = 2000

const confidentialTransferAbi = [
  {
    type: 'function',
    name: 'confidentialTransfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ name: 'transferred', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
] as const

const confidentialTransferEvent = {
  type: 'event',
  name: 'ConfidentialTransfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'amount', type: 'bytes32' },
  ],
} as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Verify a confidential cUSD repayment (ERC-7984 transfer — amount stays encrypted on-chain). */
export async function verifyUsdcRepaymentTx(input: {
  txHash: `0x${string}`
  participantAddress: string
  payeeAddress: string
  wrapperAddress?: string
  rpcUrl?: string
}): Promise<void> {
  const wrapper = normalizeAddress(
    input.wrapperAddress ??
      process.env.SEPOLIA_CONFIDENTIAL_USDC_ADDRESS ??
      DEFAULT_CONFIDENTIAL_USDC,
  )
  const client = createPublicClient({
    chain: sepolia,
    transport: http(input.rpcUrl ?? process.env.SEPOLIA_RPC_URL ?? DEFAULT_SEPOLIA_RPC),
  })

  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null = null

  for (let attempt = 0; attempt < TX_LOOKUP_ATTEMPTS; attempt++) {
    receipt = await client.getTransactionReceipt({ hash: input.txHash })
    if (receipt) break
    if (attempt < TX_LOOKUP_ATTEMPTS - 1) await sleep(TX_LOOKUP_DELAY_MS)
  }

  if (!receipt || receipt.status !== 'success') throw new Error('tx_failed')

  const participant = normalizeAddress(input.participantAddress)
  const payee = normalizeAddress(input.payeeAddress)

  const tx = await client.getTransaction({ hash: input.txHash })
  if (!tx) throw new Error('tx_not_found')
  if (normalizeAddress(tx.from) !== participant) throw new Error('tx_sender_mismatch')
  if (normalizeAddress(tx.to ?? '') !== wrapper) throw new Error('tx_recipient_mismatch')

  let transferTo: string | null = null
  try {
    const decoded = decodeFunctionData({
      abi: confidentialTransferAbi,
      data: tx.input,
    })
    if (decoded.functionName === 'confidentialTransfer') {
      transferTo = normalizeAddress(decoded.args[0] as string)
    }
  } catch {
    // Fall back to event log decoding below.
  }

  if (transferTo != null && transferTo !== payee) {
    throw new Error('tx_recipient_mismatch')
  }

  let matchedEvent = false
  for (const log of receipt.logs) {
    if (normalizeAddress(log.address) !== wrapper) continue
    try {
      const decoded = decodeEventLog({
        abi: [confidentialTransferEvent],
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName !== 'ConfidentialTransfer') continue
      const from = normalizeAddress(decoded.args.from as string)
      const to = normalizeAddress(decoded.args.to as string)
      if (from === participant && to === payee) {
        matchedEvent = true
        break
      }
    } catch {
      continue
    }
  }

  if (matchedEvent) return
  if (transferTo === payee) return
  throw new Error('tx_transfer_not_found')
}
