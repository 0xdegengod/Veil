import type { ClearValueType } from '@zama-fhe/relayer-sdk/web'
import { getWalletClient } from '@wagmi/core'
import { wagmiConfig } from '../wagmi/config.ts'
import { getContractAddresses } from '../contracts/addresses.ts'
import { getFhevmInstance } from './instance.ts'

export type HandleContractPair = {
  handle: `0x${string}`
  contractAddress: `0x${string}`
}

const ZERO_HANDLE = `0x${'0'.repeat(64)}` as const
const DURATION_DAYS = 1

type DecryptAuth = {
  userAddress: string
  relayUserAddress: `0x${string}`
  chainId: number
  contractAddresses: string[]
  privateKey: string
  publicKey: string
  signature: string
  startTimestamp: number
}

let cachedAuth: DecryptAuth | null = null
let authInFlight: Promise<DecryptAuth> | null = null
const decryptedByKey = new Map<string, number>()

function cacheKey(pair: HandleContractPair): string {
  return `${pair.contractAddress}:${normalizeHandle(pair.handle)}`
}

function authExpired(auth: DecryptAuth): boolean {
  const expiresAt = auth.startTimestamp + DURATION_DAYS * 86_400
  return Math.floor(Date.now() / 1000) >= expiresAt
}

/** Clear cached decrypt auth + plaintext handle cache (call on wallet change / disconnect). */
export function clearDecryptSession(): void {
  cachedAuth = null
  authInFlight = null
  decryptedByKey.clear()
}

export function normalizeHandle(handle: `0x${string}`): `0x${string}` {
  return handle.toLowerCase() as `0x${string}`
}

export function isZeroHandle(handle: `0x${string}`): boolean {
  return normalizeHandle(handle) === ZERO_HANDLE
}

export function clearValueToCents(value: ClearValueType | undefined): number {
  if (value === undefined) return 0
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return Number(BigInt(value))
}

function dedupePairs(pairs: HandleContractPair[]): HandleContractPair[] {
  const seen = new Set<string>()
  const out: HandleContractPair[] = []
  for (const pair of pairs) {
    if (isZeroHandle(pair.handle)) continue
    const key = cacheKey(pair)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      handle: normalizeHandle(pair.handle),
      contractAddress: pair.contractAddress,
    })
  }
  return out
}

async function getDecryptAuth(chainId: number, ledger: `0x${string}`): Promise<DecryptAuth> {
  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const relayUserAddress = walletClient.account.address
  const userAddress = relayUserAddress.toLowerCase()
  const contractAddresses = [ledger]

  if (
    cachedAuth &&
    !authExpired(cachedAuth) &&
    cachedAuth.userAddress === userAddress &&
    cachedAuth.chainId === chainId &&
    cachedAuth.contractAddresses[0] === ledger
  ) {
    return cachedAuth
  }

  if (authInFlight) return authInFlight

  authInFlight = (async () => {
    const fhe = await getFhevmInstance()
    const keypair = fhe.generateKeypair()
    const startTimestamp = Math.floor(Date.now() / 1000)

    const eip712 = fhe.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimestamp,
      DURATION_DAYS,
    )

    const signature = await walletClient.signTypedData({
      account: walletClient.account,
      domain: eip712.domain,
      types: {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      primaryType: 'UserDecryptRequestVerification',
      message: {
        ...eip712.message,
        startTimestamp: BigInt(eip712.message.startTimestamp),
        durationDays: BigInt(eip712.message.durationDays),
      },
    })

    cachedAuth = {
      userAddress,
      relayUserAddress,
      chainId,
      contractAddresses,
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey,
      signature,
      startTimestamp,
    }

    return cachedAuth
  })()

  try {
    return await authInFlight
  } finally {
    authInFlight = null
  }
}

/**
 * User-decrypt ACL-authorized ciphertext handles via the Zama relayer (EIP-712).
 * Signs once per wallet session; caches decrypted handle values for reuse.
 */
export async function userDecryptHandles(
  chainId: number,
  pairs: HandleContractPair[],
): Promise<Map<`0x${string}`, number>> {
  const unique = dedupePairs(pairs)
  if (unique.length === 0) return new Map()

  const addresses = getContractAddresses(chainId)
  const ledger = addresses?.confidentialLedger
  if (!ledger || ledger === '0x0000000000000000000000000000000000000000') {
    throw new Error('ledger_not_configured')
  }

  const missing = unique.filter((pair) => !decryptedByKey.has(cacheKey(pair)))
  if (missing.length > 0) {
    const auth = await getDecryptAuth(chainId, ledger)
    const fhe = await getFhevmInstance()

    const results = await fhe.userDecrypt(
      missing,
      auth.privateKey,
      auth.publicKey,
      auth.signature,
      auth.contractAddresses,
      auth.relayUserAddress,
      auth.startTimestamp,
      DURATION_DAYS,
    )

    for (const pair of missing) {
      const handle = normalizeHandle(pair.handle)
      decryptedByKey.set(cacheKey(pair), clearValueToCents(results[handle]))
    }
  }

  const centsByHandle = new Map<`0x${string}`, number>()
  for (const pair of unique) {
    const handle = normalizeHandle(pair.handle)
    centsByHandle.set(handle, decryptedByKey.get(cacheKey(pair)) ?? 0)
  }
  return centsByHandle
}

export function centsForHandle(
  map: Map<`0x${string}`, number>,
  handle: `0x${string}`,
): number {
  if (isZeroHandle(handle)) return 0
  return map.get(normalizeHandle(handle)) ?? 0
}
