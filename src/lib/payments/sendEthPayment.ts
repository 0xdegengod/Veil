import { getWalletClient, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '../wagmi/config.ts'
import { centsToEthWei } from './centsToEth.ts'

export async function sendSepoliaEthPayment(input: {
  payeeAddress: `0x${string}`
  amountCents: number
  ethUsdPrice: number
}): Promise<{ txHash: `0x${string}`; wei: bigint }> {
  const wei = centsToEthWei(input.amountCents, input.ethUsdPrice)
  if (wei <= 0n) throw new Error('payment_amount_invalid')

  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const txHash = await walletClient.sendTransaction({
    account: walletClient.account,
    to: input.payeeAddress,
    value: wei,
    chain: walletClient.chain,
  })

  await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
  return { txHash, wei }
}
