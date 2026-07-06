import { parseEther } from 'viem'
import { CENT_MULTIPLIER } from '../constants/app.ts'

/** Convert USD cents to Sepolia ETH wei using a USD/ETH price. */
export function centsToEthWei(amountCents: number, ethUsdPrice: number): bigint {
  if (amountCents <= 0 || ethUsdPrice <= 0) return 0n
  const usd = amountCents / CENT_MULTIPLIER
  const eth = usd / ethUsdPrice
  // Limit precision to avoid parseEther rounding surprises
  const ethStr = eth.toFixed(18).replace(/\.?0+$/, '')
  return parseEther(ethStr === '' || ethStr === '0' ? '0' : ethStr)
}

export function formatEthWei(wei: bigint): string {
  const eth = Number(wei) / 1e18
  if (eth === 0) return '0'
  if (eth < 0.0001) return eth.toExponential(4)
  return eth.toFixed(6).replace(/\.?0+$/, '')
}
