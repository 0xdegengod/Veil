/** Normalize Ethereum addresses for consistent storage and comparison. */
export function normalizeAddress(address: string): string {
  return address.toLowerCase()
}
