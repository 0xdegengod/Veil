import { decodeEventLog } from 'viem'
import { getWalletClient, readContract, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '../wagmi/config.ts'
import { getFhevmInstance } from '../fhe/instance.ts'
import { SEPOLIA_CONFIDENTIAL_USDC_ADDRESS } from '../constants/app.ts'

const ZERO_HANDLE = `0x${'0'.repeat(64)}` as const

const unwrapAbi = [
  {
    type: 'function',
    name: 'confidentialBalanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'unwrap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'finalizeUnwrap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'unwrapRequestId', type: 'bytes32' },
      { name: 'cleartextAmount', type: 'uint64' },
      { name: 'decryptionProof', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'UnwrapRequested',
    inputs: [
      { indexed: true, name: 'receiver', type: 'address' },
      { indexed: true, name: 'unwrapRequestId', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'bytes32' },
    ],
  },
] as const

export type UnwrapPhase = 'requesting' | 'decrypting' | 'finalizing'

/**
 * Unwrap the caller's entire confidential cUSD balance back into the underlying USDC.
 *
 * Two-step async ERC-7984 flow:
 *  1. unwrap(owner, owner, balanceHandle) — burns cUSD, emits UnwrapRequested with an encrypted amount
 *  2. public-decrypt that amount via the relayer, then finalizeUnwrap(id, cleartext, proof) — releases USDC
 */
export async function unwrapAllConfidentialUsdc(input?: {
  onPhase?: (phase: UnwrapPhase) => void
}): Promise<{ units: bigint }> {
  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const owner = walletClient.account.address
  const wrapper = SEPOLIA_CONFIDENTIAL_USDC_ADDRESS

  const handle = (await readContract(wagmiConfig, {
    address: wrapper,
    abi: unwrapAbi,
    functionName: 'confidentialBalanceOf',
    args: [owner],
  })) as `0x${string}`

  if (handle.toLowerCase() === ZERO_HANDLE) throw new Error('no_confidential_balance')

  input?.onPhase?.('requesting')
  const requestHash = await walletClient.writeContract({
    account: walletClient.account,
    address: wrapper,
    abi: unwrapAbi,
    functionName: 'unwrap',
    args: [owner, owner, handle],
    chain: walletClient.chain,
  })
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: requestHash })

  let unwrapRequestId: `0x${string}` | null = null
  let amountHandle: `0x${string}` | null = null
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== wrapper.toLowerCase()) continue
    try {
      const decoded = decodeEventLog({ abi: unwrapAbi, data: log.data, topics: log.topics })
      if (decoded.eventName === 'UnwrapRequested') {
        unwrapRequestId = decoded.args.unwrapRequestId as `0x${string}`
        amountHandle = decoded.args.amount as `0x${string}`
        break
      }
    } catch {
      continue
    }
  }

  if (!unwrapRequestId || !amountHandle) throw new Error('unwrap_request_not_found')

  input?.onPhase?.('decrypting')
  const fhe = await getFhevmInstance()
  const publicResult = await fhe.publicDecrypt([amountHandle])
  const cleartextValues = Object.values(publicResult.clearValues)
  const rawCleartext = cleartextValues[0]
  const cleartext =
    typeof rawCleartext === 'bigint'
      ? rawCleartext
      : BigInt((rawCleartext as string | number | boolean | undefined) ?? 0)

  input?.onPhase?.('finalizing')
  const finalizeHash = await walletClient.writeContract({
    account: walletClient.account,
    address: wrapper,
    abi: unwrapAbi,
    functionName: 'finalizeUnwrap',
    args: [unwrapRequestId, cleartext, publicResult.decryptionProof],
    chain: walletClient.chain,
  })
  await waitForTransactionReceipt(wagmiConfig, { hash: finalizeHash })

  return { units: cleartext }
}
