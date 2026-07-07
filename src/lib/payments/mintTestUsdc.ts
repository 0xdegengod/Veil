import { getWalletClient, waitForTransactionReceipt } from '@wagmi/core'
import { SEPOLIA_USDC_ADDRESS, USDC_FAUCET_MINT_UNITS } from '../constants/app.ts'
import { wagmiConfig } from '../wagmi/config.ts'

const mockUsdcMintAbi = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

export async function mintTestUsdc(recipient: `0x${string}`): Promise<`0x${string}`> {
  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const hash = await walletClient.writeContract({
    account: walletClient.account,
    address: SEPOLIA_USDC_ADDRESS,
    abi: mockUsdcMintAbi,
    functionName: 'mint',
    args: [recipient, USDC_FAUCET_MINT_UNITS],
    chain: walletClient.chain,
  })

  await waitForTransactionReceipt(wagmiConfig, { hash })
  return hash
}
