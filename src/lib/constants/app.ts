export const BALANCE_AUTO_LOCK_MS = 5 * 60 * 1000
export const CENT_MULTIPLIER = 100
export const SEPOLIA_CHAIN_ID = 11155111
export const THEME_STORAGE_KEY = 'veil-theme'

/** On-chain payment method for expense repayments. */
export type PayMethod = 'SEPOLIA_ETH'

/** USD per 1 ETH — override via VITE_ETH_USD_PRICE for repayment quotes. */
export const DEFAULT_ETH_USD_PRICE = Number(
  import.meta.env.VITE_ETH_USD_PRICE ?? '3000',
)
