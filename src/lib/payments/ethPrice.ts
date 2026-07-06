import { DEFAULT_ETH_USD_PRICE } from '../constants/app.ts'

/** Live ETH/USD quote with env fallback (used for Sepolia repayment conversion). */
export async function getEthUsdPrice(): Promise<number> {
  const envPrice = import.meta.env.VITE_ETH_USD_PRICE
  if (envPrice) {
    const parsed = Number(envPrice)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    )
    if (!res.ok) return DEFAULT_ETH_USD_PRICE
    const data = (await res.json()) as { ethereum?: { usd?: number } }
    const price = data.ethereum?.usd
    if (typeof price === 'number' && price > 0) return price
  } catch {
    // Offline or rate-limited — use default
  }

  return DEFAULT_ETH_USD_PRICE
}
