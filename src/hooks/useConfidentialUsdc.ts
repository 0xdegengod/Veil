import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { useWallet } from './useWallet.ts'
import { SEPOLIA_CONFIDENTIAL_USDC_ADDRESS } from '../lib/constants/app.ts'
import {
  decryptConfidentialUsdcBalance,
  readConfidentialUsdcHandle,
} from '../lib/payments/confidentialUsdcBalance.ts'
import {
  unwrapAllConfidentialUsdc,
  type UnwrapPhase,
} from '../lib/payments/unwrapConfidentialUsdc.ts'

const ZERO_HANDLE = `0x${'0'.repeat(64)}` as const
const CACHE_KEY = 'veil-cusd-units'

const confidentialBalanceAbi = [
  {
    type: 'function',
    name: 'confidentialBalanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

type CachedReveal = {
  address: string
  units: string
  hasDecrypted: true
}

function loadCachedReveal(address: string | undefined): { units: bigint; hasDecrypted: true } | null {
  if (!address) return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedReveal
    if (parsed.address.toLowerCase() !== address.toLowerCase()) return null
    if (!parsed.hasDecrypted) return null
    return { units: BigInt(parsed.units), hasDecrypted: true }
  } catch {
    return null
  }
}

function saveCachedReveal(address: string, units: bigint): void {
  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      address: address.toLowerCase(),
      units: units.toString(),
      hasDecrypted: true,
    } satisfies CachedReveal),
  )
}

function clearCachedReveal(): void {
  sessionStorage.removeItem(CACHE_KEY)
}

export function clearConfidentialUsdcCache(): void {
  clearCachedReveal()
}

export type ConfidentialUsdcRevealStatus = 'idle' | 'signing' | 'error'
export type ConfidentialUsdcUnwrapStatus = 'idle' | UnwrapPhase | 'done'

export function useConfidentialUsdc() {
  const { address, isConnected, chainId } = useWallet()
  const queryClient = useQueryClient()
  const [units, setUnits] = useState<bigint | null>(null)
  const [hasDecrypted, setHasDecrypted] = useState(false)
  const [revealStatus, setRevealStatus] = useState<ConfidentialUsdcRevealStatus>('idle')
  const [unwrapStatus, setUnwrapStatus] = useState<ConfidentialUsdcUnwrapStatus>('idle')

  const handleQuery = useReadContract({
    address: SEPOLIA_CONFIDENTIAL_USDC_ADDRESS,
    abi: confidentialBalanceAbi,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(address), refetchInterval: 20_000 },
  })

  const handle = handleQuery.data as `0x${string}` | undefined
  const hasEncryptedBalance =
    handle != null && handle.toLowerCase() !== ZERO_HANDLE

  useEffect(() => {
    if (!address) {
      setUnits(null)
      setHasDecrypted(false)
      return
    }
    const cached = loadCachedReveal(address)
    if (cached) {
      setUnits(cached.units)
      setHasDecrypted(true)
    } else {
      setUnits(null)
      setHasDecrypted(false)
    }
  }, [address])

  const reveal = useCallback(async () => {
    if (!address || !chainId) return
    setRevealStatus('signing')
    try {
      const value = await decryptConfidentialUsdcBalance(chainId, address)
      setUnits(value)
      setHasDecrypted(true)
      saveCachedReveal(address, value)
      setRevealStatus('idle')
    } catch {
      setRevealStatus('error')
    }
  }, [address, chainId])

  const unwrap = useCallback(async () => {
    setUnwrapStatus('requesting')
    try {
      const { units: unwrapped } = await unwrapAllConfidentialUsdc({
        onPhase: (phase) => setUnwrapStatus(phase),
      })
      setUnits(null)
      setHasDecrypted(false)
      clearCachedReveal()
      setUnwrapStatus('done')
      await queryClient.invalidateQueries()
      void handleQuery.refetch()
      return unwrapped
    } catch (err) {
      setUnwrapStatus('idle')
      throw err
    }
  }, [queryClient, handleQuery])

  const refreshHandle = useCallback(async () => {
    if (!address) return
    const h = await readConfidentialUsdcHandle(address)
    if (h.toLowerCase() === ZERO_HANDLE) {
      setUnits(null)
      setHasDecrypted(false)
      clearCachedReveal()
    }
    void handleQuery.refetch()
  }, [address, handleQuery])

  const isRevealed = hasDecrypted && units != null
  const isUnwrapping = unwrapStatus !== 'idle' && unwrapStatus !== 'done'
  const showBadge = isConnected && (hasEncryptedBalance || isRevealed)

  return {
    units,
    isRevealed,
    hasEncryptedBalance,
    showBadge,
    revealStatus,
    unwrapStatus,
    isUnwrapping,
    isLoadingHandle: handleQuery.isLoading,
    reveal,
    unwrap,
    refreshHandle,
  }
}
