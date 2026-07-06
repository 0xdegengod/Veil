import { readContract } from '@wagmi/core'
import { wagmiConfig } from '../wagmi/config.ts'
import { confidentialLedgerAbi } from './abis.ts'
import { getContractAddresses } from './addresses.ts'

export type ChainExpenseRow = {
  walletAddress: `0x${string}`
  shareHandle: `0x${string}`
  settled: boolean
}

export type ChainExpenseData = {
  totalHandle: `0x${string}`
  participants: ChainExpenseRow[]
}

export type EncryptedBalanceHandles = {
  __encrypted: true
  chainId: number
  chainGroupId: number
  paidHandle: `0x${string}`
  owedHandle: `0x${string}`
  ledgerAddress: `0x${string}`
}

function ledgerAddress(chainId: number): `0x${string}` {
  const addresses = getContractAddresses(chainId)
  const ledger = addresses?.confidentialLedger
  if (!ledger || ledger === '0x0000000000000000000000000000000000000000') {
    throw new Error('ledger_not_configured')
  }
  return ledger
}

export async function readExpenseFromChain(
  chainId: number,
  chainExpenseId: number,
): Promise<ChainExpenseData> {
  const address = ledgerAddress(chainId)

  const [totalHandle, count] = await Promise.all([
    readContract(wagmiConfig, {
      address,
      abi: confidentialLedgerAbi,
      functionName: 'expenseTotal',
      args: [BigInt(chainExpenseId)],
    }) as Promise<`0x${string}`>,
    readContract(wagmiConfig, {
      address,
      abi: confidentialLedgerAbi,
      functionName: 'expenseParticipantCount',
      args: [BigInt(chainExpenseId)],
    }) as Promise<bigint>,
  ])

  const participantCount = Number(count)
  const participants: ChainExpenseRow[] = []

  for (let i = 0; i < participantCount; i += 1) {
    const walletAddress = (await readContract(wagmiConfig, {
      address,
      abi: confidentialLedgerAbi,
      functionName: 'expenseParticipantAt',
      args: [BigInt(chainExpenseId), BigInt(i)],
    })) as `0x${string}`

    const [shareHandle, settled] = await Promise.all([
      readContract(wagmiConfig, {
        address,
        abi: confidentialLedgerAbi,
        functionName: 'expenseShareOf',
        args: [BigInt(chainExpenseId), walletAddress],
      }) as Promise<`0x${string}`>,
      readContract(wagmiConfig, {
        address,
        abi: confidentialLedgerAbi,
        functionName: 'isShareSettled',
        args: [BigInt(chainExpenseId), walletAddress],
      }) as Promise<boolean>,
    ])

    participants.push({ walletAddress, shareHandle, settled })
  }

  return { totalHandle, participants }
}

export async function readBalanceHandles(
  chainId: number,
  chainGroupId: number,
  memberAddress: `0x${string}`,
): Promise<EncryptedBalanceHandles> {
  const address = ledgerAddress(chainId)
  const groupId = BigInt(chainGroupId)

  const [paidHandle, owedHandle] = await Promise.all([
    readContract(wagmiConfig, {
      address,
      abi: confidentialLedgerAbi,
      functionName: 'paidOf',
      args: [groupId, memberAddress],
    }) as Promise<`0x${string}`>,
    readContract(wagmiConfig, {
      address,
      abi: confidentialLedgerAbi,
      functionName: 'owedOf',
      args: [groupId, memberAddress],
    }) as Promise<`0x${string}`>,
  ])

  return {
    __encrypted: true,
    chainId,
    chainGroupId,
    paidHandle,
    owedHandle,
    ledgerAddress: address,
  }
}

export function isEncryptedBalanceHandle(
  handle: unknown,
): handle is EncryptedBalanceHandles {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    '__encrypted' in handle &&
    (handle as EncryptedBalanceHandles).__encrypted === true
  )
}
