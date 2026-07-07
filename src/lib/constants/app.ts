export const BALANCE_AUTO_LOCK_MS = 5 * 60 * 1000
export const CENT_MULTIPLIER = 100
export const SEPOLIA_CHAIN_ID = 11155111
export const THEME_STORAGE_KEY = 'veil-theme'

/** On-chain payment method for expense repayments. */
export type PayMethod = 'SEPOLIA_ETH' | 'CUSD'

/** Zama mock USDC on Sepolia — underlying token for confidential cUSD repayments. */
export const ZAMA_MOCK_USDC_ADDRESS =
  '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF' as const

/** Underlying ERC-20 used before wrapping into confidential cUSD. */
export const SEPOLIA_USDC_ADDRESS = (import.meta.env.VITE_SEPOLIA_USDC_ADDRESS ??
  ZAMA_MOCK_USDC_ADDRESS) as `0x${string}`

/** Zama cUSDCMock wrapper (ERC-7984) — transfer amounts stay encrypted on-chain. */
export const SEPOLIA_CONFIDENTIAL_USDC_ADDRESS = (import.meta.env
  .VITE_SEPOLIA_CONFIDENTIAL_USDC_ADDRESS ??
  '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639') as `0x${string}`

/** In-app mint when the underlying token exposes a public mint (Zama mock USDC or Veil MockUSDC). */
export const USDC_FAUCET_MINT_ENABLED =
  import.meta.env.VITE_USDC_FAUCET_MINT === 'true' ||
  SEPOLIA_USDC_ADDRESS.toLowerCase() === ZAMA_MOCK_USDC_ADDRESS.toLowerCase()

/** USDC amount minted per faucet click. */
export const USDC_FAUCET_MINT_AMOUNT = 100

export const USDC_FAUCET_MINT_UNITS = BigInt(USDC_FAUCET_MINT_AMOUNT) * 1_000_000n

export const CIRCLE_USDC_FAUCET_URL = 'https://faucet.circle.com/'
export const SEPOLIA_ETH_FAUCET_URL = 'https://sepoliafaucet.com'

/** USD per 1 ETH — override via VITE_ETH_USD_PRICE for repayment quotes. */
export const DEFAULT_ETH_USD_PRICE = Number(
  import.meta.env.VITE_ETH_USD_PRICE ?? '3000',
)
