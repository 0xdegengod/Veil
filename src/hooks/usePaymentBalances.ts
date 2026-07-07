import { erc20Abi } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { SEPOLIA_USDC_ADDRESS } from '../lib/constants/app.ts'

export function usePaymentBalances() {
  const { address } = useAccount()

  const usdcQuery = useReadContract({
    address: SEPOLIA_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  })

  return {
    usdcBalance: usdcQuery.data as bigint | undefined,
    isLoading: usdcQuery.isLoading,
    isConnected: Boolean(address),
  }
}
