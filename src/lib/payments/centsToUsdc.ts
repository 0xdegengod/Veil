/** Convert USD cents to Sepolia USDC base units (6 decimals). 1 cent = 10_000 units. */
export function centsToUsdcUnits(amountCents: number): bigint {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0n
  return BigInt(Math.round(amountCents)) * 10_000n
}

export function formatUsdcUnits(units: bigint): string {
  const whole = units / 1_000_000n
  const frac = units % 1_000_000n
  if (frac === 0n) return whole.toString()
  const fracStr = frac.toString().padStart(6, '0').replace(/0+$/, '')
  return `${whole}.${fracStr}`
}
