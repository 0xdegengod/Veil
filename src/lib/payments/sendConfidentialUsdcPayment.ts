import { erc20Abi, maxUint256 } from 'viem'
import { getWalletClient, readContract, waitForTransactionReceipt } from '@wagmi/core'
import {
  SEPOLIA_CONFIDENTIAL_USDC_ADDRESS,
  SEPOLIA_USDC_ADDRESS,
} from '../constants/app.ts'
import { encryptTransferAmount } from '../fhe/encryptTransferAmount.ts'
import { wagmiConfig } from '../wagmi/config.ts'
import { confidentialUsdcWrapperAbi } from './confidentialUsdcAbi.ts'
import { centsToUsdcUnits } from './centsToUsdc.ts'

export type ConfidentialPayPhase = 'approving' | 'encrypting' | 'confirming'

export async function sendConfidentialUsdcPayment(input: {
  payeeAddress: `0x${string}`
  amountCents: number
  onPhase?: (phase: ConfidentialPayPhase) => void
}): Promise<{ txHash: `0x${string}`; units: bigint }> {
  const units = centsToUsdcUnits(input.amountCents)
  if (units <= 0n) throw new Error('payment_amount_invalid')

  const walletClient = await getWalletClient(wagmiConfig)
  if (!walletClient?.account) throw new Error('wallet_not_connected')

  const payer = walletClient.account.address
  const wrapper = SEPOLIA_CONFIDENTIAL_USDC_ADDRESS

  const allowance = (await readContract(wagmiConfig, {
    address: SEPOLIA_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [payer, wrapper],
  })) as bigint

  if (allowance < units) {
    input.onPhase?.('approving')
    const approveHash = await walletClient.writeContract({
      account: walletClient.account,
      address: SEPOLIA_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [wrapper, maxUint256],
      chain: walletClient.chain,
    })
    await waitForTransactionReceipt(wagmiConfig, { hash: approveHash })
  }

  input.onPhase?.('confirming')
  const wrapHash = await walletClient.writeContract({
    account: walletClient.account,
    address: wrapper,
    abi: confidentialUsdcWrapperAbi,
    functionName: 'wrap',
    args: [payer, units],
    chain: walletClient.chain,
  })
  await waitForTransactionReceipt(wagmiConfig, { hash: wrapHash })

  input.onPhase?.('encrypting')
  const { encryptedAmount, inputProof } = await encryptTransferAmount(wrapper, payer, units)

  input.onPhase?.('confirming')
  const txHash = await walletClient.writeContract({
    account: walletClient.account,
    address: wrapper,
    abi: confidentialUsdcWrapperAbi,
    functionName: 'confidentialTransfer',
    args: [input.payeeAddress, encryptedAmount, inputProof],
    chain: walletClient.chain,
  })

  await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
  return { txHash, units }
}
