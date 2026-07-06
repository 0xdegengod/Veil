import { getWalletClient, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '../../wagmi/config.ts'
import { groupRegistryAbi } from '../abis.ts'
import { getContractAddresses } from '../addresses.ts'
import { ContractNotConfiguredError } from './createGroup.ts'

export async function addMemberOnChain(
  chainId: number,
  chainGroupId: number,
  memberAddress: `0x${string}`,
): Promise<void> {
  const addresses = getContractAddresses(chainId)
  if (!addresses?.groupRegistry || addresses.groupRegistry === '0x0000000000000000000000000000000000000000') {
    throw new ContractNotConfiguredError()
  }

  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient) throw new Error('wallet_not_connected')

  const hash = await walletClient.writeContract({
    address: addresses.groupRegistry,
    abi: groupRegistryAbi,
    functionName: 'addMember',
    args: [BigInt(chainGroupId), memberAddress],
    chain: walletClient.chain,
    account: walletClient.account,
  })

  await waitForTransactionReceipt(wagmiConfig, { hash })
}
