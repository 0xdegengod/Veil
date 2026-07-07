import { getWalletClient, readContract } from '@wagmi/core'
import { wagmiConfig } from '../wagmi/config.ts'
import { getFhevmInstance } from '../fhe/instance.ts'
import { SEPOLIA_CONFIDENTIAL_USDC_ADDRESS } from '../constants/app.ts'

const DURATION_DAYS = 1
const ZERO_HANDLE = `0x${'0'.repeat(64)}` as const

const confidentialBalanceAbi = [
  {
    type: 'function',
    name: 'confidentialBalanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

type WrapperDecryptAuth = {
  userAddress: string
  relayUserAddress: `0x${string}`
  chainId: number
  privateKey: string
  publicKey: string
  signature: string
  startTimestamp: number
}

let cachedAuth: WrapperDecryptAuth | null = null
let authInFlight: Promise<WrapperDecryptAuth> | null = null

function authExpired(auth: WrapperDecryptAuth): boolean {
  return Math.floor(Date.now() / 1000) >= auth.startTimestamp + DURATION_DAYS * 86_400
}

/** Clear cached wrapper decrypt auth (call on wallet change / disconnect). */
export function clearConfidentialUsdcSession(): void {
  cachedAuth = null
  authInFlight = null
}

async function getWrapperDecryptAuth(chainId: number): Promise<WrapperDecryptAuth> {
  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const relayUserAddress = walletClient.account.address
  const userAddress = relayUserAddress.toLowerCase()

  if (
    cachedAuth &&
    !authExpired(cachedAuth) &&
    cachedAuth.userAddress === userAddress &&
    cachedAuth.chainId === chainId
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
      [SEPOLIA_CONFIDENTIAL_USDC_ADDRESS],
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

/** Read the caller's encrypted cUSD balance handle from the wrapper. */
export async function readConfidentialUsdcHandle(
  owner: `0x${string}`,
): Promise<`0x${string}`> {
  const handle = (await readContract(wagmiConfig, {
    address: SEPOLIA_CONFIDENTIAL_USDC_ADDRESS,
    abi: confidentialBalanceAbi,
    functionName: 'confidentialBalanceOf',
    args: [owner],
  })) as `0x${string}`
  return handle
}

/**
 * Decrypt the caller's confidential cUSD balance (6-decimal units).
 * Requires an EIP-712 signature the first time per wallet session.
 */
export async function decryptConfidentialUsdcBalance(
  chainId: number,
  owner: `0x${string}`,
): Promise<bigint> {
  const handle = await readConfidentialUsdcHandle(owner)
  if (handle.toLowerCase() === ZERO_HANDLE) return 0n

  const auth = await getWrapperDecryptAuth(chainId)
  const fhe = await getFhevmInstance()

  const normalizedHandle = handle.toLowerCase() as `0x${string}`
  const results = await fhe.userDecrypt(
    [{ handle: normalizedHandle, contractAddress: SEPOLIA_CONFIDENTIAL_USDC_ADDRESS }],
    auth.privateKey,
    auth.publicKey,
    auth.signature,
    [SEPOLIA_CONFIDENTIAL_USDC_ADDRESS],
    auth.relayUserAddress,
    auth.startTimestamp,
    DURATION_DAYS,
  )

  const value = results[normalizedHandle]
  if (typeof value === 'bigint') return value
  if (value == null) return 0n
  return BigInt(value as string | number)
}
