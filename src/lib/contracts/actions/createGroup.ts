import { getWalletClient, waitForTransactionReceipt } from '@wagmi/core'
import { parseEventLogs } from 'viem'
import { wagmiConfig } from '../../wagmi/config.ts'
import { groupRegistryAbi } from '../abis.ts'
import { getContractAddresses } from '../addresses.ts'

export class ContractNotConfiguredError extends Error {
  constructor(message = 'Contracts are not deployed. Set VITE_GROUP_REGISTRY_ADDRESS in .env') {
    super(message)
    this.name = 'ContractNotConfiguredError'
  }
}

export async function createGroupOnChain(
  chainId: number,
  initialMembers: `0x${string}`[],
): Promise<number> {
  const addresses = getContractAddresses(chainId)
  if (!addresses?.groupRegistry || addresses.groupRegistry === '0x0000000000000000000000000000000000000000') {
    throw new ContractNotConfiguredError()
  }

  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient) throw new Error('wallet_not_connected')

  const hash = await walletClient.writeContract({
    address: addresses.groupRegistry,
    abi: groupRegistryAbi,
    functionName: 'createGroup',
    args: [initialMembers],
    chain: walletClient.chain,
    account: walletClient.account,
  })

  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
  const events = parseEventLogs({
    abi: groupRegistryAbi,
    logs: receipt.logs,
    eventName: 'GroupCreated',
  })

  if (!events[0]) throw new Error('group_created_event_missing')

  return Number(events[0].args.groupId)
}
