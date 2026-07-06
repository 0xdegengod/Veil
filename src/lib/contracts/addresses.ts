import { SEPOLIA_CHAIN_ID } from '../constants/app.ts'

export type ContractAddresses = {
  groupRegistry: `0x${string}`
  confidentialLedger: `0x${string}`
  settlements: `0x${string}`
}

const ZERO = '0x0000000000000000000000000000000000000000'

function parseAddress(value: string | undefined): `0x${string}` | undefined {
  if (!value || value === ZERO) return undefined
  return value as `0x${string}`
}

export function getContractAddresses(chainId: number): ContractAddresses | undefined {
  if (chainId !== SEPOLIA_CHAIN_ID) return undefined

  const groupRegistry = parseAddress(import.meta.env.VITE_GROUP_REGISTRY_ADDRESS)
  const confidentialLedger = parseAddress(import.meta.env.VITE_CONFIDENTIAL_LEDGER_ADDRESS)
  const settlements = parseAddress(import.meta.env.VITE_SETTLEMENTS_ADDRESS)

  if (!groupRegistry && !confidentialLedger && !settlements) return undefined

  return {
    groupRegistry: groupRegistry ?? ZERO,
    confidentialLedger: confidentialLedger ?? ZERO,
    settlements: settlements ?? ZERO,
  }
}

export function isGroupRegistryReady(chainId: number): boolean {
  const addrs = getContractAddresses(chainId)
  return Boolean(addrs?.groupRegistry && addrs.groupRegistry !== ZERO)
}

export function isLedgerReady(chainId: number): boolean {
  const addrs = getContractAddresses(chainId)
  return Boolean(addrs?.confidentialLedger && addrs.confidentialLedger !== ZERO)
}
